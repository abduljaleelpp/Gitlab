import { cloneDeep } from 'lodash';
import { shallowMountExtended } from 'helpers/vue_test_utils_helper';
import MinutesUsageCharts from 'ee/ci/usage_quotas/pipelines/components/minutes_usage_charts.vue';
import NoMinutesAlert from 'ee/ci/ci_minutes_usage/components/no_minutes_alert.vue';
import { mockGetCiMinutesUsageNamespace } from '../mock_data';

describe('MinutesUsageCharts', () => {
  let wrapper;
  const defaultProps = {
    ciMinutesUsage: cloneDeep(mockGetCiMinutesUsageNamespace.data.ciMinutesUsage.nodes),
  };

  const createComponent = ({ props = {} } = {}) => {
    wrapper = shallowMountExtended(MinutesUsageCharts, {
      propsData: {
        ...defaultProps,
        ...props,
      },
    });
  };

  beforeEach(() => {
    createComponent();
  });

  afterEach(() => {
    wrapper.destroy();
  });

  const findNoMinutesAlert = () => wrapper.findComponent(NoMinutesAlert);
  const findMinutesByNamespace = () => wrapper.findByTestId('minutes-by-namespace');
  const findSharedRunnerByNamespace = () => wrapper.findByTestId('shared-runner-by-namespace');
  const findMinutesByProject = () => wrapper.findByTestId('minutes-by-project');
  const findSharedRunnerByProject = () => wrapper.findByTestId('shared-runner-by-project');

  it('does not render NoMinutesAlert if there are minutes', () => {
    expect(findNoMinutesAlert().exists()).toBe(false);
  });

  describe('with no minutes', () => {
    beforeEach(() => {
      const props = cloneDeep(defaultProps);
      props.ciMinutesUsage[0].minutes = 0;
      props.ciMinutesUsage[0].projects.nodes[0].minutes = 0;

      createComponent({ props });
    });

    it('does not render CI minutes charts', () => {
      expect(findMinutesByNamespace().exists()).toBe(false);
      expect(findMinutesByProject().exists()).toBe(false);
    });

    it('renders Shared Runners charts', () => {
      expect(findSharedRunnerByNamespace().exists()).toBe(true);
      expect(findSharedRunnerByProject().exists()).toBe(true);
    });
  });

  describe('with no shared runners', () => {
    beforeEach(() => {
      const props = cloneDeep(defaultProps);
      props.ciMinutesUsage[0].sharedRunnersDuration = 0;
      props.ciMinutesUsage[0].projects.nodes[0].sharedRunnersDuration = 0;

      createComponent({ props });
    });

    it('renders CI minutes charts', () => {
      expect(findMinutesByNamespace().exists()).toBe(true);
      expect(findMinutesByProject().exists()).toBe(true);
    });

    it('does not render Shared Runners charts', () => {
      expect(findSharedRunnerByNamespace().exists()).toBe(false);
      expect(findSharedRunnerByProject().exists()).toBe(false);
    });
  });
});
