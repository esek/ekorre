import { Activity, ActivitySource } from '@generated/graphql';
import { PrismaActivity, PrismaActivitySource, PrismaUtskott } from '@prisma/client';
import { activityReducer } from '@reducer/activity';

test('reducing valid DatabaseActivity', () => {
  const activity: PrismaActivity = {
    id: 'testID',
    source: PrismaActivitySource.WEBSITE,
    title: 'TestTitle',
    description: 'TestDescription',
    startDate: new Date('2024-02-03'),
    endDate: null,
    utskott: PrismaUtskott.E6,
    imageUrl: null,
    locationTitle: 'LocationTestTitle',
    locationLink: 'LocationLinkTest',
  };

  const expected: Activity = {
    id: 'testID',
    source: ActivitySource.Website,
    title: 'TestTitle',
    description: 'TestDescription',
    startDate: new Date('2024-02-03'),
    endDate: null,
    utskott: PrismaUtskott.E6,
    imageUrl: null,
    location: {
      title: 'LocationTestTitle',
      link: 'LocationLinkTest',
    },
  };

  const impossibleActivity: PrismaActivity = {
    ...activity,
    locationTitle: null,
    locationLink: 'Link with no title not possible through graph, should reduce to remove this',
  };

  const impossbileExpected: Activity = {
    ...expected,
    location: undefined, //because link should not exist if there is no title.
  };

  const linkNullActivity: PrismaActivity = {
    ...activity,
    locationTitle: 'title with no link is possible through graph, should reduce to make link null',
    locationLink: null,
  };

  const linkNullExpected: Activity = {
    ...expected,
    location: {
      title: 'title with no link is possible through graph, should reduce to make link null',
      link: null,
    },
  };

  expect(activityReducer(activity)).toMatchObject(expected);
  expect(activityReducer(impossibleActivity)).toMatchObject(impossbileExpected);
  expect(activityReducer(linkNullActivity)).toMatchObject(linkNullExpected);
});
