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
var email_service_1 = require("../services/email.service");
var util_1 = require("../util");
var api = new user_api_1.UserAPI();
var userResolver = {
    Query: {
        me: function (_, __, _a) {
            var accessToken = _a.accessToken, refreshToken = _a.refreshToken, userDataLoader = _a.userDataLoader;
            return __awaiter(void 0, void 0, void 0, function () {
                var access, refresh, accessExpiry, refreshExpiry, user, reduced;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            access = auth_1.verifyToken(accessToken, 'accessToken');
                            refresh = auth_1.verifyToken(refreshToken, 'refreshToken');
                            accessExpiry = access.exp * 1000;
                            refreshExpiry = refresh.exp * 1000;
                            return [4 /*yield*/, api.getSingleUser(access.username)];
                        case 1:
                            user = _b.sent();
                            if (!user) {
                                return [2 /*return*/, {
                                        accessExpiry: accessExpiry,
                                        refreshExpiry: refreshExpiry
                                    }];
                            }
                            reduced = reducers_1.reduce(user, user_reducer_1.userReduce);
                            return [2 /*return*/, {
                                    user: reduced,
                                    accessExpiry: access.exp * 1000,
                                    refreshExpiry: refresh.exp * 1000
                                }];
                    }
                });
            });
        },
        user: function (_, _a) {
            var username = _a.username;
            return __awaiter(void 0, void 0, void 0, function () {
                var u;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getSingleUser(username)];
                        case 1:
                            u = _b.sent();
                            return [2 /*return*/, reducers_1.reduce(u, user_reducer_1.userReduce)];
                    }
                });
            });
        }
    },
    Mutation: {
        updateUser: function (_, _a, ctx) {
            var input = _a.input;
            return __awaiter(void 0, void 0, void 0, function () {
                var user;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            user = ctx.getUser();
                            return [4 /*yield*/, api.updateUser(user.username, util_1.stripObject(input))];
                        case 1:
                            _b.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        },
        createUser: function (_, _a) {
            var input = _a.input;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.createUser(input)];
                        case 1:
                            _b.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        },
        requestPasswordReset: function (_, _a) {
            var username = _a.username;
            return __awaiter(void 0, void 0, void 0, function () {
                var user, token;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getSingleUser(username)];
                        case 1:
                            user = _b.sent();
                            if (!user) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, api.requestPasswordReset(user.username)];
                        case 2:
                            token = _b.sent();
                            if (!token) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, email_service_1.sendEmail(user.email, 'Glömt lösenord?', 'forgot-password', {
                                    firstName: user.firstName,
                                    resetLink: "https://esek.se/account/forgot-password?token=" + token + "&username=" + user.username,
                                    contactEmail: 'macapar@esek.se',
                                    userEmail: user.email
                                })];
                        case 3:
                            _b.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        },
        validatePasswordResetToken: function (_, _a) {
            var username = _a.username, token = _a.token;
            return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_b) {
                return [2 /*return*/, api.validateResetPasswordToken(username, token)];
            }); });
        },
        resetPassword: function (_, _a) {
            var token = _a.token, username = _a.username, password = _a.password;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.resetPassword(token, username, password)];
                        case 1:
                            _b.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        },
        casCreateUser: function (_, _a) {
            var input = _a.input, hash = _a.hash;
            return __awaiter(void 0, void 0, void 0, function () {
                var created;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            // Check that hash is ok
                            if (auth_1.hashWithSecret(input.username) !== hash) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, api.createUser(input)];
                        case 1:
                            created = _b.sent();
                            return [2 /*return*/, created != null];
                    }
                });
            });
        }
    }
};
exports["default"] = userResolver;
