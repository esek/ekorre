import { toUTC, stripObject } from '../../src/util';

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

test('Check stripObject stripping', () => {
  const b: Berry = { score: 10, color: 'brown' };
  const a: Partial<Avocado> = stripObject<Berry, Avocado>(b);
  expect(a).toStrictEqual(b);
});

test('Check stripObject double extention stripping', () => {
  const b: Berry = { score: 10, color: 'brown' };
  const j: Partial<Jam> = stripObject<Berry, Jam>(b);
  expect(j).toStrictEqual(b);
});
