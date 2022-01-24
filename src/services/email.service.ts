import config from '@/config';
import { ServerError } from '@/errors/RequestErrors';
import { SendEmailOptions } from '@generated/graphql';
import axios, { AxiosResponse } from 'axios';

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
  body?: string,
) => {
  try {
    return api.post<SendEmailOptions, AxiosResponse>('/send', {
      to: to instanceof Array ? to : [to],
      subject,
      templateName,
      overrides,
      body,
    });
  } catch {
    throw new ServerError('Mailet kunde inte skickas');
  }
};
