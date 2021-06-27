import path from 'path';

const config = {
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  HOST: process.env.HOST ?? '0.0.0.0',
  FILES: {
    ENDPOINT: process.env.FILES_ENDPOINT ?? '/files',
    ROOT: process.env.FILE_ROOT ?? `${path.dirname(__dirname)}/public`,
  },
  EBREV: {
    URL: process.env.EBREV ?? 'localhost:8081',
    API_TOKEN: process.env.EBREV_API_TOKEN ?? '',
  },
};

export default config;
