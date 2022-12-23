# frozen_string_literal: true

module EE
  module Integrations
    module SlackInteractions
      module IncidentManagement
        class IncidentModalOpenedService
          MAX_PROJECTS = 100

          def initialize(slack_installation, current_user, params)
            @slack_installation = slack_installation
            @current_user = current_user
            @team_id = params[:team_id]
            @response_url = params[:response_url]
            @trigger_id = params[:trigger_id]
          end

          def execute
            if user_projects.empty?
              return ServiceResponse.error(message: _('You do not have access to any projects for creating incidents.'))
            end

            post_modal
          end

          private

          attr_reader :slack_installation, :current_user, :team_id, :response_url, :trigger_id

          def user_projects
            current_user.projects_where_can_admin_issues.limit(MAX_PROJECTS)
          end

          def post_modal
            begin
              response = ::Slack::API.new(slack_installation).post(
                'views.open',
                modal_view
              )
            rescue *::Gitlab::HTTP::HTTP_ERRORS => e
              return ServiceResponse
                .error(message: 'HTTP exception when calling Slack API')
                .track_exception(
                  as: e.class,
                  slack_workspace_id: team_id
                )
            end

            return ServiceResponse.success(message: _('Please complete the incident creation form.')) if response['ok']

            ServiceResponse.error(
              message: _('Something went wrong while opening the incident form.'),
              payload: response
            ).track_exception(
              response: response.to_h,
              slack_workspace_id: team_id,
              slack_user_id: slack_installation.user_id
            )
          end

          def modal_view
            {
              trigger_id: trigger_id,
              view: modal_payload
            }
          end

          def modal_payload
            ::Slack::BlockKit::IncidentManagement::IncidentModalOpened.new(
              user_projects,
              response_url
            ).build
          end
        end
      end
    end
  end
end
