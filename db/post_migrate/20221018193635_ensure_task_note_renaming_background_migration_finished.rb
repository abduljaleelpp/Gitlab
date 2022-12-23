# frozen_string_literal: true

class EnsureTaskNoteRenamingBackgroundMigrationFinished < Gitlab::Database::Migration[2.0]
  disable_ddl_transaction!

  restrict_gitlab_migration gitlab_schema: :gitlab_main

  MIGRATION = 'RenameTaskSystemNoteToChecklistItem'

  def up
    ensure_batched_background_migration_is_finished(
      job_class_name: MIGRATION,
      table_name: :system_note_metadata,
      column_name: :id,
      job_arguments: []
    )
  end

  def down
    # noop
  end
end
