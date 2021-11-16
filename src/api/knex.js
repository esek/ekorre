"use strict";
var _a, _b, _c;
exports.__esModule = true;
var knex_1 = require("knex");
var k;
if (process.env.DB_CLIENT === 'sqlite') {
    k = knex_1["default"]({
        client: 'sqlite',
        connection: {
            filename: (_a = process.env.DB_FILE) !== null && _a !== void 0 ? _a : ''
        }
    });
}
else {
    k = knex_1["default"]({
        client: (_b = process.env.DB_CLIENT) !== null && _b !== void 0 ? _b : 'mysql2',
        connection: {
            host: (_c = process.env.DB_HOST) !== null && _c !== void 0 ? _c : 'localhost'
        }
    });
}
var knex = k;
exports["default"] = knex;
