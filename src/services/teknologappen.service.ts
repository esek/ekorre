import config from '@/config';
import { ServerError } from '@/errors/request.errors';
import { PrismaUtskott } from '@prisma/client';
import axios, { AxiosRequestConfig } from 'axios';

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

export type TeknologappenLocalizedText = Record<string, string>;

export type TeknologappenActivity = {
  id: string;
  host_ids: string[];
  creator_name: TeknologappenLocalizedText;
  creator_path: string;
  title: TeknologappenLocalizedText;
  description: TeknologappenLocalizedText;
  location: {
    name: TeknologappenLocalizedText;
    directions: TeknologappenLocalizedText;
    coordinate_wgs84: {
      north: number;
      east: number;
    } | null;
    url: string | null;
  };
  time_start: string;
  time_end: string;
  image_url: string;
  is_hidden: boolean;
  earliest_purchasable_ticket_release: string | null;
};

type ActivitiesResponse = TeknologappenActivity[] | { activities: TeknologappenActivity[] };

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
const ACTIVITIES_URL = 'https://api.teknologappen.se/v0/activities';
const CALLBACK_URL_V1 = 'https://api.teknologappen.se/v0/user/auth-callback/v1';

class TeknologappenService {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const { data } = await axios.post<TokenResponse>(
        AUTH_URL,
        {
          key: TEKNOLOGAPPEN.API_KEY,
          callback_url_v1: CALLBACK_URL_V1,
          default_name: 'Ekorre',
          default_language: 'sv',
        } satisfies ApiKeyRequest,
      );
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

  public async getActivities(): Promise<TeknologappenActivity[]> {
    try {
      const token = await this.getAccessToken();
      const request: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const { data } = await axios.get<ActivitiesResponse>(ACTIVITIES_URL, request);

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data.activities)) {
        return data.activities;
      }

      throw new Error('Activities response did not contain an activity list');
    } catch (error) {
      if (error instanceof ServerError) {
        throw error;
      }
      throw new ServerError(`Kunde inte hämta aktiviteter från Teknologappen: ${String(error)}`);
    }
  }
}

export default TeknologappenService;
