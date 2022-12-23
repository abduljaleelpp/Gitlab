import { s__, __ } from '~/locale';
import { days, percentHundred } from '~/lib/utils/unit_format';
import {
  getStartOfDay,
  dateAtFirstDayOfMonth,
  nSecondsBefore,
  nMonthsBefore,
  monthInWords,
} from '~/lib/utils/datetime_utility';
import {
  DEPLOYMENT_FREQUENCY_METRIC_TYPE,
  LEAD_TIME_FOR_CHANGES,
  TIME_TO_RESTORE_SERVICE,
  CHANGE_FAILURE_RATE,
} from 'ee/api/dora_api';

export const DORA_METRICS = {
  [DEPLOYMENT_FREQUENCY_METRIC_TYPE]: {
    label: s__('DORA4Metrics|Deployment Frequency'),
    formatValue: (value) => days(value, 1, { unitSeparator: '/' }),
  },
  [LEAD_TIME_FOR_CHANGES]: {
    label: s__('DORA4Metrics|Lead Time for Changes'),
    formatValue: (value) => days(value, 1, { unitSeparator: ' ' }),
  },
  [TIME_TO_RESTORE_SERVICE]: {
    label: s__('DORA4Metrics|Time to Restore Service'),
    formatValue: (value) => days(value, 1, { unitSeparator: ' ' }),
  },
  [CHANGE_FAILURE_RATE]: {
    label: s__('DORA4Metrics|Change Failure Rate'),
    formatValue: (value) => percentHundred(value, 2),
  },
};

export const DASHBOARD_TITLE = __('Executive Dashboard');
export const DASHBOARD_DESCRIPTION = s__('DORA4Metrics|DORA metrics for %{groupName} group');
export const DASHBOARD_NO_DATA = __('No data available');
export const DASHBOARD_LOADING_FAILURE = __('Failed to load');

const NOW = new Date();
const CURRENT_MONTH_START = getStartOfDay(dateAtFirstDayOfMonth(NOW));
const PREVIOUS_MONTH_START = nMonthsBefore(CURRENT_MONTH_START, 1);
const PREVIOUS_MONTH_END = nSecondsBefore(CURRENT_MONTH_START, 1);

export const THIS_MONTH = {
  key: 'thisMonth',
  label: s__('DORA4Metrics|Month to date'),
  start: CURRENT_MONTH_START,
  end: NOW,
};

export const LAST_MONTH = {
  key: 'lastMonth',
  label: monthInWords(nMonthsBefore(NOW, 1)),
  start: PREVIOUS_MONTH_START,
  end: PREVIOUS_MONTH_END,
};

export const TWO_MONTHS_AGO = {
  key: 'twoMonthsAgo',
  label: monthInWords(nMonthsBefore(NOW, 2)),
  start: nMonthsBefore(PREVIOUS_MONTH_START, 1),
  end: nSecondsBefore(PREVIOUS_MONTH_START, 1),
};

export const THREE_MONTHS_AGO = {
  key: 'threeMonthsAgo',
  label: monthInWords(nMonthsBefore(NOW, 3)),
  start: nMonthsBefore(PREVIOUS_MONTH_START, 2),
  end: nSecondsBefore(PREVIOUS_MONTH_START, 2),
};

export const DASHBOARD_TIME_PERIODS = [THIS_MONTH, LAST_MONTH, TWO_MONTHS_AGO, THREE_MONTHS_AGO];
export const DASHBOARD_TABLE_FIELDS = [
  { key: 'metric', label: __('Metric') },
  ...DASHBOARD_TIME_PERIODS.slice(0, -1),
];
