# frozen_string_literal: true

require 'fast_spec_helper'
require 'rspec-parameterized'

require_relative '../../../support/shared_contexts/lib/sbom/package_url_shared_contexts'

RSpec.describe Sbom::PackageUrl::Encoder do
  describe '#encode' do
    let(:package) do
      ::Sbom::PackageUrl.new(
        type: type,
        namespace: namespace,
        name: name,
        version: version,
        qualifiers: qualifiers,
        subpath: subpath
      )
    end

    subject(:encode) { described_class.new(package).encode }

    include_context 'with valid purl examples'

    with_them do
      it { is_expected.to eq(canonical_purl) }
    end
  end
end
