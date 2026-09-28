import { app } from '@/app/app';
import http from 'http';
import request from 'supertest';

/**
 * One HTTP server per test worker, shared by every request. Passing the app to supertest
 * instead makes it start and close a server for each request, and a close racing a
 * response could leave the request hanging forever or fail with "socket hang up".
 * `unref` keeps the server from holding the worker open after the tests.
 */
const server = http.createServer(app).listen(0);
server.unref();

const testRequest = request(server);

export default testRequest;
