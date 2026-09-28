import config from '@/config';
import { ServerError } from '@/errors/request.errors';
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

export type EmailAttachment = {
  filename: string;
  contentType: string;
  /** Base64 encoded file content */
  content: string;
};

export const sendEmail = async (
  to: string[] | string,
  subject: string,
  templateName: string,
  overrides: Record<string, string | string[]>,
  body?: string,
  attachments?: EmailAttachment[],
) => {
  try {
    return await api.post<SendEmailOptions, AxiosResponse>('/send', {
      to: to instanceof Array ? to : [to],
      subject,
      templateName,
      overrides,
      body,
      ...(attachments?.length ? { attachments } : {}),
    });
  } catch {
    throw new ServerError('Mailet kunde inte skickas');
  }
};
