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
  data: GraphqlResponseData;
};

export type GraphqlResponseData = {
  data: Data | {
    [key: string]: unknown;
  };
  errors?: RequestErrorResponse[];
};