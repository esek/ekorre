import { ApolloError } from 'apollo-server-errors';

export type RequestErrorResponse = {
  errorType: string;
  statusCode: number;
  message: string;
  stack?: string;
};

abstract class RequestError extends ApolloError {
  abstract code: number;
  abstract name: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }

  public response(stack?: string): RequestErrorResponse {
    return {
      errorType: this.name,
      statusCode: this.code,
      message: this.message,
      stack: stack ?? this.stack,
    };
  }

  public log() {
    return `{${this.name}} Request failed with status ${this.code} - ${this.message}`;
  }
}

export class BadRequestError extends RequestError {
  code = 400;
  name = 'BadRequestError';
}

export class UnauthenticatedError extends RequestError {
  code = 401;
  name = 'UnauthenticatedError';
}

export class ForbiddenError extends RequestError {
  code = 403;
  name = 'ForbiddenError';
}

export class ServerError extends RequestError {
  code = 500;
  name = 'ServerError';
}

export class NotFoundError extends RequestError {
  code = 404;
  name = 'NotFoundError';
}

export default RequestError;
