import Api, { DEFAULT_PER_PAGE } from '~/api';
import axios from '~/lib/utils/axios_utils';
import { ContentTypeMultipartFormData } from '~/lib/utils/headers';

export default {
  ...Api,
  geoNodePath: '/api/:version/geo_nodes/:id',
  geoNodesPath: '/api/:version/geo_nodes',
  geoNodesStatusPath: '/api/:version/geo_nodes/status',
  geoReplicationPath: '/api/:version/geo_replication/:replicable',
  ldapGroupsPath: '/api/:version/ldap/:provider/groups.json',
  subscriptionPath: '/api/:version/namespaces/:id/gitlab_subscription',
  childEpicPath: '/api/:version/groups/:id/epics',
  cycleAnalyticsTasksByTypePath: '/groups/:id/-/analytics/type_of_work/tasks_by_type',
  cycleAnalyticsTopLabelsPath: '/groups/:id/-/analytics/type_of_work/tasks_by_type/top_labels',
  cycleAnalyticsGroupStagesAndEventsPath:
    '/groups/:id/-/analytics/value_stream_analytics/value_streams/:value_stream_id/stages',
  cycleAnalyticsValueStreamsPath: '/groups/:id/-/analytics/value_stream_analytics/value_streams',
  cycleAnalyticsValueStreamPath:
    '/groups/:id/-/analytics/value_stream_analytics/value_streams/:value_stream_id',
  cycleAnalyticsStagePath:
    '/groups/:id/-/analytics/value_stream_analytics/value_streams/:value_stream_id/stages/:stage_id',
  cycleAnalyticsGroupLabelsPath: '/groups/:namespace_path/-/labels.json',
  cycleAnalyticsAggregationPath:
    '/groups/:namespace_path/-/analytics/value_stream_analytics/use_aggregated_backend',
  codeReviewAnalyticsPath: '/api/:version/analytics/code_review',
  groupActivityIssuesPath: '/api/:version/analytics/group_activity/issues_count',
  groupActivityMergeRequestsPath: '/api/:version/analytics/group_activity/merge_requests_count',
  groupActivityNewMembersPath: '/api/:version/analytics/group_activity/new_members_count',
  countriesPath: '/-/countries',
  countryStatesPath: '/-/country_states',
  paymentFormPath: '/-/subscriptions/payment_form',
  paymentMethodPath: '/-/subscriptions/payment_method',
  confirmOrderPath: '/-/subscriptions',
  validatePaymentMethodPath: '/-/subscriptions/validate_payment_method',
  vulnerabilityPath: '/api/:version/vulnerabilities/:id',
  vulnerabilityActionPath: '/api/:version/vulnerabilities/:id/:action',
  vulnerabilityIssueLinksPath: '/api/:version/vulnerabilities/:id/issue_links',
  applicationSettingsPath: '/api/:version/application/settings',
  descendantGroupsPath: '/api/:version/groups/:group_id/descendant_groups',
  projectDeploymentFrequencyAnalyticsPath:
    '/api/:version/projects/:id/analytics/deployment_frequency',
  projectGroupsPath: '/api/:version/projects/:id/groups.json',
  issueMetricImagesPath: '/api/:version/projects/:id/issues/:issue_iid/metric_images',
  issueMetricSingleImagePath:
    '/api/:version/projects/:id/issues/:issue_iid/metric_images/:image_id',
  environmentApprovalPath: '/api/:version/projects/:id/deployments/:deployment_id/approval',

  userSubscription(namespaceId) {
    const url = Api.buildUrl(this.subscriptionPath).replace(':id', encodeURIComponent(namespaceId));

    return axios.get(url);
  },

  ldapGroups(query, provider, callback) {
    const url = Api.buildUrl(this.ldapGroupsPath).replace(':provider', provider);
    return axios
      .get(url, {
        params: {
          search: query,
          per_page: DEFAULT_PER_PAGE,
          active: true,
        },
      })
      .then(({ data }) => {
        callback(data);

        return data;
      });
  },

  createChildEpic({ confidential, groupId, parentEpicId, title }) {
    const url = Api.buildUrl(this.childEpicPath).replace(':id', encodeURIComponent(groupId));

    return axios.post(url, {
      parent_id: parentEpicId,
      confidential,
      title,
    });
  },

  descendantGroups({ groupId, search }) {
    const url = Api.buildUrl(this.descendantGroupsPath).replace(':group_id', groupId);

    return axios.get(url, {
      params: {
        search,
      },
    });
  },

  cycleAnalyticsTasksByType(groupId, params = {}) {
    const url = Api.buildUrl(this.cycleAnalyticsTasksByTypePath).replace(':id', groupId);

    return axios.get(url, { params });
  },

  cycleAnalyticsTopLabels(groupId, params = {}) {
    const url = Api.buildUrl(this.cycleAnalyticsTopLabelsPath).replace(':id', groupId);

    return axios.get(url, { params });
  },

  cycleAnalyticsGroupStagesAndEvents({ groupId, valueStreamId, params = {} }) {
    const url = Api.buildUrl(this.cycleAnalyticsGroupStagesAndEventsPath)
      .replace(':id', groupId)
      .replace(':value_stream_id', valueStreamId);

    return axios.get(url, { params });
  },

  cycleAnalyticsStageEvents({ groupId, valueStreamId, stageId, params = {} }) {
    const stageBase = this.cycleAnalyticsStageUrl({ groupId, valueStreamId, stageId });
    const url = `${stageBase}/records`;
    return axios.get(url, { params });
  },

  cycleAnalyticsStageCount({ groupId, valueStreamId, stageId, params = {} }) {
    const stageBase = this.cycleAnalyticsStageUrl({ groupId, valueStreamId, stageId });
    const url = `${stageBase}/count`;
    return axios.get(url, { params });
  },

  cycleAnalyticsCreateValueStream(groupId, data) {
    const url = Api.buildUrl(this.cycleAnalyticsValueStreamsPath).replace(':id', groupId);
    return axios.post(url, data);
  },

  cycleAnalyticsUpdateValueStream({ groupId, valueStreamId, data }) {
    const url = Api.buildUrl(this.cycleAnalyticsValueStreamPath)
      .replace(':id', groupId)
      .replace(':value_stream_id', valueStreamId);
    return axios.put(url, data);
  },

  cycleAnalyticsDeleteValueStream(groupId, valueStreamId) {
    const url = Api.buildUrl(this.cycleAnalyticsValueStreamPath)
      .replace(':id', groupId)
      .replace(':value_stream_id', valueStreamId);
    return axios.delete(url);
  },

  cycleAnalyticsValueStreams(groupId, data) {
    const url = Api.buildUrl(this.cycleAnalyticsValueStreamsPath).replace(':id', groupId);
    return axios.get(url, data);
  },

  cycleAnalyticsStageUrl({ groupId, valueStreamId, stageId }) {
    return Api.buildUrl(this.cycleAnalyticsStagePath)
      .replace(':id', groupId)
      .replace(':value_stream_id', valueStreamId)
      .replace(':stage_id', stageId);
  },

  cycleAnalyticsDurationChart({ groupId, valueStreamId, stageId, params = {} }) {
    const stageBase = this.cycleAnalyticsStageUrl({ groupId, valueStreamId, stageId });
    const url = `${stageBase}/average_duration_chart`;
    return axios.get(url, { params });
  },

  cycleAnalyticsGroupLabels(groupId, params = { search: null }) {
    // TODO: This can be removed when we resolve the labels endpoint
    // https://gitlab.com/gitlab-org/gitlab/-/merge_requests/25746
    const url = Api.buildUrl(this.cycleAnalyticsGroupLabelsPath).replace(
      ':namespace_path',
      groupId,
    );

    return axios.get(url, {
      params,
    });
  },

  cycleAnalyticsUpdateAggregation(groupId, data) {
    const url = Api.buildUrl(this.cycleAnalyticsAggregationPath).replace(
      ':namespace_path',
      groupId,
    );
    return axios.put(url, data);
  },

  codeReviewAnalytics(params = {}) {
    const url = Api.buildUrl(this.codeReviewAnalyticsPath);
    return axios.get(url, { params });
  },

  groupActivityMergeRequestsCount(groupPath) {
    const url = Api.buildUrl(this.groupActivityMergeRequestsPath);
    return axios.get(url, { params: { group_path: groupPath } });
  },

  groupActivityIssuesCount(groupPath) {
    const url = Api.buildUrl(this.groupActivityIssuesPath);
    return axios.get(url, { params: { group_path: groupPath } });
  },

  groupActivityNewMembersCount(groupPath) {
    const url = Api.buildUrl(this.groupActivityNewMembersPath);
    return axios.get(url, { params: { group_path: groupPath } });
  },

  getGeoReplicableItems(replicable, params = {}) {
    const url = Api.buildUrl(this.geoReplicationPath).replace(':replicable', replicable);
    return axios.get(url, { params });
  },

  initiateAllGeoReplicableSyncs(replicable, action) {
    const url = Api.buildUrl(this.geoReplicationPath).replace(':replicable', replicable);
    return axios.post(`${url}/${action}`, {});
  },

  initiateGeoReplicableSync(replicable, { projectId, action }) {
    const url = Api.buildUrl(this.geoReplicationPath).replace(':replicable', replicable);
    return axios.put(`${url}/${projectId}/${action}`, {});
  },

  fetchCountries() {
    const url = Api.buildUrl(this.countriesPath);
    return axios.get(url);
  },

  fetchStates(country) {
    const url = Api.buildUrl(this.countryStatesPath);
    return axios.get(url, { params: { country } });
  },

  fetchPaymentFormParams(id) {
    const url = Api.buildUrl(this.paymentFormPath);
    return axios.get(url, { params: { id } });
  },

  fetchPaymentMethodDetails(id) {
    const url = Api.buildUrl(this.paymentMethodPath);
    return axios.get(url, { params: { id } });
  },

  validatePaymentMethod(id, gitlabUserId) {
    const url = Api.buildUrl(this.validatePaymentMethodPath);
    return axios.post(url, { id, gitlab_user_id: gitlabUserId });
  },

  confirmOrder(params = {}) {
    const url = Api.buildUrl(this.confirmOrderPath);
    return axios.post(url, params);
  },

  changeVulnerabilityState(id, state) {
    const url = Api.buildUrl(this.vulnerabilityActionPath)
      .replace(':id', id)
      .replace(':action', state);

    return axios.post(url);
  },

  getGeoNodes() {
    const url = Api.buildUrl(this.geoNodesPath);
    return axios.get(url);
  },

  getGeoNodesStatus() {
    const url = Api.buildUrl(this.geoNodesStatusPath);
    return axios.get(url);
  },

  createGeoNode(node) {
    const url = Api.buildUrl(this.geoNodesPath);
    return axios.post(url, node);
  },

  updateGeoNode(node) {
    const url = Api.buildUrl(this.geoNodesPath);
    return axios.put(`${url}/${node.id}`, node);
  },

  removeGeoNode(id) {
    const url = Api.buildUrl(this.geoNodePath).replace(':id', encodeURIComponent(id));
    return axios.delete(url);
  },

  getApplicationSettings() {
    const url = Api.buildUrl(this.applicationSettingsPath);
    return axios.get(url);
  },

  updateApplicationSettings(data) {
    const url = Api.buildUrl(this.applicationSettingsPath);
    return axios.put(url, data);
  },

  deploymentFrequencies(projectId, params = {}) {
    const url = Api.buildUrl(this.projectDeploymentFrequencyAnalyticsPath).replace(
      ':id',
      encodeURIComponent(projectId),
    );

    return axios.get(url, { params });
  },

  fetchIssueMetricImages({ issueIid, id }) {
    const metricImagesUrl = Api.buildUrl(this.issueMetricImagesPath)
      .replace(':id', encodeURIComponent(id))
      .replace(':issue_iid', encodeURIComponent(issueIid));

    return axios.get(metricImagesUrl);
  },

  uploadIssueMetricImage({ issueIid, id, file, url = null, urlText = null }) {
    const options = { headers: { ...ContentTypeMultipartFormData } };
    const metricImagesUrl = Api.buildUrl(this.issueMetricImagesPath)
      .replace(':id', encodeURIComponent(id))
      .replace(':issue_iid', encodeURIComponent(issueIid));

    // Construct multipart form data
    const formData = new FormData();
    formData.append('file', file);
    if (url) {
      formData.append('url', url);
    }
    if (urlText) {
      formData.append('url_text', urlText);
    }

    return axios.post(metricImagesUrl, formData, options);
  },

  updateIssueMetricImage({ issueIid, id, imageId, url = null, urlText = null }) {
    const metricImagesUrl = Api.buildUrl(this.issueMetricSingleImagePath)
      .replace(':id', encodeURIComponent(id))
      .replace(':issue_iid', encodeURIComponent(issueIid))
      .replace(':image_id', encodeURIComponent(imageId));

    // Construct multipart form data
    const formData = new FormData();
    if (url != null) {
      formData.append('url', url);
    }
    if (urlText != null) {
      formData.append('url_text', urlText);
    }

    return axios.put(metricImagesUrl, formData);
  },

  deleteMetricImage({ issueIid, id, imageId }) {
    const individualMetricImageUrl = Api.buildUrl(this.issueMetricSingleImagePath)
      .replace(':id', encodeURIComponent(id))
      .replace(':issue_iid', encodeURIComponent(issueIid))
      .replace(':image_id', encodeURIComponent(imageId));

    return axios.delete(individualMetricImageUrl);
  },

  projectGroups(id, options) {
    const url = Api.buildUrl(this.projectGroupsPath).replace(':id', encodeURIComponent(id));

    return axios
      .get(url, {
        params: {
          ...options,
        },
      })
      .then(({ data }) => {
        return data;
      });
  },

  deploymentApproval({ id, deploymentId, approve, comment }) {
    const url = Api.buildUrl(this.environmentApprovalPath)
      .replace(':id', encodeURIComponent(id))
      .replace(':deployment_id', encodeURIComponent(deploymentId));

    return axios.post(url, { status: approve ? 'approved' : 'rejected', comment });
  },

  approveDeployment({ id, deploymentId, comment }) {
    return this.deploymentApproval({ id, deploymentId, approve: true, comment });
  },
  rejectDeployment({ id, deploymentId, comment }) {
    return this.deploymentApproval({ id, deploymentId, approve: false, comment });
  },
};