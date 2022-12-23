import $ from 'jquery';
import Vue from 'vue';
import VueApollo from 'vue-apollo';
import { TYPE_ISSUE, TYPE_MERGE_REQUEST } from '~/graphql_shared/constants';
import { convertToGraphQLId } from '~/graphql_shared/utils';
import initInviteMembersModal from '~/invite_members/init_invite_members_modal';
import initInviteMembersTrigger from '~/invite_members/init_invite_members_trigger';
import { IssuableType } from '~/issues/constants';
import {
  isInIssuePage,
  isInDesignPage,
  isInIncidentPage,
  isInMRPage,
  parseBoolean,
} from '~/lib/utils/common_utils';
import { __ } from '~/locale';
import CollapsedAssigneeList from '~/sidebar/components/assignees/collapsed_assignee_list.vue';
import SidebarAssigneesWidget from '~/sidebar/components/assignees/sidebar_assignees_widget.vue';
import SidebarConfidentialityWidget from '~/sidebar/components/confidential/sidebar_confidentiality_widget.vue';
import SidebarDueDateWidget from '~/sidebar/components/date/sidebar_date_widget.vue';
import MilestoneDropdown from '~/sidebar/components/milestone/milestone_dropdown.vue';
import SidebarParticipantsWidget from '~/sidebar/components/participants/sidebar_participants_widget.vue';
import SidebarReferenceWidget from '~/sidebar/components/reference/sidebar_reference_widget.vue';
import SidebarDropdownWidget from '~/sidebar/components/sidebar_dropdown_widget.vue';
import SidebarTodoWidget from '~/sidebar/components/todo_toggle/sidebar_todo_widget.vue';
import { apolloProvider } from '~/graphql_shared/issuable_client';
import trackShowInviteMemberLink from '~/sidebar/track_invite_members';
import { DropdownVariant } from '~/vue_shared/components/sidebar/labels_select_vue/constants';
import LabelsSelectWidget from '~/vue_shared/components/sidebar/labels_select_widget/labels_select_root.vue';
import { LabelType } from '~/vue_shared/components/sidebar/labels_select_widget/constants';
import Translate from '../vue_shared/translate';
import SidebarAssignees from './components/assignees/sidebar_assignees.vue';
import CopyEmailToClipboard from './components/copy_email_to_clipboard.vue';
import SidebarEscalationStatus from './components/incidents/sidebar_escalation_status.vue';
import IssuableLockForm from './components/lock/issuable_lock_form.vue';
import SidebarReviewers from './components/reviewers/sidebar_reviewers.vue';
import SidebarReviewersInputs from './components/reviewers/sidebar_reviewers_inputs.vue';
import SidebarSeverity from './components/severity/sidebar_severity.vue';
import SidebarSubscriptionsWidget from './components/subscriptions/sidebar_subscriptions_widget.vue';
import SidebarTimeTracking from './components/time_tracking/sidebar_time_tracking.vue';
import { IssuableAttributeType } from './constants';
import SidebarMoveIssue from './lib/sidebar_move_issue';
import CrmContacts from './components/crm_contacts/crm_contacts.vue';

Vue.use(Translate);
Vue.use(VueApollo);

function getSidebarOptions(sidebarOptEl = document.querySelector('.js-sidebar-options')) {
  return JSON.parse(sidebarOptEl.innerHTML);
}

function mountSidebarTodoWidget() {
  const el = document.querySelector('.js-sidebar-todo-widget-root');

  if (!el) {
    return null;
  }

  const { projectPath, iid, id } = el.dataset;

  return new Vue({
    el,
    name: 'SidebarTodoWidgetRoot',
    apolloProvider,
    provide: {
      isClassicSidebar: true,
    },
    render: (createElement) =>
      createElement(SidebarTodoWidget, {
        props: {
          fullPath: projectPath,
          issuableId:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? convertToGraphQLId(TYPE_ISSUE, id)
              : convertToGraphQLId(TYPE_MERGE_REQUEST, id),
          issuableIid: iid,
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
        },
      }),
  });
}

function getSidebarAssigneeAvailabilityData() {
  const sidebarAssigneeEl = document.querySelectorAll('.js-sidebar-assignee-data input');
  return Array.from(sidebarAssigneeEl)
    .map((el) => el.dataset)
    .reduce(
      (acc, { username, availability = '' }) => ({
        ...acc,
        [username]: availability,
      }),
      {},
    );
}

function mountSidebarAssigneesDeprecated(mediator) {
  const el = document.querySelector('.js-sidebar-assignees-root');

  if (!el) {
    return null;
  }

  const { id, iid, fullPath } = getSidebarOptions();
  const assigneeAvailabilityStatus = getSidebarAssigneeAvailabilityData();

  return new Vue({
    el,
    name: 'SidebarAssigneesRoot',
    apolloProvider,
    render: (createElement) =>
      createElement(SidebarAssignees, {
        props: {
          mediator,
          issuableIid: String(iid),
          projectPath: fullPath,
          field: el.dataset.field,
          signedIn: Object.prototype.hasOwnProperty.call(el.dataset, 'signedIn'),
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
          issuableId: id,
          assigneeAvailabilityStatus,
        },
      }),
  });
}

function mountSidebarAssigneesWidget() {
  const el = document.querySelector('.js-sidebar-assignees-root');

  if (!el) {
    return;
  }

  const { id, iid, fullPath, editable } = getSidebarOptions();
  const isIssuablePage = isInIssuePage() || isInIncidentPage() || isInDesignPage();
  const issuableType = isIssuablePage ? IssuableType.Issue : IssuableType.MergeRequest;
  // eslint-disable-next-line no-new
  new Vue({
    el,
    name: 'SidebarAssigneesRoot',
    apolloProvider,
    provide: {
      canUpdate: editable,
      directlyInviteMembers: Object.prototype.hasOwnProperty.call(
        el.dataset,
        'directlyInviteMembers',
      ),
    },
    render: (createElement) =>
      createElement(SidebarAssigneesWidget, {
        props: {
          iid: String(iid),
          fullPath,
          issuableType,
          issuableId: id,
          allowMultipleAssignees: !el.dataset.maxAssignees || el.dataset.maxAssignees > 1,
          editable,
        },
        scopedSlots: {
          collapsed: ({ users }) =>
            createElement(CollapsedAssigneeList, {
              props: {
                users,
                issuableType,
              },
            }),
        },
      }),
  });

  const assigneeDropdown = document.querySelector('.js-sidebar-assignee-dropdown');

  if (assigneeDropdown) {
    trackShowInviteMemberLink(assigneeDropdown);
  }
}

function mountSidebarReviewers(mediator) {
  const el = document.querySelector('.js-sidebar-reviewers-root');

  if (!el) {
    return;
  }

  const { iid, fullPath } = getSidebarOptions();
  // eslint-disable-next-line no-new
  new Vue({
    el,
    name: 'SidebarReviewersRoot',
    apolloProvider,
    render: (createElement) =>
      createElement(SidebarReviewers, {
        props: {
          mediator,
          issuableIid: String(iid),
          projectPath: fullPath,
          field: el.dataset.field,
          issuableType:
            isInIssuePage() || isInDesignPage() ? IssuableType.Issue : IssuableType.MergeRequest,
        },
      }),
  });

  const reviewersInputEl = document.querySelector('.js-reviewers-inputs');

  if (reviewersInputEl) {
    // eslint-disable-next-line no-new
    new Vue({
      el: reviewersInputEl,
      render(createElement) {
        return createElement(SidebarReviewersInputs);
      },
    });
  }

  const reviewerDropdown = document.querySelector('.js-sidebar-reviewer-dropdown');

  if (reviewerDropdown) {
    trackShowInviteMemberLink(reviewerDropdown);
  }
}

function mountSidebarCrmContacts() {
  const el = document.querySelector('.js-sidebar-crm-contacts-root');

  if (!el) {
    return null;
  }

  const { issueId, groupIssuesPath } = el.dataset;

  return new Vue({
    el,
    name: 'SidebarCrmContactsRoot',
    apolloProvider,
    render: (createElement) =>
      createElement(CrmContacts, {
        props: {
          issueId,
          groupIssuesPath,
        },
      }),
  });
}

function mountSidebarMilestoneWidget() {
  const el = document.querySelector('.js-sidebar-milestone-widget-root');

  if (!el) {
    return null;
  }

  const { canEdit, projectPath, issueIid } = el.dataset;

  return new Vue({
    el,
    name: 'SidebarMilestoneWidgetRoot',
    apolloProvider,
    provide: {
      canUpdate: parseBoolean(canEdit),
      isClassicSidebar: true,
    },
    render: (createElement) =>
      createElement(SidebarDropdownWidget, {
        props: {
          attrWorkspacePath: projectPath,
          workspacePath: projectPath,
          iid: issueIid,
          issuableType:
            isInIssuePage() || isInDesignPage() ? IssuableType.Issue : IssuableType.MergeRequest,
          issuableAttribute: IssuableAttributeType.Milestone,
          icon: 'clock',
        },
      }),
  });
}

export function mountMilestoneDropdown() {
  const el = document.querySelector('.js-milestone-dropdown-root');

  if (!el) {
    return null;
  }

  Vue.use(VueApollo);

  const {
    canAdminMilestone,
    fullPath,
    inputName,
    milestoneId,
    milestoneTitle,
    projectMilestonesPath,
    workspaceType,
  } = el.dataset;

  return new Vue({
    el,
    name: 'MilestoneDropdownRoot',
    apolloProvider,
    render(createElement) {
      return createElement(MilestoneDropdown, {
        props: {
          attrWorkspacePath: fullPath,
          canAdminMilestone,
          inputName,
          issuableType: isInIssuePage() ? IssuableType.Issue : IssuableType.MergeRequest,
          milestoneId,
          milestoneTitle,
          projectMilestonesPath,
          workspaceType,
        },
      });
    },
  });
}

export function mountSidebarLabelsWidget() {
  const el = document.querySelector('.js-sidebar-labels-widget-root');

  if (!el) {
    return null;
  }

  return new Vue({
    el,
    name: 'SidebarLabelsWidgetRoot',
    apolloProvider,
    provide: {
      ...el.dataset,
      canUpdate: parseBoolean(el.dataset.canEdit),
      allowLabelCreate: parseBoolean(el.dataset.allowLabelCreate),
      allowLabelEdit: parseBoolean(el.dataset.canEdit),
      allowScopedLabels: parseBoolean(el.dataset.allowScopedLabels),
      isClassicSidebar: true,
    },
    render: (createElement) =>
      createElement(LabelsSelectWidget, {
        props: {
          iid: String(el.dataset.iid),
          fullPath: el.dataset.projectPath,
          allowLabelRemove: parseBoolean(el.dataset.canEdit),
          allowMultiselect: true,
          footerCreateLabelTitle: __('Create project label'),
          footerManageLabelTitle: __('Manage project labels'),
          labelsCreateTitle: __('Create project label'),
          labelsFilterBasePath: el.dataset.projectIssuesPath,
          variant: DropdownVariant.Sidebar,
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
          workspaceType: 'project',
          attrWorkspacePath: el.dataset.projectPath,
          labelCreateType: LabelType.project,
        },
        class: ['block labels js-labels-block'],
        scopedSlots: {
          default: () => __('None'),
        },
      }),
  });
}

function mountSidebarConfidentialityWidget() {
  const el = document.querySelector('.js-sidebar-confidential-widget-root');

  if (!el) {
    return null;
  }

  const { fullPath, iid } = getSidebarOptions();
  const dataNode = document.getElementById('js-confidential-issue-data');
  const initialData = JSON.parse(dataNode.innerHTML);

  return new Vue({
    el,
    name: 'SidebarConfidentialityWidgetRoot',
    apolloProvider,
    provide: {
      canUpdate: initialData.is_editable,
      isClassicSidebar: true,
    },
    render: (createElement) =>
      createElement(SidebarConfidentialityWidget, {
        props: {
          iid: String(iid),
          fullPath,
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
        },
      }),
  });
}

function mountSidebarDueDateWidget() {
  const el = document.querySelector('.js-sidebar-due-date-widget-root');

  if (!el) {
    return null;
  }

  const { fullPath, iid, editable } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarDueDateWidgetRoot',
    apolloProvider,
    provide: {
      canUpdate: editable,
    },
    render: (createElement) =>
      createElement(SidebarDueDateWidget, {
        props: {
          iid: String(iid),
          fullPath,
          issuableType: IssuableType.Issue,
        },
      }),
  });
}

function mountSidebarReferenceWidget() {
  const el = document.querySelector('.js-sidebar-reference-widget-root');

  if (!el) {
    return null;
  }

  const { fullPath, iid } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarReferenceWidgetRoot',
    apolloProvider,
    provide: {
      iid: String(iid),
      fullPath,
    },
    render: (createElement) =>
      createElement(SidebarReferenceWidget, {
        props: {
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
        },
      }),
  });
}

function mountIssuableLockForm(store) {
  const el = document.querySelector('.js-sidebar-lock-root');

  if (!el || !store) {
    return null;
  }

  const { fullPath, editable } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarLockRoot',
    store,
    provide: {
      fullPath,
    },
    render: (createElement) =>
      createElement(IssuableLockForm, {
        props: {
          isEditable: editable,
        },
      }),
  });
}

function mountSidebarParticipantsWidget() {
  const el = document.querySelector('.js-sidebar-participants-widget-root');

  if (!el) {
    return null;
  }

  const { fullPath, iid } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarParticipantsWidgetRoot',
    apolloProvider,
    render: (createElement) =>
      createElement(SidebarParticipantsWidget, {
        props: {
          iid: String(iid),
          fullPath,
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
        },
      }),
  });
}

function mountSidebarSubscriptionsWidget() {
  const el = document.querySelector('.js-sidebar-subscriptions-widget-root');

  if (!el) {
    return null;
  }

  const { fullPath, iid, editable } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarSubscriptionsWidgetRoot',
    apolloProvider,
    provide: {
      canUpdate: editable,
    },
    render: (createElement) =>
      createElement(SidebarSubscriptionsWidget, {
        props: {
          iid: String(iid),
          fullPath,
          issuableType:
            isInIssuePage() || isInIncidentPage() || isInDesignPage()
              ? IssuableType.Issue
              : IssuableType.MergeRequest,
        },
      }),
  });
}

function mountSidebarTimeTracking() {
  const el = document.querySelector('.js-sidebar-time-tracking-root');
  const { id, iid, fullPath, issuableType, timeTrackingLimitToHours } = getSidebarOptions();

  if (!el) {
    return null;
  }

  return new Vue({
    el,
    name: 'SidebarTimeTrackingRoot',
    apolloProvider,
    provide: { issuableType },
    render: (createElement) =>
      createElement(SidebarTimeTracking, {
        props: {
          fullPath,
          issuableId: id.toString(),
          issuableIid: iid.toString(),
          limitToHours: timeTrackingLimitToHours,
        },
      }),
  });
}

function mountSidebarSeverity() {
  const el = document.querySelector('.js-sidebar-severity-root');

  if (!el) {
    return null;
  }

  const { fullPath, iid, severity, editable } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarSeverityRoot',
    apolloProvider,
    provide: {
      canUpdate: editable,
    },
    render: (createElement) =>
      createElement(SidebarSeverity, {
        props: {
          projectPath: fullPath,
          iid: String(iid),
          initialSeverity: severity.toUpperCase(),
        },
      }),
  });
}

function mountSidebarEscalationStatus() {
  const el = document.querySelector('.js-sidebar-escalation-status-root');

  if (!el) {
    return null;
  }

  const { issuableType } = getSidebarOptions();
  const { canUpdate, issueIid, projectPath } = el.dataset;

  return new Vue({
    el,
    name: 'SidebarEscalationStatusRoot',
    apolloProvider,
    provide: {
      canUpdate: parseBoolean(canUpdate),
    },
    render: (createElement) =>
      createElement(SidebarEscalationStatus, {
        props: {
          iid: issueIid,
          issuableType,
          projectPath,
        },
      }),
  });
}

function mountCopyEmailToClipboard() {
  const el = document.querySelector('.js-sidebar-copy-email-root');

  if (!el) {
    return null;
  }

  const { createNoteEmail } = getSidebarOptions();

  return new Vue({
    el,
    name: 'SidebarCopyEmailRoot',
    render: (createElement) =>
      createElement(CopyEmailToClipboard, { props: { issueEmailAddress: createNoteEmail } }),
  });
}

const isAssigneesWidgetShown =
  (isInIssuePage() || isInDesignPage() || isInMRPage()) && gon.features.issueAssigneesWidget;

export function mountSidebar(mediator, store) {
  initInviteMembersModal();
  initInviteMembersTrigger();
  mountSidebarTodoWidget();
  if (isAssigneesWidgetShown) {
    mountSidebarAssigneesWidget();
  } else {
    mountSidebarAssigneesDeprecated(mediator);
  }
  mountSidebarReviewers(mediator);
  mountSidebarCrmContacts();
  mountSidebarLabelsWidget();
  mountSidebarMilestoneWidget();
  mountSidebarConfidentialityWidget();
  mountSidebarDueDateWidget();
  mountSidebarReferenceWidget();
  mountIssuableLockForm(store);
  mountSidebarParticipantsWidget();
  mountSidebarSubscriptionsWidget();
  mountCopyEmailToClipboard();
  mountSidebarTimeTracking();
  mountSidebarSeverity();
  mountSidebarEscalationStatus();

  new SidebarMoveIssue(
    mediator,
    $('.js-move-issue'),
    $('.js-move-issue-confirmation-button'),
  ).init();
}

export { getSidebarOptions };