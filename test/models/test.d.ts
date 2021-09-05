export interface ApiRequest {
  query: string;
  variables: {
    [key: string]: any;
  };
}
