# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Gitlab::Usage::Metrics::Aggregates::Aggregate, :clean_gitlab_redis_shared_state do
  let(:end_date) { Date.current }
  let(:namespace) { described_class.to_s.deconstantize.constantize }
  let(:sources) { Gitlab::Usage::Metrics::Aggregates::Sources }

  let_it_be(:recorded_at) { Time.current.to_i }

  describe '.calculate_count_for_aggregation' do
    using RSpec::Parameterized::TableSyntax

    context 'with valid configuration' do
      where(:number_of_days, :operator, :datasource, :expected_method) do
        28 | 'AND' | 'redis_hll' | :calculate_metrics_intersections
        7  | 'AND' | 'redis_hll' | :calculate_metrics_intersections
        28 | 'AND' | 'database'  | :calculate_metrics_intersections
        7  | 'AND' | 'database'  | :calculate_metrics_intersections
        28 | 'OR'  | 'redis_hll' | :calculate_metrics_union
        7  | 'OR'  | 'redis_hll' | :calculate_metrics_union
        28 | 'OR'  | 'database'  | :calculate_metrics_union
        7  | 'OR'  | 'database'  | :calculate_metrics_union
      end

      with_them do
        let(:time_frame) { "#{number_of_days}d" }
        let(:start_date) { number_of_days.days.ago.to_date }
        let(:params) { { start_date: start_date, end_date: end_date, recorded_at: recorded_at } }
        let(:aggregate) do
          {
            source: datasource,
            operator: operator,
            events: %w[event1 event2]
          }
        end

        subject(:calculate_count_for_aggregation) do
          described_class
            .new(recorded_at)
            .calculate_count_for_aggregation(aggregation: aggregate, time_frame: time_frame)
        end

        it 'returns the number of unique events for aggregation', :aggregate_failures do
          expect(namespace::SOURCES[datasource])
            .to receive(expected_method)
                  .with(params.merge(metric_names: %w[event1 event2]))
                  .and_return(5)
          expect(calculate_count_for_aggregation).to eq(5)
        end
      end
    end

    context 'with invalid configuration' do
      where(:time_frame, :operator, :datasource, :expected_error) do
        '28d' | 'SUM' | 'redis_hll' | namespace::UnknownAggregationOperator
        '7d'  | 'AND' | 'mongodb'   | namespace::UnknownAggregationSource
        'all' | 'AND' | 'redis_hll' | namespace::DisallowedAggregationTimeFrame
      end

      with_them do
        let(:aggregate) do
          {
            source: datasource,
            operator: operator,
            events: %w[event1 event2]
          }
        end

        subject(:calculate_count_for_aggregation) do
          described_class
            .new(recorded_at)
            .calculate_count_for_aggregation(aggregation: aggregate, time_frame: time_frame)
        end

        context 'with non prod environment' do
          it 'raises error' do
            expect { calculate_count_for_aggregation }.to raise_error expected_error
          end
        end

        context 'with prod environment' do
          before do
            stub_rails_env('production')
          end

          it 'returns fallback value' do
            expect(calculate_count_for_aggregation).to be(-1)
          end
        end
      end
    end

    context 'when union data is not available' do
      subject(:calculate_count_for_aggregation) do
        described_class
          .new(recorded_at)
          .calculate_count_for_aggregation(aggregation: aggregate, time_frame: time_frame)
      end

      where(:time_frame, :operator, :datasource) do
        '28d' | 'OR' | 'redis_hll'
        '7d'  | 'OR' | 'database'
      end

      with_them do
        before do
          allow(namespace::SOURCES[datasource]).to receive(:calculate_metrics_union).and_raise(sources::UnionNotAvailable)
        end

        let(:aggregate) do
          {
            source: datasource,
            operator: operator,
            events: %w[event1 event2]
          }
        end

        context 'with non prod environment' do
          it 'raises error' do
            expect { calculate_count_for_aggregation }.to raise_error sources::UnionNotAvailable
          end
        end

        context 'with prod environment' do
          before do
            stub_rails_env('production')
          end

          it 'returns fallback value' do
            expect(calculate_count_for_aggregation).to be(-1)
          end
        end
      end
    end
  end
end
