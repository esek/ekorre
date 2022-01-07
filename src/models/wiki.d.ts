type BaseLoginResponse<T> = {
  login: {
    result: string;
    sessionId: string;
    cookiePrefix: string;
  } & T;
};

type FailedLoginResponse = {
  result: 'NeedToken';
  token: string;
};

type SuccessfulLoginResponse = {
  result: 'Success';
  lguserid: string;
  lgusername: string;
  lgtoken: string;
};

export type WikiLoginResponse = BaseLoginResponse<FailedLoginResponse | SuccessfulLoginResponse>;

export type WikiEditCountResponse = {
  error?: {
    code: string;
    info: string;
  };
  query: {
    users: [
      {
        editcount?: number;
        missing?: string;
      },
    ];
  };
};
