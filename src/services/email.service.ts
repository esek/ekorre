import axios from 'axios';

import config from '../config';

const {
  EBREV: { URL, API_TOKEN },
} = config;

/*
  Creates an axios-instance and sets the baseUrl and authorization header
  to the corresponding values in the config
*/

const api = axios.create({
  baseURL: URL,
  headers: { Authorization: API_TOKEN },
});

export const sendEmail = (
  to: string[] | string,
  subject: string,
  templateName: string,
  overrides: Record<string, string>,
) =>
  api.post('/send', {
    to: to instanceof Array ? to : [to],
    subject,
    templateName,
    overrides,
  });
