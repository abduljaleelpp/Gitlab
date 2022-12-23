# frozen_string_literal: true

class Geo::ContainerRepositoryRegistry < Geo::BaseRegistry
  include ::Delay
  include ::Geo::ReplicableRegistry
  extend ::Gitlab::Utils::Override

  MODEL_CLASS = ::ContainerRepository
  MODEL_FOREIGN_KEY = :container_repository_id

  belongs_to :container_repository

  ### Remove it after data migration
  # See https://gitlab.com/gitlab-org/gitlab/-/issues/371667
  # rubocop:disable Gitlab/NoCodeCoverageComment
  # :nocov: undercoverage spec keeps failing here but this method is covered with tests
  def state
    case value = read_attribute('state')
    when '0', 'pending', nil
      0
    when '1', 'started'
      1
    when '2', 'synced'
      2
    when '3', 'failed'
      3
    else
      value
    end
  end
  # :nocov:
  # rubocop:enable Gitlab/NoCodeCoverageComment
  ### Remove it after data migration

  class << self
    include Delay
    extend ::Gitlab::Utils::Override

    ### Remove it after data migration
    def with_state(state)
      value = case state.to_sym
              when :pending
                %w[0 pending]
              when :started
                %w[1 started]
              when :synced
                %w[2 synced]
              when :failed
                %w[3 failed]
              end

      where(state: value)
    end
    ### Remove it after data migration

    def find_registries_needs_sync_again(batch_size:, except_ids: [])
      super.order(arel_table[:last_synced_at].asc.nulls_first)
    end

    def pluck_container_repository_key
      where(nil).pluck(:container_repository_id)
    end

    def replication_enabled?
      Gitlab.config.geo.registry_replication.enabled
    end

    override :registry_consistency_worker_enabled?
    def registry_consistency_worker_enabled?
      true
    end
  end

  def finish_sync!
    update!(
      retry_count: 0,
      last_sync_failure: nil,
      retry_at: nil
    )

    mark_synced_atomically
  end

  def mark_synced_atomically
    # We can only update registry if state is started.
    # If state is set to pending that means that pending! was called
    # during the sync so we need to reschedule new sync
    num_rows = self.class
                   .where(container_repository_id: container_repository_id)
                   .with_state(:started)
                   .update_all(state: 'synced')

    num_rows > 0
  end
end
