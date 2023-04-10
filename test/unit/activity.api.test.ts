import config from '@/config';
import { ActivityAPI } from '@api/activity';
import { Utskott } from '@generated/graphql';

let api: ActivityAPI;

beforeEach(() => {
  api = new ActivityAPI();
});

test('adding and removing two events', async () => {
  if (config.ORBI.KEY.length === 0) {
    console.log('aborting test, no orbi api key specified');
    return;
  }
  const startDate = new Date(62, 8, 1);
  const event = await api.addActivity({
    title: 'yett',
    description: 'yetting',
    startDate: startDate,
    endDate: startDate,
    utskott: Utskott.Enu,
    location: 'here',
  });

  expect(event).toBe(true);

  const event2 = await api.addActivity({
    title: 'yett2',
    description: 'yetting2',
    startDate: startDate,
    endDate: startDate,
    utskott: Utskott.Cm,
    location: 'here2',
  });

  expect(event2).toBe(true);

  let events = await api.getActivities(startDate, startDate, Object.values(Utskott));

  expect(events.length).toBe(2);

  await api.removeActivity(events[0].id);
  events = await api.getActivities(startDate, startDate, Object.values(Utskott));

  expect(events.length).toBe(1);

  await api.removeActivity(events[0].id);
  events = await api.getActivities(startDate, startDate, Object.values(Utskott));
  expect(events.length).toBe(0);
});

test('Comparing non cached vs cached activity data speed', async () => {
  if (config.ORBI.KEY.length === 0) {
    console.log('aborting test, no orbi api key specified');
    return;
  }
  const departments = Object.values(Utskott);
  const startDate = new Date(2023, 1, 2);
  let start = performance.now();
  await api.getActivities(startDate, new Date(Date.now()), departments);
  let end = performance.now();

  console.log(
    'Time it takes to do one activity call without cached data:',
    end - start,
    'milliseconds',
  );

  const count = 100;
  start = performance.now();
  for (let i = 0; i < count; i++) {
    await api.getActivities(startDate, new Date(Date.now()), departments);
  }
  end = performance.now();

  console.log(
    'Time it takes to do',
    count,
    'activity calls with cached data:',
    end - start,
    'milliseconds',
  );
}, 15000);
