# frozen_string_literal: true

module Integrations
  class Slack < BaseSlackNotification
    include SlackMattermostNotifier

    def title
      'Slack notifications'
    end

    def description
      'Send notifications about project events to Slack.'
    end

    def self.to_param
      'slack'
    end

    override :webhook_help
    def webhook_help
      'https://hooks.slack.com/services/…'
    end
  end
end
