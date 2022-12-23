# frozen_string_literal: true

class ScimOauthAccessToken < ApplicationRecord
  include TokenAuthenticatable

  belongs_to :group, optional: true

  add_authentication_token_field :token, encrypted: :required

  before_save :ensure_token

  def self.token_matches_for_group?(token, group)
    # Necessary to call `TokenAuthenticatableStrategies::Encrypted.find_token_authenticatable`
    token = find_by_token(token)

    token && group && token.group_id == group.id
  end

  def self.token_matches?(token)
    # Necessary to call `TokenAuthenticatableStrategies::Encrypted.find_token_authenticatable`
    find_by_token(token)
  end

  def as_entity_json
    ScimOauthAccessTokenEntity.new(self).as_json
  end
end
