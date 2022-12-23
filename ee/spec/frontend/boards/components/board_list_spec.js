import BoardNewEpic from 'ee/boards/components/board_new_epic.vue';
import createComponent from 'jest/boards/board_list_helper';

import BoardCard from '~/boards/components/board_card.vue';
import BoardCardInner from '~/boards/components/board_card_inner.vue';
import BoardCardMoveToPosition from '~/boards/components/board_card_move_to_position.vue';
import { issuableTypes } from '~/boards/constants';

jest.mock('~/flash');

const listIssueProps = {
  project: {
    path: '/test',
  },
  real_path: '',
  webUrl: '',
};

const componentProps = {
  groupId: undefined,
};

const actions = {
  addListNewEpic: jest.fn().mockResolvedValue(),
};

const componentConfig = {
  listIssueProps,
  componentProps,
  getters: {
    isGroupBoard: () => true,
    isProjectBoard: () => false,
  },
  state: {
    issuableType: issuableTypes.epic,
  },
  actions,
  stubs: {
    BoardCard,
    BoardCardInner,
    BoardNewEpic,
  },
  provide: {
    scopedLabelsAvailable: true,
    isEpicBoard: true,
  },
};

describe('BoardList Component', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createComponent(componentConfig);
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('renders link properly in issue', () => {
    expect(wrapper.find('.board-card .board-card-title a').attributes('href')).not.toContain(
      ':project_path',
    );
  });

  it('does not render the move to position icon', () => {
    expect(wrapper.findComponent(BoardCardMoveToPosition).exists()).toBe(false);
  });
});
