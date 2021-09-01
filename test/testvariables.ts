// Vi antar att en test-dev-server kör på localhost
const PORT = process.env.PORT ?? fail('Port for test dev server not defined');
export const API_URL = `http://localhost:${PORT}`;