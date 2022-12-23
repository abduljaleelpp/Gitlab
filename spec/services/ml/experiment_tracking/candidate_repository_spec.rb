# frozen_string_literal: true

require 'spec_helper'

RSpec.describe ::Ml::ExperimentTracking::CandidateRepository do
  let_it_be(:project) { create(:project) }
  let_it_be(:user) { create(:user) }
  let_it_be(:experiment) { create(:ml_experiments, user: user, project: project) }
  let_it_be(:candidate) { create(:ml_candidates, user: user, experiment: experiment) }

  let(:repository) { described_class.new(project, user) }

  describe '#by_iid' do
    let(:iid) { candidate.iid }

    subject { repository.by_iid(iid) }

    it { is_expected.to eq(candidate) }

    context 'when iid does not exist' do
      let(:iid) { non_existing_record_iid.to_s }

      it { is_expected.to be_nil }
    end

    context 'when iid belongs to a different project' do
      let(:repository) { described_class.new(create(:project), user) }

      it { is_expected.to be_nil }
    end
  end

  describe '#create!' do
    subject { repository.create!(experiment, 1234) }

    it 'creates the candidate' do
      expect(subject.start_time).to eq(1234)
      expect(subject.iid).not_to be_nil
      expect(subject.end_time).to be_nil
    end
  end

  describe '#update' do
    let(:end_time) { 123456 }
    let(:status) { 'running' }

    subject { repository.update(candidate, status, end_time) }

    it { is_expected.to be_truthy }

    context 'when end_time is missing ' do
      let(:end_time) { nil }

      it { is_expected.to be_truthy }
    end

    context 'when status is wrong' do
      let(:status) { 's' }

      it 'fails assigning the value' do
        expect { subject }.to raise_error(ArgumentError)
      end
    end

    context 'when status is missing' do
      let(:status) { nil }

      it { is_expected.to be_truthy }
    end
  end

  describe '#add_metric!' do
    let(:props) { { name: 'abc', value: 1234, tracked: 12345678, step: 0 } }
    let(:metrics_before) { candidate.metrics.size }

    before do
      metrics_before
    end

    subject { repository.add_metric!(candidate, props[:name], props[:value], props[:tracked], props[:step]) }

    it 'adds a new metric' do
      expect { subject }.to change { candidate.metrics.size }.by(1)
    end

    context 'when name missing' do
      let(:props) { { value: 1234, tracked: 12345678, step: 0 } }

      it 'does not add metric' do
        expect { subject }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end

  describe '#add_param!' do
    let(:props) { { name: 'abc', value: 'def' } }

    subject { repository.add_param!(candidate, props[:name], props[:value]) }

    it 'adds a new param' do
      expect { subject }.to change { candidate.params.size }.by(1)
    end

    context 'when name missing' do
      let(:props) { { value: 1234 } }

      it 'throws RecordInvalid' do
        expect { subject }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context 'when param was already added' do
      it 'throws RecordInvalid' do
        repository.add_param!(candidate, 'new', props[:value])

        expect { repository.add_param!(candidate, 'new', props[:value]) }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end

  describe "#add_params" do
    let(:params) do
      [{ key: 'model_class', value: 'LogisticRegression' }, { 'key': 'pythonEnv', value: '3.10' }]
    end

    subject { repository.add_params(candidate, params) }

    it 'adds the parameters' do
      expect { subject }.to change { candidate.reload.params.size }.by(2)
    end

    context 'if parameter misses key' do
      let(:params) do
        [{ value: 'LogisticRegression' }]
      end

      it 'does not throw and does not add' do
        expect { subject }.to raise_error(ActiveRecord::ActiveRecordError)
      end
    end

    context 'if parameter misses value' do
      let(:params) do
        [{ key: 'pythonEnv2' }]
      end

      it 'does not throw and does not add' do
        expect { subject }.to raise_error(ActiveRecord::ActiveRecordError)
      end
    end

    context 'if parameter repeated do' do
      let(:params) do
        [
          { 'key': 'pythonEnv0', value: '2.7' },
          { 'key': 'pythonEnv1', value: '3.9' },
          { 'key': 'pythonEnv1', value: '3.10' }
        ]
      end

      before do
        repository.add_param!(candidate, 'pythonEnv0', '0')
      end

      it 'does not throw and adds only the first of each kind' do
        expect { subject }.to change { candidate.reload.params.size }.by(1)
      end
    end
  end

  describe "#add_metrics" do
    let(:metrics) do
      [
        { key: 'mae', value: 2.5, timestamp: 1552550804 },
        { key: 'rmse', value: 2.7, timestamp: 1552550804 }
      ]
    end

    subject { repository.add_metrics(candidate, metrics) }

    it 'adds the metrics' do
      expect { subject }.to change { candidate.reload.metrics.size }.by(2)
    end

    context 'when metrics have repeated keys' do
      let(:metrics) do
        [
          { key: 'mae', value: 2.5, timestamp: 1552550804 },
          { key: 'rmse', value: 2.7, timestamp: 1552550804 },
          { key: 'mae', value: 2.7, timestamp: 1552550805 }
        ]
      end

      it 'adds all of them' do
        expect { subject }.to change { candidate.reload.metrics.size }.by(3)
      end
    end
  end
end
