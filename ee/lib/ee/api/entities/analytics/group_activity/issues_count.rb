# frozen_string_literal: true

module EE
  module API
    module Entities
      module Analytics
        module GroupActivity
          class IssuesCount < Grape::Entity
            expose :issues_count, documentation: { type: "Integer", desc: "Number of issues", example: '3' }
          end
        end
      end
    end
  end
end
