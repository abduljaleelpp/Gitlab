# frozen_string_literal: true

module Types
  class IssueTypeEnum < BaseEnum
    graphql_name 'IssueType'
    description 'Issue type'

    ::WorkItems::Type.allowed_types_for_issues.each do |issue_type|
      value issue_type.upcase, value: issue_type, description: "#{issue_type.titleize} issue type"
    end

    value 'TASK', value: 'task',
                  description: 'Task issue type.',
                  alpha: { milestone: '15.2' }

    value 'OBJECTIVE', value: 'objective',
                       description: 'Objective issue type. Available only when feature flag `okrs_mvc` is enabled.',
                       alpha: { milestone: '15.6' }
  end
end
