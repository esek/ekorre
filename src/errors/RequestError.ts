abstract class RequestError extends Error {
  abstract code: number;

  constructor(message: string) {
    super(message);
    this.message = message;
  }

  public response() {
    return {
      success: false,
      errorType: this.name,
      statusCode: this.code,
      message: this.print(),
    };
  }

  private print() {
    return `Anropet misslyckades med statuskod ${this.code} - ${this.message}`;
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

export class ServerError extends RequestError {
  code = 500;
  name = 'ServerError';
}

export default RequestError;
