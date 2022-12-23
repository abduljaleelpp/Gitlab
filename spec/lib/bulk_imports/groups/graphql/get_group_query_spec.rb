# frozen_string_literal: true

require 'spec_helper'

RSpec.describe BulkImports::Groups::Graphql::GetGroupQuery do
  let_it_be(:tracker) { create(:bulk_import_tracker) }
  let_it_be(:context) { BulkImports::Pipeline::Context.new(tracker) }

  subject(:query) { described_class.new(context: context) }

  it 'has a valid query' do
    parsed_query = GraphQL::Query.new(
      GitlabSchema,
      query.to_s,
      variables: query.variables
    )
    result = GitlabSchema.static_validator.validate(parsed_query)

    expect(result[:errors]).to be_empty
  end

  describe '#variables' do
    it 'returns query variables based on entity information' do
      expected = { full_path: tracker.entity.source_full_path }

      expect(subject.variables).to eq(expected)
    end
  end

  describe '#data_path' do
    it 'returns data path' do
      expected = %w[data group]

      expect(subject.data_path).to eq(expected)
    end
  end

  describe '#page_info_path' do
    it 'returns pagination information path' do
      expected = %w[data group page_info]

      expect(subject.page_info_path).to eq(expected)
    end
  end
end
