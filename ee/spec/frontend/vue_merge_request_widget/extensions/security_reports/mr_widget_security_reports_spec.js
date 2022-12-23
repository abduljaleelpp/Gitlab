import { nextTick } from 'vue';
import MockAdapter from 'axios-mock-adapter';
import waitForPromises from 'helpers/wait_for_promises';
import MRSecurityWidget from 'ee/vue_merge_request_widget/extensions/security_reports/mr_widget_security_reports.vue';
import SummaryText from 'ee/vue_merge_request_widget/extensions/security_reports/summary_text.vue';
import SummaryHighlights from 'ee/vue_merge_request_widget/extensions/security_reports/summary_highlights.vue';
import { shallowMountExtended, mountExtended } from 'helpers/vue_test_utils_helper';
import Widget from '~/vue_merge_request_widget/components/widget/widget.vue';
import MrWidgetRow from '~/vue_merge_request_widget/components/widget/widget_content_row.vue';
import axios from '~/lib/utils/axios_utils';

jest.mock('~/vue_shared/components/user_callout_dismisser.vue', () => ({ render: () => {} }));

describe('MR Widget Security Reports', () => {
  let wrapper;
  let mockAxios;

  const securityConfigurationPath = '/help/user/application_security/index.md';
  const sourceProjectFullPath = 'namespace/project';

  const sastHelp = '/help/user/application_security/sast/index';
  const dastHelp = '/help/user/application_security/dast/index';
  const coverageFuzzingHelp = '/help/user/application_security/coverage-fuzzing/index';
  const secretDetectionHelp = '/help/user/application_security/secret-detection/index';
  const apiFuzzingHelp = '/help/user/application_security/api-fuzzing/index';
  const dependencyScanningHelp = '/help/user/application_security/api-fuzzing/index';
  const containerScanningHelp = '/help/user/application_security/container-scanning/index';

  const reportEndpoints = {
    sastComparisonPath: '/my/sast/endpoint',
    dastComparisonPath: '/my/dast/endpoint',
    dependencyScanningComparisonPath: '/my/dependency-scanning/endpoint',
    coverageFuzzingComparisonPath: '/my/coverage-fuzzing/endpoint',
    apiFuzzingComparisonPath: '/my/api-fuzzing/endpoint',
    secretDetectionComparisonPath: '/my/secret-detection/endpoint',
    containerScanningComparisonPath: '/my/container-scanning/endpoint',
  };

  const createComponent = ({ propsData, mountFn = shallowMountExtended } = {}) => {
    wrapper = mountFn(MRSecurityWidget, {
      propsData: {
        ...propsData,
        mr: {
          ...propsData?.mr,
          ...reportEndpoints,
          securityConfigurationPath,
          sourceProjectFullPath,
          sastHelp,
          dastHelp,
          containerScanningHelp,
          dependencyScanningHelp,
          coverageFuzzingHelp,
          secretDetectionHelp,
          apiFuzzingHelp,
        },
      },
      stubs: {
        MrWidgetRow,
      },
    });
  };

  const findWidget = () => wrapper.findComponent(Widget);
  const findWidgetRow = (reportType) => wrapper.findByTestId(`report-${reportType}`);
  const findSummaryText = () => wrapper.findComponent(SummaryText);
  const findSummaryHighlights = () => wrapper.findComponent(SummaryHighlights);

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('with empty MR data', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should mount the widget component', () => {
      expect(findWidget().props()).toMatchObject({
        statusIconName: 'success',
        widgetName: 'WidgetSecurityReports',
        errorText: 'Security reports failed loading results',
        loadingText: 'Loading',
        fetchCollapsedData: wrapper.vm.fetchCollapsedData,
        multiPolling: true,
      });
    });

    it('handles loading state', async () => {
      expect(findSummaryText().props()).toMatchObject({ isLoading: false });
      findWidget().vm.$emit('is-loading', true);
      await nextTick();
      expect(findSummaryText().props()).toMatchObject({ isLoading: true });
      expect(findSummaryHighlights().exists()).toBe(false);
    });

    it('does not display the summary highlights component', () => {
      expect(findSummaryHighlights().exists()).toBe(false);
    });

    it('should not be collapsible', () => {
      expect(findWidget().props('isCollapsible')).toBe(false);
    });
  });

  describe('with MR data', () => {
    const mockWithData = () => {
      mockAxios.onGet(reportEndpoints.sastComparisonPath).replyOnce(200, {
        added: [
          { id: 1, severity: 'critical', name: 'Password leak' },
          { id: 2, severity: 'high', name: 'XSS vulnerability' },
        ],
      });

      mockAxios.onGet(reportEndpoints.dastComparisonPath).replyOnce(200, {
        added: [
          { id: 5, severity: 'low', name: 'SQL Injection' },
          { id: 3, severity: 'unknown', name: 'Weak password' },
        ],
      });

      [
        reportEndpoints.dependencyScanningComparisonPath,
        reportEndpoints.coverageFuzzingComparisonPath,
        reportEndpoints.apiFuzzingComparisonPath,
        reportEndpoints.secretDetectionComparisonPath,
        reportEndpoints.containerScanningComparisonPath,
      ].forEach((path) => {
        mockAxios.onGet(path).replyOnce(200, {
          added: [],
        });
      });
    };

    it('should mount the widget component', async () => {
      mockWithData();

      createComponent({
        propsData: { mr: { ...reportEndpoints, securityConfigurationPath, sourceProjectFullPath } },
        mountFn: mountExtended,
      });

      await waitForPromises();

      expect(findWidget().props()).toMatchObject({
        statusIconName: 'warning',
        widgetName: 'WidgetSecurityReports',
        errorText: 'Security reports failed loading results',
        loadingText: 'Loading',
        fetchCollapsedData: wrapper.vm.fetchCollapsedData,
        multiPolling: true,
      });
    });

    it('computes the total number of new potential vulnerabilities correctly', async () => {
      mockWithData();

      createComponent({
        mountFn: mountExtended,
      });

      await waitForPromises();
      expect(findSummaryText().props()).toMatchObject({ totalNewVulnerabilities: 4 });
      expect(findSummaryHighlights().props()).toMatchObject({
        highlights: { critical: 1, high: 1, other: 2 },
      });
    });

    it('tells the widget to be collapsible only if there is data', async () => {
      mockWithData();

      createComponent({
        mountFn: mountExtended,
      });

      expect(findWidget().props('isCollapsible')).toBe(false);
      await waitForPromises();
      expect(findWidget().props('isCollapsible')).toBe(true);
    });

    it('displays detailed data when expanded', async () => {
      mockWithData();

      createComponent({
        mountFn: mountExtended,
      });

      await waitForPromises();

      // Click on the toggle button to expand data
      wrapper.findByRole('button', { name: 'Show details' }).trigger('click');
      await nextTick();

      expect(wrapper.findByText(/Weak password/).exists()).toBe(true);
      expect(wrapper.findByText(/Password leak/).exists()).toBe(true);
      expect(wrapper.findByTestId('SAST-report-header').text()).toBe(
        'SAST detected 2 new potential vulnerabilities',
      );
    });
  });

  describe('help popovers', () => {
    const mockWithData = () => {
      Object.keys(reportEndpoints).forEach((key, i) => {
        mockAxios.onGet(reportEndpoints[key]).replyOnce(200, {
          added: [{ id: i, severity: 'critical', name: 'Password leak' }],
        });
      });
    };

    it.each`
      reportType               | reportTitle                                      | helpPath
      ${'SAST'}                | ${'Static Application Security Testing (SAST)'}  | ${sastHelp}
      ${'DAST'}                | ${'Dynamic Application Security Testing (DAST)'} | ${dastHelp}
      ${'DEPENDENCY_SCANNING'} | ${'Dependency scanning'}                         | ${dependencyScanningHelp}
      ${'COVERAGE_FUZZING'}    | ${'Coverage fuzzing'}                            | ${coverageFuzzingHelp}
      ${'API_FUZZING'}         | ${'API fuzzing'}                                 | ${apiFuzzingHelp}
      ${'SECRET_DETECTION'}    | ${'Secret detection'}                            | ${secretDetectionHelp}
      ${'CONTAINER_SCANNING'}  | ${'Container scanning'}                          | ${containerScanningHelp}
    `(
      'shows the correct help popover for $reportType',
      async ({ reportType, reportTitle, helpPath }) => {
        mockWithData();

        createComponent({
          mountFn: mountExtended,
        });

        await waitForPromises();

        // Click on the toggle button to expand data
        wrapper.findByRole('button', { name: 'Show details' }).trigger('click');
        await nextTick();

        expect(findWidgetRow(reportType).props('helpPopover')).toMatchObject({
          options: { title: reportTitle },
          content: { learnMorePath: helpPath },
        });
      },
    );
  });
});
