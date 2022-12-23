# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SearchService do
  describe '#search_objects' do
    let(:scope) { nil }
    let(:page) { 1 }
    let(:per_page) { described_class::DEFAULT_PER_PAGE }

    subject(:search_service) { described_class.new(user, search: search, scope: scope, page: page, per_page: per_page) }

    it_behaves_like 'a redacted search results'
  end

  describe '#projects' do
    let_it_be(:user) { create(:user) }
    let_it_be(:accessible_project) { create(:project, :public) }
    let_it_be(:inaccessible_project) { create(:project, :private) }

    context 'when all projects are accessible' do
      let_it_be(:accessible_project_2) { create(:project, :public) }

      it 'returns the project' do
        project_ids = [accessible_project.id, accessible_project_2.id].join(',')
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to match_array [accessible_project, accessible_project_2]
      end

      it 'returns the projects for guests' do
        search_project = create :project
        search_project.add_guest(user)
        project_ids = [accessible_project.id, accessible_project_2.id, search_project.id].join(',')
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to match_array [accessible_project, accessible_project_2, search_project]
      end

      it 'handles spaces in the param' do
        project_ids = [accessible_project.id, accessible_project_2.id].join(',    ')
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to match_array [accessible_project, accessible_project_2]
      end

      it 'returns nil if projects param is not a String' do
        project_ids = accessible_project.id
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to be_nil
      end
    end

    context 'when some projects are accessible' do
      it 'returns only accessible projects' do
        project_ids = [accessible_project.id, inaccessible_project.id].join(',')
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to match_array [accessible_project]
      end
    end

    context 'when no projects are accessible' do
      it 'returns nil' do
        project_ids = "#{inaccessible_project.id}"
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to be_nil
      end
    end

    context 'when no project_ids are provided' do
      it 'returns nil' do
        projects = described_class.new(user).projects

        expect(projects).to be_nil
      end
    end

    context 'when the advanced_search_multi_project_select feature is not enabled' do
      before do
        stub_feature_flags(advanced_search_multi_project_select: false)
      end

      it 'returns nil' do
        project_ids = "#{accessible_project.id}"
        projects = described_class.new(user, project_ids: project_ids).projects

        expect(projects).to be_nil
      end
    end
  end
end
