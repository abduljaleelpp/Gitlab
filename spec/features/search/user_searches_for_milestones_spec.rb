# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'User searches for milestones', :js, :clean_gitlab_redis_rate_limiting do
  using RSpec::Parameterized::TableSyntax

  let_it_be(:user) { create(:user) }
  let_it_be(:project) { create(:project, namespace: user.namespace) }

  let!(:milestone1) { create(:milestone, title: 'Foo', project: project) }
  let!(:milestone2) { create(:milestone, title: 'Bar', project: project) }

  where(search_page_vertical_nav_enabled: [true, false])

  with_them do
    before do
      project.add_maintainer(user)
      sign_in(user)
      stub_feature_flags(search_page_vertical_nav: search_page_vertical_nav_enabled)

      visit(search_path)
    end

    include_examples 'top right search form'
    include_examples 'search timeouts', 'milestones'

    it 'finds a milestone' do
      fill_in('dashboard_search', with: milestone1.title)
      find('.gl-search-box-by-click-search-button').click
      select_search_scope('Milestones')

      page.within('.results') do
        expect(page).to have_link(milestone1.title)
        expect(page).not_to have_link(milestone2.title)
      end
    end

    context 'when on a project page' do
      it 'finds a milestone' do
        find('[data-testid="project-filter"]').click

        wait_for_requests

        page.within('[data-testid="project-filter"]') do
          click_on(project.name)
        end

        fill_in('dashboard_search', with: milestone1.title)
        find('.gl-search-box-by-click-search-button').click
        select_search_scope('Milestones')

        page.within('.results') do
          expect(page).to have_link(milestone1.title)
          expect(page).not_to have_link(milestone2.title)
        end
      end
    end
  end
end
