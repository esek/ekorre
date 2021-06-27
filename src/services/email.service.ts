import axios from 'axios';

import config from '../config';

const { EBREV } = config;

const api = axios.create({
  baseURL: EBREV.URL,
  headers: { Authorization: EBREV.API_TOKEN },
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
