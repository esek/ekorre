import axios from 'axios';

/**
 * En instans av axios som är lämplig för att
 * göra requests till ekorre-API:n
 */
export const axiosInstance = axios.create({
  withCredentials: true, // To get cookies/jwt
  baseURL: `http://localhost:${process.env.PORT ?? ''}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});
