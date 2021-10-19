import { AxiosRequestConfig } from 'axios';

/**
 * Inställningar till en axios-instans
 * som gör att den sparar cookies
 */
export const AXIOS_CONFIG: AxiosRequestConfig = {
  withCredentials: true, // To get cookies/jwt
  baseURL: `http://localhost:${process.env.PORT ?? ''}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
};
