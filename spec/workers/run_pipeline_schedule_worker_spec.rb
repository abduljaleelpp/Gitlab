# frozen_string_literal: true

require 'spec_helper'

RSpec.describe RunPipelineScheduleWorker do
  describe '#perform' do
    let_it_be(:group) { create(:group) }
    let_it_be(:project) { create(:project, namespace: group) }
    let_it_be(:user) { create(:user) }
    let_it_be(:pipeline_schedule) { create(:ci_pipeline_schedule, :nightly, project: project ) }

    let(:worker) { described_class.new }

    context 'when a schedule not found' do
      it 'does not call the Service' do
        expect(Ci::CreatePipelineService).not_to receive(:new)
        expect(worker).not_to receive(:run_pipeline_schedule)

        worker.perform(non_existing_record_id, user.id)
      end
    end

    context 'when a schedule project is missing' do
      before do
        project.delete
      end

      it 'does not call the Service' do
        expect(Ci::CreatePipelineService).not_to receive(:new)
        expect(worker).not_to receive(:run_pipeline_schedule)

        worker.perform(pipeline_schedule.id, user.id)
      end
    end

    context 'when a user not found' do
      it 'does not call the Service' do
        expect(Ci::CreatePipelineService).not_to receive(:new)
        expect(worker).not_to receive(:run_pipeline_schedule)

        worker.perform(pipeline_schedule.id, non_existing_record_id)
      end
    end

    describe "#run_pipeline_schedule" do
      let(:create_pipeline_service) { instance_double(Ci::CreatePipelineService, execute: service_response) }
      let(:service_response) { instance_double(ServiceResponse, payload: pipeline, error?: false) }

      before do
        expect(Ci::CreatePipelineService).to receive(:new).with(project, user, ref: pipeline_schedule.ref).and_return(create_pipeline_service)

        expect(create_pipeline_service).to receive(:execute).with(:schedule, ignore_skip_ci: true, save_on_errors: false, schedule: pipeline_schedule).and_return(service_response)
      end

      context "when pipeline is persisted" do
        let(:pipeline) { instance_double(Ci::Pipeline, persisted?: true) }

        it "returns the service response" do
          expect(worker.perform(pipeline_schedule.id, user.id)).to eq(service_response)
        end

        it "does not log errors" do
          expect(worker).not_to receive(:log_extra_metadata_on_done)

          expect(worker.perform(pipeline_schedule.id, user.id)).to eq(service_response)
        end
      end

      context "when pipeline was not persisted" do
        let(:service_response) { instance_double(ServiceResponse, error?: true, message: "Error", payload: pipeline) }
        let(:pipeline) { instance_double(Ci::Pipeline, persisted?: false) }

        it "logs a pipeline creation error" do
          expect(worker)
            .to receive(:log_extra_metadata_on_done)
            .with(:pipeline_creation_error, service_response.message)
            .and_call_original

          expect(worker.perform(pipeline_schedule.id, user.id)).to eq(service_response.message)
        end
      end
    end

    context 'when database statement timeout happens' do
      before do
        allow(Ci::CreatePipelineService).to receive(:new) { raise ActiveRecord::StatementInvalid }

        expect(Gitlab::ErrorTracking)
          .to receive(:track_and_raise_for_dev_exception)
          .with(ActiveRecord::StatementInvalid,
                issue_url: 'https://gitlab.com/gitlab-org/gitlab-foss/issues/41231',
                schedule_id: pipeline_schedule.id).once
      end

      it 'increments Prometheus counter' do
        expect(Gitlab::Metrics)
          .to receive(:counter)
          .with(:pipeline_schedule_creation_failed_total, "Counter of failed attempts of pipeline schedule creation")
          .and_call_original

        worker.perform(pipeline_schedule.id, user.id)
      end

      it 'logging a pipeline error' do
        expect(Gitlab::AppLogger)
          .to receive(:error)
          .with(a_string_matching('ActiveRecord::StatementInvalid'))
          .and_call_original

        worker.perform(pipeline_schedule.id, user.id)
      end
    end
  end
end
