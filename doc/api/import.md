---
stage: Manage
group: Import
info: To determine the technical writer assigned to the Stage/Group associated with this page, see https://about.gitlab.com/handbook/product/ux/technical-writing/#assignments
---

# Import API **(FREE)**

## Import repository from GitHub

Import your projects from GitHub to GitLab via the API.

```plaintext
POST /import/github
```

| Attribute               | Type    | Required | Description                                                                         |
|-------------------------|---------|----------|-------------------------------------------------------------------------------------|
| `personal_access_token` | string  | yes      | GitHub personal access token                                                        |
| `repo_id`               | integer | yes      | GitHub repository ID                                                                |
| `new_name`              | string  | no      | New repository name                                                                 |
| `target_namespace`      | string  | yes      | Namespace to import repository into. Supports subgroups like `/namespace/subgroup` |
| `github_hostname`       | string  | no  | Custom GitHub Enterprise hostname. Do not set for GitHub.com.                       |
| `optional_stages`       | object  | no  | [Additional items to import](../user/project/import/github.md#select-additional-items-to-import). [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/373705) in GitLab 15.5 |

```shell
curl --request POST \
  --url "https://gitlab.example.com/api/v4/import/github" \
  --header "content-type: application/json" \
  --header "PRIVATE-TOKEN: <your_access_token>" \
  --data '{
    "personal_access_token": "aBc123abC12aBc123abC12abC123+_A/c123",
    "repo_id": "12345",
    "target_namespace": "group/subgroup",
    "new_name": "NEW-NAME",
    "github_hostname": "https://github.example.com",
    "optional_stages": {
      "single_endpoint_issue_events_import": true,
      "single_endpoint_notes_import": true,
      "attachments_import": true
    }
}'
```

The following keys are available for `optional_stages`:

- `single_endpoint_issue_events_import`, for issue and pull request events import.
- `single_endpoint_notes_import`, for an alternative and more thorough comments import.
- `attachments_import`, for Markdown attachments import.

For more information, see [Select additional items to import](../user/project/import/github.md#select-additional-items-to-import).

Example response:

```json
{
    "id": 27,
    "name": "my-repo",
    "full_path": "/root/my-repo",
    "full_name": "Administrator / my-repo"
}
```

## Cancel GitHub project import

> [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/364783) in GitLab 15.5.

Cancel an in-progress GitHub project import using the API.

```plaintext
POST /import/github/cancel
```

| Attribute  | Type    | Required | Description         |
|------------|---------|----------|---------------------|
| `project_id`   | integer | yes      | GitLab project ID     |

```shell
curl --request POST \
  --url "https://gitlab.example.com/api/v4/import/github/cancel" \
  --header "content-type: application/json" \
  --header "PRIVATE-TOKEN: <your_access_token>" \
  --data '{
    "project_id": 12345
}'
```

Example response:

```json
{
    "id": 160,
    "name": "my-repo",
    "full_path": "/root/my-repo",
    "full_name": "Administrator / my-repo",
    "import_source": "source/source-repo",
    "import_status": "canceled",
    "human_import_status_name": "canceled",
    "provider_link": "/source/source-repo"
}
```

Returns the following status codes:

- `200 OK`: the project import is being canceled.
- `400 Bad Request`: the project import cannot be canceled.
- `404 Not Found`: the project associated with `project_id` does not exist.

## Import repository from Bitbucket Server

Import your projects from Bitbucket Server to GitLab via the API.

NOTE:
The Bitbucket Project Key is only used for finding the repository in Bitbucket.
You must specify a `target_namespace` if you want to import the repository to a GitLab group.
If you do not specify `target_namespace`, the project imports to your personal user namespace.

```plaintext
POST /import/bitbucket_server
```

| Attribute  | Type    | Required | Description         |
|------------|---------|----------|---------------------|
| `bitbucket_server_url` | string | yes | Bitbucket Server URL |
| `bitbucket_server_username` | string | yes | Bitbucket Server Username |
| `personal_access_token` | string | yes | Bitbucket Server personal access token/password |
| `bitbucket_server_project` | string | yes | Bitbucket Project Key |
| `bitbucket_server_repo` | string | yes | Bitbucket Repository Name |
| `new_name` | string | no | New repository name |
| `target_namespace` | string | no | Namespace to import repository into. Supports subgroups like `/namespace/subgroup` |

```shell
curl --request POST \
  --url "https://gitlab.example.com/api/v4/import/bitbucket_server" \
  --header "content-type: application/json" \
  --header "PRIVATE-TOKEN: <your_access_token>" \
  --data '{
    "bitbucket_server_url": "http://bitbucket.example.com",
    "bitbucket_server_username": "root",
    "personal_access_token": "Nzk4MDcxODY4MDAyOiP8y410zF3tGAyLnHRv/E0+3xYs",
    "bitbucket_server_project": "NEW",
    "bitbucket_server_repo": "my-repo"
}'
```

## Automate group and project import **(PREMIUM)**

For information on automating user, group, and project import API calls, see
[Automate group and project import](../user/project/import/index.md#automate-group-and-project-import).
