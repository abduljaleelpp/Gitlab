# frozen_string_literal: true

module EE
  module TwoFactor
    module DestroyService
      extend ::Gitlab::Utils::Override

      private

      override :authorized?
      def authorized?
        return super unless group
        return false unless ::Feature.enabled?('group_owners_to_disable_two_factor', group)

        group.root? &&
          group_provisioned_user?(user) &&
          can?(current_user, :admin_group, group)
      end

      def group_provisioned_user?(user)
        user.provisioned_by_group_id == group.id
      end

      override :notify_on_success
      def notify_on_success(user)
        audit_context = {
          name: 'user_disable_two_factor',
          author: current_user,
          scope: user,
          target: user,
          message: 'Disabled two-factor authentication',
          created_at: DateTime.current
        }

        ::Gitlab::Audit::Auditor.audit(audit_context)

        super
      end
    end
  end
end
