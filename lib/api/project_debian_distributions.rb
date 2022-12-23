# frozen_string_literal: true

module API
  class ProjectDebianDistributions < ::API::Base
    params do
      requires :id, types: [String, Integer], desc: 'The ID or URL-encoded path of the project'
    end

    before do
      not_found! if Gitlab::FIPS.enabled?
    end

    resource :projects, requirements: API::NAMESPACE_OR_PROJECT_REQUIREMENTS do
      after_validation do
        require_packages_enabled!

        not_found! unless ::Feature.enabled?(:debian_packages, user_project)
      end

      namespace ':id' do
        helpers do
          def project_or_group
            user_project
          end
        end

        include ::API::Concerns::Packages::DebianDistributionEndpoints
      end
    end
  end
end
