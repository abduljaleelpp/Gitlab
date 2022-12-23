#!/bin/sh

prepare_jh_branch() {
  set -eu # https://explainshell.com/explain?cmd=set+-eu

  JH_BRANCH="$(./scripts/setup/find-jh-branch.rb)"
  export JH_BRANCH

  echoinfo "JH_BRANCH: ${JH_BRANCH}"
}

download_jh_path() {
  set -eu # https://explainshell.com/explain?cmd=set+-eu

  for path in "$@"; do
    # https://www.shellcheck.net/wiki/SC3043
    # shellcheck disable=SC3043
    local output="${path}.tar.gz"

    echoinfo "Downloading ${path}"

    curl --location -o "${output}" -H "Private-Token: ${ADD_JH_FILES_TOKEN}" "https://gitlab.com/api/v4/projects/${GITLAB_JH_MIRROR_PROJECT}/repository/archive?sha=${JH_BRANCH}&path=${path}"

    tar -zxf "${output}"
    rm "${output}"
    mv gitlab-"${JH_BRANCH}"-*/"${path}" ./
  done
}
