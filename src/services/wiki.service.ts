import config from '@/config';
import { Logger } from '@/logger';
import { WikiEditCountResponse, WikiLoginResponse } from '@/models/wiki';
import axios, { AxiosInstance } from 'axios';
import setCookieParser, { Cookie } from 'set-cookie-parser';

const { WIKI } = config;
const logger = Logger.getLogger('WikiService');

/**
 * Service to talk to E-Wiki
 * Requires the WIKI-configuration variables in `/src/config.ts`
 * to be set or it will always return 0
 */
class EWiki {
  private axios: AxiosInstance;
  private isAuthenticated: boolean;
  private cookies: Cookie[];

  constructor() {
    // Create axios instance
    this.axios = axios.create({
      baseURL: WIKI.URL,
      withCredentials: true,
    });

    // Set default parameters
    this.isAuthenticated = false;
    this.cookies = [];
  }

  /**
   * Converts the cookie array to a string of wiki cookies
   */
  private get cookie() {
    return this.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  }

  /**
   * Logs in the user with the provided env-variables
   * @param token A token needed to login
   * @returns A promise that resolves when the login is complete
   */
  private async login(token?: string): Promise<boolean> {
    const params = new URLSearchParams({
      action: 'login',
      lgname: WIKI.USERNAME,
      lgpassword: WIKI.PASSWORD,
    });

    if (token) {
      params.append('lgtoken', token);
    }

    try {
      const { data, headers } = await this.request<WikiLoginResponse>(params, 'post');

      const newCookies = setCookieParser.parse(headers['set-cookie']);
      this.cookies = [...this.cookies, ...newCookies];

      // If token is needed, just rerun the function with the token
      if (data.login.result === 'NeedToken') {
        logger.info('Token needed, rerunning login');
        return this.login(data.login.token);
      }

      // Something else went wrong
      if (data.login.result !== 'Success') {
        return false;
      }

      logger.info(`Logged in user ${data.login.lgusername} to wiki`);

      this.isAuthenticated = true;
      return true;
    } catch (err) {
      logger.error(`Failed to login to wiki ${err as string}`);

      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Fetches the edit count of a single user
   * If the user is not authenticated, it will try to login
   * If the request still fails, it will retry once before returning 0
   * @param {string} username The username of the user to fetch the edit count for
   * @param {boolean} retrying Whether this is a retry or not
   */
  public async getNbrOfUserEdits(username: string, retrying = false): Promise<number> {
    if (!this.isAuthenticated) {
      await this.login();
    }

    const params = new URLSearchParams({
      action: 'query',
      list: 'users',
      ususers: username,
      usprop: 'editcount',
    });

    try {
      const { data } = await this.request<WikiEditCountResponse>(params);

      // Unauthorized, we need to reauthenticate
      if (data.error?.code === 'readapidenied' && !retrying) {
        logger.info('Unauthorized, reauthenticating');
        this.isAuthenticated = false;
        return this.getNbrOfUserEdits(username, true);
      }

      // User does not have a wiki account
      if (data.query.users[0].missing) {
        return 0;
      }

      return data.query.users[0].editcount ?? 0;
    } catch (err) {
      logger.error(`Failed to get user edits: ${err as string}`);

      return 0;
    }
  }
  /**
   * Helper method to make requests to the Wiki-API.
   * @param params The query parameters to send, (will always include format=json)
   * @param method The HTTP method to use, defaults to `GET`
   * @returns An axios response containing data of type `<T>` and the response headers
   */
  private async request<T>(params: URLSearchParams, method: 'get' | 'post' = 'get') {
    params.append('format', 'json');

    const headers = {
      cookie: this.cookie,
    };

    return this.axios
      .request<T>({ url: this.url(params), method, headers })
      .then((res) => ({ data: res.data, headers: res.headers as Record<string, string> }));
  }

  /**
   * Helper method to convert the query parameters to a url
   * @param params Search parameters to add to the url
   * @returns The url with the query parameters
   */
  private url(params: URLSearchParams) {
    params.append('format', 'json');
    return `/api.php?${params.toString()}`;
  }
}

export default EWiki;
