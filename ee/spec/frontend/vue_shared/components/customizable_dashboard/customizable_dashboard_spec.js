import { GridStack } from 'gridstack';
import * as Sentry from '@sentry/browser';
import { shallowMountExtended } from 'helpers/vue_test_utils_helper';
import CustomizableDashboard from 'ee/vue_shared/components/customizable_dashboard/customizable_dashboard.vue';
import WidgetsBase from 'ee/vue_shared/components/customizable_dashboard/widgets_base.vue';
import {
  GRIDSTACK_MARGIN,
  GRIDSTACK_CSS_HANDLE,
} from 'ee/vue_shared/components/customizable_dashboard/constants';
import { loadCSSFile } from '~/lib/utils/css_utils';
import waitForPromises from 'helpers/wait_for_promises';
import { dashboard } from './mock_data';

jest.mock('gridstack', () => ({
  GridStack: {
    init: jest.fn(),
  },
}));

jest.mock('~/lib/utils/css_utils', () => ({
  loadCSSFile: jest.fn(),
}));

describe('CustomizableDashboard', () => {
  let wrapper;

  const sentryError = new Error('Network error');

  const createWrapper = (props = {}) => {
    wrapper = shallowMountExtended(CustomizableDashboard, {
      propsData: {
        editable: false,
        widgets: [],
        ...props,
      },
    });
  };

  const findGridStackWidgets = () => wrapper.findAllByTestId('grid-stack-widget');
  const findWidgets = () => wrapper.findAllComponents(WidgetsBase);
  describe('when being created an error occurs while loading the CSS', () => {
    beforeEach(() => {
      jest.spyOn(Sentry, 'captureException');
      loadCSSFile.mockRejectedValue(sentryError);

      createWrapper({
        widgets: dashboard.widgets,
      });
    });

    it('reports the error to sentry', async () => {
      await waitForPromises();
      expect(Sentry.captureException.mock.calls[0][0]).toStrictEqual(sentryError);
    });
  });

  describe('when mounted', () => {
    beforeEach(() => {
      loadCSSFile.mockResolvedValue();

      createWrapper({
        widgets: dashboard.widgets,
      });
    });

    it('sets up GridStack', () => {
      expect(GridStack.init).toHaveBeenCalledWith({
        staticGrid: true,
        margin: GRIDSTACK_MARGIN,
        handle: GRIDSTACK_CSS_HANDLE,
      });
    });

    it.each(
      dashboard.widgets.map((widget, index) => [
        widget.component,
        widget.title,
        widget.gridAttributes,
        widget.customizations,
        widget.chartOptions,
        widget.data,
        index,
      ]),
    )(
      'should render the widget for %s',
      (component, title, gridAttributes, customizations, chartOptions, data, index) => {
        expect(findWidgets().at(index).props()).toMatchObject({
          component,
          title,
          customizations,
          chartOptions,
          data,
        });
        expect(findGridStackWidgets().at(index).attributes()).toMatchObject({
          'gs-id': `${index}`,
          'gs-h': `${gridAttributes.size.height}`,
          'gs-w': `${gridAttributes.size.width}`,
        });
      },
    );
  });
});
