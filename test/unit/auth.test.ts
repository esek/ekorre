import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

import type { StrictObject } from '../../src/models/base';
import { issueToken, verifyToken, invalidateToken, EXPIRE_MINUTES } from '../../src/auth';

interface TestType extends StrictObject {
  test: string,
  daddy: string,
  please: string
}

const testObj: TestType = {
  test: 'me',
  daddy: 'now',
  please: 'OwO',
};

// Vi kontrollerar att jwts sign-metod kallas
const signSpy = jest.spyOn(jwt, 'sign');
const verifySpy = jest.spyOn(jwt, 'verify');

beforeEach(() => {
  // För att vi ska återställa räkningen
  // av anrop till jwt.sign() och jwt.verify()
  jest.clearAllMocks();
});

test('issueToken for accessToken should use jwt to sign', () => {
  const token = issueToken(testObj, 'accessToken');

  expect(token).not.toBeNull();
  expect(signSpy).toHaveBeenCalledTimes(1);
});

test('issueToken for refreshToken should use jwt to sign', () => {
  const token = issueToken(testObj, 'refreshToken');
  
  expect(token).not.toBeNull();
  expect(signSpy).toHaveBeenCalledTimes(1);
});

test('creating, verifying and invalidating accessToken', () => {
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