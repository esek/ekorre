import { readFileSync } from 'fs';
import { join } from 'path';

let port: string | undefined;

const config = readFileSync(join(__dirname, '../.env'), 'utf8');

((data) => {
  const match = /(?<=PORT=)(\d+)/g.exec(data);
  if (match) {
    [port] = match;
  }
})(config);

// Vi antar att en test-dev-server kör på localhost
port = port ?? (() => { throw new Error('Port for test dev server not defined'); })();
export const API_URL = `http://localhost:${port}`;