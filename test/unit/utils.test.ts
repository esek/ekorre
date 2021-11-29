import { toUTC, stripObject, midnightTimestamp } from '../../src/util';

test('Check time conversion Malmö to UTC', () => {
  const greatDay = new Date('March 13, 1999 17:48 UTC+1');
  const expectedGreatDayUTC = new Date('March 13, 1999 16:48 UTC');
  expect(toUTC(greatDay)).toStrictEqual(expectedGreatDayUTC);
});

// Types att användas av stripObject-test
type Berry = {
  score: number;
  color: string;
};

interface Avocado extends Berry {
  ripe: boolean;
}

interface Jam extends Avocado {
  liquid: boolean;
}

test('stripObject stripping', () => {
  const b: Berry = { score: 10, color: 'brown' };
  const a: Partial<Avocado> = stripObject<Berry, Avocado>(b);
  expect(a).toStrictEqual(b);
});

test('stripObject double extention stripping', () => {
  const b: Berry = { score: 10, color: 'brown' };
  const j: Partial<Jam> = stripObject<Berry, Jam>(b);
  expect(j).toStrictEqual(b);
});

test('test getting before midnight timestamp', () => {
  // January is month 0
  const d0 = new Date(2021, 10, 30, 22, 36, 53, 7);
  const d1 = new Date(1928, 3, 1, 0, 22, 22, 0);
  const beforeDate0 = new Date(midnightTimestamp(d0, 'before'));
  const beforeDate1 = new Date(midnightTimestamp(d1, 'before'));
  expect(beforeDate0.toISOString()).toEqual('2021-11-30T23:59:59.999Z');
  expect(beforeDate1.toISOString()).toEqual('1928-04-01T23:59:59.999Z');
});

test('test getting after midnight timestamp', () => {
  // January is month 0
  const d0 = new Date(2021, 10, 30, 22, 36, 53, 7);
  const d1 = new Date(1928, 4, 1, 3, 22, 22, 0);
  const afterDate0 = new Date(midnightTimestamp(d0, 'after'));
  const afterDate1 = new Date(midnightTimestamp(d1, 'after'));
  expect(afterDate0.toISOString()).toEqual('2021-11-30T00:00:00.000Z');
  expect(afterDate1.toISOString()).toEqual('1928-05-01T00:00:00.000Z');
});