"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.verifyFileReadAccess = exports.verifyAuthenticated = exports.setUser = void 0;
var auth_1 = require("../../auth");
var RequestErrors_1 = require("../../errors/RequestErrors");
var graphql_generated_1 = require("../../graphql.generated");
var logger_1 = require("../../logger");
var logger = logger_1.Logger.getLogger('RestAuth');
exports.setUser = function (req, res, next) {
    var _a, _b, _c, _d, _e;
    var token = (_e = (_b = (_a = req.cookies[auth_1.COOKIES.accessToken]) !== null && _a !== void 0 ? _a : req.headers.authorization) !== null && _b !== void 0 ? _b : (_d = (_c = req.query) === null || _c === void 0 ? void 0 : _c.token) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : '';
    // Remove `Bearer ` from token string
    if (token.includes('Bearer')) {
        token = token.replace('Bearer ', '');
    }
    res.locals.getUser = function () { return auth_1.verifyToken(token, 'accessToken'); };
    next();
};
/**
 * Express middleware to verify that a user is authenticated
 * also sets res.locals.user to the authenticated user on success
 */
exports.verifyAuthenticated = function (_req, res, next) {
    try {
        var user = res.locals.getUser();
        res.locals.user = user;
        if (!user) {
            throw new RequestErrors_1.UnauthenticatedError('Inlogging krävs');
        }
    }
    catch (_a) {
        res.status(401).send('Din token kunde inte valideras');
        return;
    }
    next();
};
/**
 * Express middleware to ensure that a user has the correct read access for a specific file
 * @param api Files API
 */
exports.verifyFileReadAccess = function (api) { return function (req, res, next) {
    // IIFE because .use does not expect a promise
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var url, id, file, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = req.url;
                    id = url.substr(url.lastIndexOf('/') + 1).split('?')[0];
                    return [4 /*yield*/, api.getFileData(id)];
                case 1:
                    file = _a.sent();
                    if (!file) {
                        logger.debug("Could not find file '" + id + "' in DB");
                        res.status(404).send();
                        return [2 /*return*/];
                    }
                    // If public file, just go to content
                    if (file.accessType === graphql_generated_1.AccessType.Public) {
                        next();
                        return [2 /*return*/];
                    }
                    try {
                        user = res.locals.getUser();
                        if (file.accessType === graphql_generated_1.AccessType.Admin && user) {
                            // TODO: Verify that user is admin
                            next();
                            return [2 /*return*/];
                        }
                        if (file.accessType === graphql_generated_1.AccessType.Authenticated && user) {
                            next();
                            return [2 /*return*/];
                        }
                        // If none of the above verifications succeeded, user is not authorized
                        throw new RequestErrors_1.UnauthenticatedError('Du har inte access');
                    }
                    catch (error) {
                        // Return 403 if no token was provided or it verification failed
                        logger.error("Error in verification middleware - " + error);
                        res.status(403).send('Access Denied');
                    }
                    return [2 /*return*/];
            }
        });
    }); })();
}; };
