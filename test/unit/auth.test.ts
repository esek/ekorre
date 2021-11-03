import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

import { issueToken, verifyToken, invalidateToken, EXPIRE_MINUTES } from '../../src/auth';
import type { StrictObject } from '../../src/models/base';

interface TestType extends StrictObject {
  test: string;
}

// Creates new random test object, but checks that it
// has not been created before
const createRandomTestObj = (() => {
  const usedValues: string[] = [];

  return (): TestType => {
    let randomData = randomBytes(20).toString('hex');
    while (usedValues.includes(randomData)) {
      randomData = randomBytes(20).toString('hex');
    }

    usedValues.push(randomData);
    return { test: randomData } as TestType;
  };
})();

// Vi kontrollerar att jwts sign-metod kallas
const signSpy = jest.spyOn(jwt, 'sign');
const verifySpy = jest.spyOn(jwt, 'verify');

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop till jwt.sign() och jwt.verify()
  jest.clearAllMocks();
  jest.useRealTimers();
});

test('issueToken for accessToken should use jwt to sign', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'accessToken');

  expect(token).not.toBeNull();
  expect(signSpy).toHaveBeenCalledTimes(1);
});

test('issueToken for refreshToken should use jwt to sign', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'refreshToken');

  expect(token).not.toBeNull();
  expect(signSpy).toHaveBeenCalledTimes(1);
});

test('creating, verifying and invalidating accessToken', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'accessToken');
  const decodedToken = verifyToken<TestType>(token, 'accessToken');

  // decodedToken innehåller även info om tider
  const { iat, exp, ...reducedDecodedToken } = decodedToken;
  expect(reducedDecodedToken).toStrictEqual(testObj);

  expect(signSpy).toHaveBeenCalledTimes(1);
  expect(verifySpy).toHaveBeenCalledTimes(1);

  invalidateToken(token);

  expect(() => verifyToken(token, 'accessToken')).toThrowError();

  // jwt.verify() ska inte ha kallats en gång till
  expect(verifySpy).toHaveBeenCalledTimes(1);
});

test('creating, verifying and invalidating refreshToken', () => {
  const testObj = createRandomTestObj();


  const token = issueToken(testObj, 'refreshToken');
  const decodedToken = verifyToken<TestType>(token, 'refreshToken');

  // decodedToken innehåller även info om tider
  const { iat, exp, ...reducedDecodedToken } = decodedToken;
  expect(reducedDecodedToken).toStrictEqual(testObj);

  expect(signSpy).toHaveBeenCalledTimes(1);
  expect(verifySpy).toHaveBeenCalledTimes(1);

  invalidateToken(token);

  expect(() => verifyToken(token, 'refreshToken')).toThrowError();

  // jwt.verify() ska inte ha kallats en gång till
  expect(verifySpy).toHaveBeenCalledTimes(1);
});

test('invalidate accessToken after EXPIRE_MINUTES.accessToken minutes', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'accessToken');

  // Verifiera att token fungerar
  const decodedToken = verifyToken<TestType>(token, 'accessToken');
  const { iat, exp, ...reducedDecodedToken } = decodedToken;
  expect(reducedDecodedToken).toStrictEqual(testObj);

  // Vi fejkar nu att system time är 60 minuter fram
  const trueTime = new Date();
  jest
    .useFakeTimers()
    .setSystemTime(new Date(trueTime.getTime() + EXPIRE_MINUTES.accessToken * 60000));

  expect(() => verifyToken(token, 'accessToken')).toThrowError();
});

test('invalidate refreshToken after EXPIRE_MINUTES.refreshToken minutes', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'refreshToken');

  // Verifiera att token fungerar
  const decodedToken = verifyToken<TestType>(token, 'refreshToken');
  const { iat, exp, ...reducedDecodedToken } = decodedToken;
  expect(reducedDecodedToken).toStrictEqual(testObj);

  // Vi fejkar nu att system time är 15 dagar fram
  const trueTime = new Date();
  jest
    .useFakeTimers()
    .setSystemTime(new Date(trueTime.getTime() + EXPIRE_MINUTES.refreshToken * 60000));

  expect(() => verifyToken(token, 'refreshToken')).toThrowError();
});

test('valid accessToken is invalid refreshToken', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'accessToken');

  // Verifiera att token fungerar
  const decodedToken = verifyToken<TestType>(token, 'accessToken');
  const { iat, exp, ...reducedDecodedToken } = decodedToken;
  expect(reducedDecodedToken).toStrictEqual(testObj);

  expect(() => verifyToken(token, 'refreshToken')).toThrowError();
});

test('valid refreshToken is invalid accessToken', () => {
  const testObj = createRandomTestObj();

  const token = issueToken(testObj, 'refreshToken');

  // Verifiera att token fungerar
  const decodedToken = verifyToken<TestType>(token, 'refreshToken');
  const { iat, exp, ...reducedDecodedToken } = decodedToken;
  expect(reducedDecodedToken).toStrictEqual(testObj);

  expect(() => verifyToken(token, 'accessToken')).toThrowError();
});