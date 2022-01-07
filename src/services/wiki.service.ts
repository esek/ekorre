import { AxiosInstance, default as axios } from 'axios';
import setCookieParser, { Cookie } from 'set-cookie-parser';

import config from '../config';
import { Logger } from '../logger';
import { WikiEditCountResponse, WikiLoginResponse } from '../models/wiki';

const { WIKI } = config;
const logger = Logger.getLogger('WikiService');

class EWiki {
  private axios: AxiosInstance;
  private isAuthenticated: boolean;
  private cookies: Cookie[];

  constructor() {
    this.axios = axios.create({
      baseURL: WIKI.URL,
      withCredentials: true,
    });

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
        logger.warn(`Sometihing went wrong: ${data.login}`);
        return false;
      }

      logger.info(`Logged in user ${data.login.lgusername} to wiki`);

      this.isAuthenticated = true;
      return true;
    } catch (err) {
      logger.error(`Failed to login to wiki: ${err}`);

      this.isAuthenticated = false;
      return false;
    }
  }

  public async getNbrOfUserEdits(username: string): Promise<number> {
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
      if (data.error?.code === 'readapidenied') {
        logger.info('Unauthorized, reauthenticating');
        this.isAuthenticated = false;
        return this.getNbrOfUserEdits(username);
      }

      // User does not have a wiki account
      if (data.query.users[0].missing) {
        return 0;
      }

      return data.query.users[0].editcount ?? 0;
    } catch (err) {
      logger.error(`Failed to get user edits: ${err}`);

      return 0;
    }
  }

  private request<T>(params: URLSearchParams, method: 'get' | 'post' = 'get') {
    params.append('format', 'json');

    const headers = {
      cookie: this.cookie,
    };

    return this.axios.request<T>({
      url: this.url(params),
      method,
      headers,
    });
  }

  private url(params: URLSearchParams) {
    params.append('format', 'json');
    return `/api.php?${params.toString()}`;
  }
}

export default EWiki;
