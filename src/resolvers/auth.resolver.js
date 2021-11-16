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
var user_api_1 = require("../api/user.api");
var auth_1 = require("../auth");
var reducers_1 = require("../reducers");
var user_reducer_1 = require("../reducers/user.reducer");
var cas_service_1 = require("../services/cas.service");
var api = new user_api_1.UserAPI();
/**
 * Helper to attach refresh token to the response object
 * @param {string} username The username to issue the token with
 * @param {string} cookieName Name of cookie to set
 * @param {Response} response Express response object to attach cookies to
 */
var attachCookie = function (cookieName, value, tokenType, response) {
    response.cookie(cookieName, value, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: auth_1.EXPIRE_MINUTES[tokenType] * 1000 * 60
    });
};
var authResolver = {
    Mutation: {
        login: function (_, _a, _b) {
            var username = _a.username, password = _a.password;
            var response = _b.response;
            return __awaiter(void 0, void 0, void 0, function () {
                var user, refresh, access;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, api.loginUser(username, password)];
                        case 1:
                            user = _c.sent();
                            if (!user) {
                                return [2 /*return*/, null];
                            }
                            refresh = auth_1.issueToken({ username: username }, 'refreshToken');
                            access = auth_1.issueToken({ username: username }, 'accessToken');
                            // Attach a refresh token to the response object
                            attachCookie(auth_1.COOKIES.refreshToken, refresh, 'refreshToken', response);
                            attachCookie(auth_1.COOKIES.accessToken, access, 'accessToken', response);
                            return [2 /*return*/, reducers_1.reduce(user, user_reducer_1.userReduce)];
                    }
                });
            });
        },
        logout: function (_, __, _a) {
            var response = _a.response, refreshToken = _a.refreshToken, accessToken = _a.accessToken;
            // Invalidate both access- and refreshtoken
            auth_1.invalidateTokens(accessToken, refreshToken);
            // Send back empty tokens
            attachCookie(auth_1.COOKIES.accessToken, '', 'accessToken', response);
            attachCookie(auth_1.COOKIES.refreshToken, '', 'refreshToken', response);
            return true;
        },
        casLogin: function (_, _a, _b) {
            var token = _a.token;
            var request = _b.request, response = _b.response;
            return __awaiter(void 0, void 0, void 0, function () {
                var referer, username, user, exists, refresh, hash;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            referer = request.headers.referer;
                            return [4 /*yield*/, cas_service_1.validateCasTicket(token, referer !== null && referer !== void 0 ? referer : '')];
                        case 1:
                            username = _c.sent();
                            if (!username) {
                                throw new Error();
                            }
                            return [4 /*yield*/, api.getSingleUser(username)];
                        case 2:
                            user = _c.sent();
                            exists = user != null;
                            if (exists) {
                                refresh = auth_1.issueToken({ username: username }, 'refreshToken');
                                // Attach a refresh token to the response object
                                attachCookie(auth_1.COOKIES.refreshToken, refresh, 'refreshToken', response);
                            }
                            hash = auth_1.hashWithSecret(username);
                            return [2 /*return*/, {
                                    username: username,
                                    hash: hash,
                                    exists: exists
                                }];
                    }
                });
            });
        }
    }
};
exports["default"] = authResolver;
