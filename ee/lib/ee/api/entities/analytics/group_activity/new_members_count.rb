# frozen_string_literal: true

module EE
  module API
    module Entities
      module Analytics
        module GroupActivity
          class NewMembersCount < Grape::Entity
            expose :new_members_count, documentation: { type: "Integer", desc: "Number of new members", example: '3' }
          end
        end
      end
    end
  end
end
