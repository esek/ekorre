"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
exports.UserAPI = void 0;
/* eslint-disable class-methods-use-this */
var crypto_1 = require("crypto");
var RequestErrors_1 = require("../errors/RequestErrors");
var logger_1 = require("../logger");
var validation_service_1 = require("../services/validation.service");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
var logger = logger_1.Logger.getLogger('UserAPI');
/**
 * Det är användar api:n. Alla operationer bör göras
 * med hjälp av denna klass för den ser till att
 * allt blir rätt.
 */
var UserAPI = /** @class */ (function () {
    function UserAPI() {
    }
    /**
     * Verifierar om det givna lösenordet är rätt.
     * @param input lösenordet
     * @param hash den lagrade hashen
     * @param salt den lagrade salten
     */
    UserAPI.prototype.verifyUser = function (input, hash, salt) {
        var equal = hash === this.hashPassword(input, salt);
        return equal;
    };
    /**
     * Hasha ett lösenord med den givna salten.
     * @param password lösenordet
     * @param salt den slumpmässigt generade salten
     */
    UserAPI.prototype.hashPassword = function (password, salt) {
        var hash = crypto_1["default"].pbkdf2Sync(password, Buffer.from(salt, 'base64'), 1000, 64, 'sha512');
        var hashstr = hash.toString('base64');
        return hashstr;
    };
    /**
     * Returnerar alla lagarade användare.
     */
    UserAPI.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE).select('*')];
                    case 1:
                        u = _a.sent();
                        return [2 /*return*/, u];
                }
            });
        });
    };
    /**
     * Hämta en användare.
     * @param username det unika användarnamnet
     */
    UserAPI.prototype.getSingleUser = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE).where({ username: username }).first()];
                    case 1:
                        u = _a.sent();
                        if (u == null) {
                            throw new RequestErrors_1.NotFoundError('Användaren kunde inte hittas');
                        }
                        return [2 /*return*/, u];
                }
            });
        });
    };
    /**
     * Hämta flera användare.
     * @param usernames användarnamnen
     */
    UserAPI.prototype.getMultipleUsers = function (usernames) {
        return __awaiter(this, void 0, void 0, function () {
            var u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE).whereIn('username', usernames)];
                    case 1:
                        u = _a.sent();
                        validation_service_1.validateNonEmptyArray(u, 'Inga användare hittades');
                        return [2 /*return*/, u];
                }
            });
        });
    };
    /**
     * Kontrollera ifall inloggningen är korrekt och returnera användaren.
     * @param username användarnamnet
     * @param password lösenordet i plaintext
     */
    UserAPI.prototype.loginUser = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE)
                            .select('*')
                            .where({
                            username: username
                        })
                            .first()];
                    case 1:
                        u = _a.sent();
                        if (u == null) {
                            throw new RequestErrors_1.NotFoundError('Användaren finns inte');
                        }
                        if (!this.verifyUser(password, u.passwordHash, u.passwordSalt)) {
                            throw new RequestErrors_1.UnauthenticatedError('Inloggningen misslyckades');
                        }
                        return [2 /*return*/, u];
                }
            });
        });
    };
    /**
     * Ändra lösenord för en användare
     * @param username användarnamnet
     * @param oldPassword det gamla lösenordet i plaintext
     * @param newPassword det nya lösenordet i plaintext
     */
    UserAPI.prototype.changePassword = function (username, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var query, u, logStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = knex_1["default"](constants_1.USER_TABLE).select('*').where({
                            username: username
                        });
                        return [4 /*yield*/, query.first()];
                    case 1:
                        u = _a.sent();
                        if (u == null) {
                            throw new RequestErrors_1.NotFoundError('Användaren finns inte');
                        }
                        if (!this.verifyUser(oldPassword, u.passwordHash, u.passwordSalt)) {
                            throw new RequestErrors_1.UnauthenticatedError('Lösenordet stämmer ej översens med det som redan är sparat');
                        }
                        return [4 /*yield*/, query.update(this.generateSaltAndHash(newPassword))];
                    case 2:
                        _a.sent();
                        logStr = "Changed password for user " + username;
                        logger.info(logStr);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Skapa en ny anvädare. TODO: FIX, ska inte returnera User typ...
     * @param input den nya användarinformationen
     */
    UserAPI.prototype.createUser = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var isFuncUser, password, inputReduced, _a, passwordSalt, passwordHash, _b, username, email, prefix, user, logStr;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        isFuncUser = !!input.isFuncUser;
                        password = input.password, inputReduced = __rest(input, ["password"]);
                        if (password === '') {
                            throw new RequestErrors_1.BadRequestError('Ogiltigt lösenord');
                        }
                        _a = this.generateSaltAndHash(password), passwordSalt = _a.passwordSalt, passwordHash = _a.passwordHash;
                        _b = input.username, username = _b === void 0 ? '' : _b;
                        // Inga tomma användarnamn och får inte starta med funcUser om de inte är det
                        if (username === '' || (username.startsWith('funcUser_') && !isFuncUser)) {
                            throw new RequestErrors_1.BadRequestError('Ogiltigt användarnamn');
                        }
                        email = input.email;
                        if (!email || email === '') {
                            email = username + "@student.lu.se";
                        }
                        if (isFuncUser) {
                            prefix = 'funcUser_';
                            username = username.startsWith(prefix) ? username : "" + prefix + username;
                            email = 'no-reply@esek.se';
                        }
                        user = __assign(__assign({}, inputReduced), { username: username,
                            email: email,
                            passwordHash: passwordHash,
                            passwordSalt: passwordSalt,
                            isFuncUser: isFuncUser });
                        return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE)
                                .insert(user)["catch"](function () {
                                // If failed, it's 99% because the username exists
                                throw new RequestErrors_1.BadRequestError('Användarnamnet finns redan');
                            })];
                    case 1:
                        _c.sent();
                        logStr = "Created user " + logger_1.Logger.pretty(inputReduced);
                        logger.info(logStr);
                        return [2 /*return*/, user];
                }
            });
        });
    };
    UserAPI.prototype.updateUser = function (username, partial) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (partial.username) {
                            throw new RequestErrors_1.BadRequestError('Användarnamn kan inte uppdateras');
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE).where('username', username).update(partial)];
                    case 1:
                        res = _a.sent();
                        if (res <= 0) {
                            throw new RequestErrors_1.BadRequestError('Något gick fel');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UserAPI.prototype.requestPasswordReset = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var table, token, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = knex_1["default"](constants_1.PASSWORD_RESET_TABLE);
                        token = crypto_1["default"].randomBytes(24).toString('hex');
                        return [4 /*yield*/, table.insert({
                                time: Date.now(),
                                token: token,
                                username: username
                            })];
                    case 1:
                        res = _a.sent();
                        // If no row was inserted into the DB
                        if (res.length < 1) {
                            throw new RequestErrors_1.ServerError('Något gick fel');
                        }
                        // Remove the other rows for this user
                        return [4 /*yield*/, table.where('username', username).whereNot('token', token)["delete"]()];
                    case 2:
                        // Remove the other rows for this user
                        _a.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    UserAPI.prototype.validateResetPasswordToken = function (username, token) {
        return __awaiter(this, void 0, void 0, function () {
            var row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.PASSWORD_RESET_TABLE)
                            .where('username', username)
                            .where('token', token)
                            .first()];
                    case 1:
                        row = _a.sent();
                        return [2 /*return*/, this.validateResetPasswordRow(row)];
                }
            });
        });
    };
    UserAPI.prototype.resetPassword = function (token, username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var q, dbEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        q = knex_1["default"](constants_1.PASSWORD_RESET_TABLE)
                            .where('token', token)
                            .andWhere('username', username)
                            .first();
                        return [4 /*yield*/, q];
                    case 1:
                        dbEntry = _a.sent();
                        // If no entry or token expired
                        if (!this.validateResetPasswordRow(dbEntry)) {
                            throw new RequestErrors_1.NotFoundError('Denna förfrågan finns inte eller har gått ut');
                        }
                        // Update password for user
                        return [4 /*yield*/, knex_1["default"](constants_1.USER_TABLE)
                                .where('username', username)
                                .update(this.generateSaltAndHash(password))];
                    case 2:
                        // Update password for user
                        _a.sent();
                        // Delete row in password table
                        return [4 /*yield*/, q["delete"]()];
                    case 3:
                        // Delete row in password table
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    UserAPI.prototype.validateResetPasswordRow = function (row) {
        if (!row) {
            return false;
        }
        var EXPIRE_MINUTES = 60; // 1h
        var expirationTime = Date.now() - row.time;
        return expirationTime < EXPIRE_MINUTES * 60 * 1000;
    };
    UserAPI.prototype.generateSaltAndHash = function (password) {
        var passwordSalt = crypto_1["default"].randomBytes(16).toString('base64');
        var passwordHash = this.hashPassword(password, passwordSalt);
        return { passwordSalt: passwordSalt, passwordHash: passwordHash };
    };
    return UserAPI;
}());
exports.UserAPI = UserAPI;
