import { readFile } from 'fs';
import { join } from 'path';

let port: string | undefined;

readFile(join(__dirname, '../.env'), 'utf8', (err, data) => {
  if (err) {
    throw new Error(err.toString());
  } else {
    const match = RegExp('(?<=PORT=)(d+)').exec(data);
    if (match) {
      [port] = match;
    }
  }
});

// Vi antar att en test-dev-server kör på localhost
port = port ?? (() => { throw new Error('Port for test dev server not defined'); })();
export const API_URL = `http://localhost:${port}`;