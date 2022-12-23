# frozen_string_literal: true

module EE
  module Resolvers
    module WorkItemsResolver
      extend ActiveSupport::Concern
      extend ::Gitlab::Utils::Override

      prepended do
        argument :status_widget, ::Types::WorkItems::Widgets::StatusFilterInputType,
                 required: false,
                 description: 'Input for status widget filter. Ignored if `work_items_mvc_2` is disabled.'
      end

      override :resolve_with_lookahead
      def resolve_with_lookahead(**args)
        args.delete(:status_widget) unless resource_parent&.work_items_mvc_2_feature_flag_enabled?

        super
      end

      private

      override :widget_preloads
      def widget_preloads
        super.merge(status: { requirement: :recent_test_reports })
      end
    end
  end
end
