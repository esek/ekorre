"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
exports.__esModule = true;
var path_1 = require("path");
/**
 * Config for file-handling
 * @param {string} ENDPOINT - The endpoint in Ekorre to expose with files (ex. https://api.esek.se/{endpoint})
 * @param {string} ROOT - The root folder to save files in
 */
var FILES = {
    ENDPOINT: (_a = process.env.FILES_ENDPOINT) !== null && _a !== void 0 ? _a : '/files',
    ROOT: (_b = process.env.FILE_ROOT) !== null && _b !== void 0 ? _b : path_1["default"].dirname(__dirname) + "/public"
};
/**
 * Config for Ebrev - our emailing service
 * @param {string} URL - The base URL for Ebrevs API
 * @param {string} API_TOKEN - The API token set as an env-variable in Ebrev
 */
var EBREV = {
    URL: (_c = process.env.EBREV) !== null && _c !== void 0 ? _c : 'https://localhost:8081',
    API_TOKEN: (_d = process.env.EBREV_API_TOKEN) !== null && _d !== void 0 ? _d : ''
};
/**
 * Cors options
 * @param {string} ALLOWED_ORIGINS - Commaseparated list of origins that are allowed to make requests
 */
var CORS = {
    ALLOWED_ORIGINS: __spreadArrays([
        'https://localhost',
        'http://localhost:3000'
    ], ((_f = (_e = process.env.ALLOWED_ORIGINS) === null || _e === void 0 ? void 0 : _e.split(',')) !== null && _f !== void 0 ? _f : []))
};
/** LU Options
 * @param {string} CAS - The base URL for LU CAS
 */
var LU = {
    CAS: (_g = process.env.LU_CAS) !== null && _g !== void 0 ? _g : 'https://idpv4.lu.se'
};
var config = {
    PORT: parseInt((_h = process.env.PORT) !== null && _h !== void 0 ? _h : '5000', 10),
    HOST: (_j = process.env.HOST) !== null && _j !== void 0 ? _j : '0.0.0.0',
    FILES: FILES,
    EBREV: EBREV,
    CORS: CORS,
    LU: LU
};
exports["default"] = config;
