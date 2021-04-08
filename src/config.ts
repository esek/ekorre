import path from 'path';

const config = {
  PORT: parseInt(process.env.PORT ?? '5000'),
  HOST: process.env.HOST ?? '0.0.0.0',
  FILES: {
    ENDPOINT: process.env.FILES_ENDPOINT ?? '/files',
    ROOT: process.env.FILE_ROOT ?? path.dirname(__dirname) + '/public',
  },
};

export default config;
