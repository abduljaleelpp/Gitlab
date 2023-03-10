# frozen_string_literal: true

module Preloaders
  class UserMemberRolesInProjectsPreloader
    def initialize(projects:, user:)
      @projects = if projects.is_a?(Array)
                    Project.where(id: projects)
                  else
                    # Push projects base query in to a sub-select to avoid
                    # table name clashes. Performs better than aliasing.
                    Project.where(id: projects.reselect(:id))
                  end

      @user = user
    end

    def execute
      sql_values_array = projects.each_with_object([]) do |project, array|
        next unless ::Feature.enabled?(:customizable_roles, project.root_ancestor)

        array << [project.id, Arel.sql("ARRAY[#{project.namespace.traversal_ids.join(',')}]::integer[]")]
      end

      return {} if sql_values_array.empty?

      value_list = Arel::Nodes::ValuesList.new(sql_values_array)

      sql = <<~SQL
        SELECT project_ids.project_id, download_code_permissions.download_code FROM (#{value_list.to_sql}) AS project_ids (project_id, namespace_ids),
        LATERAL (
          (
           #{Member.select('download_code')
              .left_outer_joins(:member_role)
              .where("members.source_type = 'Project' AND members.source_id = project_ids.project_id")
              .with_user(user)
              .where(member_roles: { download_code: true })
              .limit(1).to_sql}
          ) UNION ALL
          (
           #{Member.select('download_code')
              .left_outer_joins(:member_role)
              .where("members.source_type = 'Namespace' AND members.source_id IN (SELECT UNNEST(project_ids.namespace_ids) as ids)")
              .with_user(user)
              .where(member_roles: { download_code: true })
              .limit(1).to_sql}
          ) UNION ALL
          (
            SELECT false AS download_code
          )
          LIMIT 1
        ) AS download_code_permissions
      SQL

      grouped_by_project = ApplicationRecord.connection.execute(sql).to_a.group_by do |h|
        h['project_id']
      end

      grouped_by_project.transform_values do |value|
        custom_attributes = []
        custom_attributes << :download_code if value.find { |custom_role| custom_role["download_code"] == true }
        custom_attributes
      end
    end

    private

    attr_reader :projects, :user
  end
end
