export interface ApiRequest {
  query: string;
  variables: {
    [key: string]: unknown;
  };
}

type BaseHeaders = {
  'set-cookie'?: string[];
};

export type GraphqlResponse<Data = unknown, Headers = Record<string, string>> = {
  headers: BaseHeaders & Headers;
  data: {
    data: Data;
    errors?: RequestErrorResponse[];
  };
};

export type GraphqlResponseData<T = unknown> = {
  data: {
    [key: string]: T;
  };
  errors?: RequestErrorResponse[];
  http?: {
    headers: Headers;
  };
};
