---
type: reference, howto
stage: Manage
group: Authentication and Authorization
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---
# SCIM API **(PREMIUM SAAS)**

> [Introduced](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/98354) in GitLab 15.5.

To use this API, [Group SSO](../user/group/saml_sso/index.md) must be enabled for the group.
This API is only in use where [SCIM for Group SSO](../user/group/saml_sso/scim_setup.md) is enabled. It's a prerequisite to the creation of SCIM identities.

Not to be confused with the [internal SCIM API](../development/internal_api/index.md#scim-api).

## Get SCIM identities for a group

> [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/227841) in GitLab 15.5.

```plaintext
GET /groups/:id/scim/identities
```

Supported attributes:

| Attribute         | Type    | Required | Description           |
|:------------------|:--------|:---------|:----------------------|
| `id`              | integer | Yes      | Return SCIM identities for the given group ID. |

If successful, returns [`200`](index.md#status-codes) and the following
response attributes:

| Attribute    | Type   | Description               |
| ------------ | ------ | ------------------------- |
| `extern_uid` | string | External UID for the user |
| `user_id`    | string | ID for the user           |

Example response:

```json
[
    {
        "extern_uid": "4",
        "user_id": 48
    }
]
```

Example request:

```shell
curl --location --request GET "https://gitlab.example.com/api/v4/groups/33/scim/identities" \
--header "PRIVATE-TOKEN: <PRIVATE-TOKEN>" \
--form "extern_uid=<ID_TO_BE_UPDATED>" \
```

## Update extern_uid field for a SCIM identity

> [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/227841) in GitLab 15.5.

Fields that can be updated are:

| SCIM/IdP field  | GitLab field |
| --------------- | ------------ |
| `id/externalId` | `extern_uid` |

```plaintext
PATCH groups/:groups_id/scim/:uid
```

Parameters:

| Attribute | Type   | Required | Description               |
| --------- | ------ | -------- | ------------------------- |
| `uid`     | string | yes      | External UID of the user. |

Example request:

```shell
curl --location --request PATCH "https://gitlab.example.com/api/v4/groups/33/scim/sydney_jones" \
--header "PRIVATE-TOKEN: <PRIVATE TOKEN>" \
--form "extern_uid=sydney_jones_new" \
```
