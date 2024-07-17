import config from '@/config';
import { ServerError } from '@/errors/request.errors';
import { QueryLatexifyArgs } from '@generated/graphql';
import axios, { AxiosResponse } from 'axios';

const {
  LATEXIFY: { URL },
} = config;

const api = axios.create({
  baseURL: URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const latexify = async (text: string) => {
  try {
    const res = await api.post<QueryLatexifyArgs, AxiosResponse>('/latexify', {
      text: text,
    });
    if (res.status == 200) {
      return res.data as string;
    } else {
      throw new ServerError(`${res.status}: ${res.statusText}`);
    }
  } catch {
    throw new ServerError('Texten kunde inte konverteras till LaTeX');
  }
};
