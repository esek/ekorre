import { ActivityAPI } from '@api/activity';
import { OrbiAPI } from '@api/orbi';
import { Utskott } from '@generated/graphql';

const orbiApi = new OrbiAPI();

const actApi = new ActivityAPI();

test('adding and removing two events', async () => {
  const startDate = new Date(62, 8, 1);
  const event = await actApi.addActivity({
    title: 'yett',
    description: 'yetting',
    startDate: startDate,
    endDate: startDate,
    utskott: Utskott.Enu,
    location: 'here',
  });

  console.log(event);
  const event2 = await actApi.addActivity({
    title: 'yett2',
    description: 'yetting2',
    startDate: startDate,
    endDate: startDate,
    utskott: Utskott.Cm,
    location: 'here2',
  });

  console.log(event2);

  let events = await actApi.getActivites(startDate, startDate, Object.values(Utskott));
  console.log(events);

  await actApi.removeActivity(events[0].refKey);
  events = await actApi.getActivites(startDate, startDate, Object.values(Utskott));
  console.log(events);

  await actApi.removeActivity(events[0].refKey);
  events = await actApi.getActivites(startDate, startDate, Object.values(Utskott));
  console.log(events);
});

test('getting orbi activities from different months', async () => {
  const departments = Object.values(Utskott);
  const startDate = new Date(2023, 1, 2);
  console.log('Time it takes to do one activity call without cached data');
  let start = performance.now();
  const res = await orbiApi.getActivities(startDate, new Date(Date.now()), departments);
  let end = performance.now();

  console.log(end - start, 'milliseconds');
  console.log(res);

  const count = 100;
  console.log('Time it takes to do', count, 'activity calls with cached data');
  start = performance.now();
  for (let i = 0; i < count; i++) {
    await orbiApi.getActivities(startDate, new Date(Date.now()), departments);
  }
  end = performance.now();

  console.log(end - start, 'milliseconds');
  const allActs = await actApi.getAllActivities();
  console.log(allActs);
}, 15000);

test('getting orbi E-sektionen org tree', async () => {
  const departments = Object.values(Utskott);
  const dep = await orbiApi.getDepartmentInfo(departments);
  console.log(dep);
});
