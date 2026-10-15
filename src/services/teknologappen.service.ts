import config from '@/config';
import { ServerError } from '@/errors/request.errors';
import { components } from '@generated/teknologappen';
import { PrismaUtskott } from '@prisma/client';
import axios, { AxiosRequestConfig, Method } from 'axios';

type ApiKeyRequest = {
  key: string;
  callback_url_v1: string;
  default_name: string;
  default_language: string;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

type Schemas = components['schemas'];

export type TeknologappenActivity = Schemas['BriefActivity'];
export type TeknologappenGroup = Schemas['FatGroup'];
export type TeknologappenPutGroup = Schemas['PutGroup'];
export type TeknologappenUser = Schemas['AdminUser'];
export type TeknologappenMe = Schemas['Me'];
type MinilithError = Schemas['MinilithError'];

/**
 * Group path of each utskott in Teknologappen. `OTHER` maps to the guild itself.
 */
export const TEKNOLOGAPPEN_UTSKOTT_PATHS: Record<PrismaUtskott, string> = {
  CM: 'tlth.e.cafemasteriet',
  E6: 'tlth.e.e6',
  ENU: 'tlth.e.naringslivsutskottet',
  FVU: 'tlth.e.fvu',
  INFU: 'tlth.e.infu',
  KM: 'tlth.e.km',
  NOJU: 'tlth.e.noju',
  NOLLU: 'tlth.e.nollu',
  OTHER: 'tlth.e',
  PENGU: 'tlth.e.pengu',
  SRE: 'tlth.e.studieradet',
  STYRELSEN: 'tlth.e.board',
};

const { TEKNOLOGAPPEN } = config;
const AUTH_URL = 'https://api.auth.teknologappen.se/api/v0/api-key-get-access-token';
const API_URL = 'https://api.teknologappen.se/v0';
const CALLBACK_URL_V1 = 'https://api.teknologappen.se/v0/user/auth-callback/v1';

class TeknologappenService {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const body: ApiKeyRequest = {
      key: TEKNOLOGAPPEN.API_KEY,
      callback_url_v1: CALLBACK_URL_V1,
      default_name: 'Ekorre',
      default_language: 'sv',
    };

    try {
      const { data } = await axios.post<TokenResponse>(AUTH_URL, body);
      if (!data.access_token) {
        throw new Error('Authentication response did not contain an access token');
      }

      this.accessToken = data.access_token;
      this.accessTokenExpiresAt = Date.now() + Math.max(data.expires_in - 30, 1) * 1000;
      return data.access_token;
    } catch (error) {
      this.accessToken = undefined;
      this.accessTokenExpiresAt = 0;
      throw new ServerError(`Kunde inte autentisera mot Teknologappen: ${String(error)}`);
    }
  }

  /**
   * Sends an authenticated request to the Teknologappen API
   * @param method HTTP method
   * @param path Path relative to `/v0`, starting with `/`
   * @param data Optional JSON body
   * @throws {ServerError} With the status and the error message from Teknologappen
   */
  private async request<T = void>(method: Method, path: string, data?: unknown): Promise<T> {
    const token = await this.getAccessToken();
    const request: AxiosRequestConfig = {
      method,
      url: `${API_URL}${path}`,
      data,
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      const res = await axios.request<T>(request);
      return res.data;
    } catch (error) {
      if (axios.isAxiosError<MinilithError>(error) && error.response) {
        const { status, data: body } = error.response;
        const message = body?.message ?? error.message;
        throw new ServerError(`Teknologappen svarade ${status} på ${method} ${path}: ${message}`);
      }
      throw new ServerError(`Kunde inte nå Teknologappen (${method} ${path}): ${String(error)}`);
    }
  }

  public async getActivities(): Promise<TeknologappenActivity[]> {
    return this.request<TeknologappenActivity[]>('GET', '/activities');
  }

  /**
   * Gets every group in the tlth tree, including the ones we can only see
   */
  public async getGroupTree(): Promise<TeknologappenGroup[]> {
    return this.request<TeknologappenGroup[]>('GET', '/groups/tree');
  }

  /**
   * Creates or fully replaces a group. The id is chosen by the caller for new groups
   */
  public async putGroup(id: string, group: TeknologappenPutGroup): Promise<void> {
    return this.request('PUT', `/admin/groups/${id}`, group);
  }

  /**
   * Gets the account the API key logs in as
   */
  public async getMe(): Promise<TeknologappenMe> {
    return this.request<TeknologappenMe>('GET', '/user');
  }

  /**
   * Makes a user direct admin of a group. Requires adminship in the group or its parent
   */
  public async addGroupAdmin(groupId: string, userId: string): Promise<void> {
    await this.request('POST', `/admin/groups/${groupId}/admins`, { user_id: userId });
  }

  /**
   * Lists the direct members of a group. Requires adminship in the group
   */
  public async getGroupMembers(groupId: string): Promise<TeknologappenUser[]> {
    return this.request<TeknologappenUser[]>('GET', `/admin/groups/${groupId}/members`);
  }

  /**
   * Adds a direct member. The user does not need to have logged in to the app yet
   * @param memberId Prefixed user id, e.g. `lund-university:ab1234cd-s`. Unprefixed ids
   * are stored as they are and do not match any real account
   */
  public async addGroupMember(groupId: string, memberId: string): Promise<void> {
    return this.request('PUT', `/admin/groups/${groupId}/members/${encodeURIComponent(memberId)}`);
  }

  public async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    return this.request(
      'DELETE',
      `/admin/groups/${groupId}/members/${encodeURIComponent(memberId)}`,
    );
  }
}

export default TeknologappenService;
