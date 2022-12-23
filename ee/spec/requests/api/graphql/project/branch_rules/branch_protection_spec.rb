# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'getting branch protection for a branch rule' do
  include GraphqlHelpers

  let_it_be(:current_user) { create(:user) }
  let_it_be(:branch_rule) { create(:protected_branch) }
  let_it_be(:project) { branch_rule.project }

  let(:branch_protection_data) do
    graphql_data_at('project', 'branchRules', 'nodes', 0, 'branchProtection')
  end

  let(:variables) { { path: project.full_path } }

  let(:fields) { all_graphql_fields_for('branch_protections'.classify) }

  let(:query) do
    <<~GQL
    query($path: ID!) {
      project(fullPath: $path) {
        branchRules(first: 1) {
          nodes {
            branchProtection {
              #{fields}
            }
          }
        }
      }
    }
    GQL
  end

  context 'when the user does have read_protected_branch abilities' do
    before do
      project.add_maintainer(current_user)
      post_graphql(query, current_user: current_user, variables: variables)
    end

    it_behaves_like 'a working graphql query'

    it 'includes code_owner_approval_required' do
      expect(branch_protection_data['codeOwnerApprovalRequired']).to be_in([true, false])
      expect(branch_protection_data['codeOwnerApprovalRequired']).to eq(branch_rule.code_owner_approval_required)
    end
  end
end
