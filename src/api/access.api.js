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
exports.AccessAPI = void 0;
var logger_1 = require("../logger");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
var logger = logger_1.Logger.getLogger('AccessAPI');
/**
 * Det är api:n som hanterar access.
 * Access finns i två former:
 *   - Den access som en användare ärver från en post
 *   - Den access som en specifik användare får tilldelad
 * Det är viktigt att hålla koll på denna skillnaden.
 */
var AccessAPI = /** @class */ (function () {
    function AccessAPI() {
    }
    /**
     * Hämta specifik access för en användare
     * @param username användaren
     */
    AccessAPI.prototype.getIndividualAccess = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.IND_ACCESS_TABLE)
                            .where({
                            refname: username
                        })
                            .join(constants_1.ACCESS_RESOURCES_TABLE, 'refresource', 'id')];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * Hämta access för en post.
     * @param postname posten
     */
    AccessAPI.prototype.getPostAccess = function (postname) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POST_ACCESS_TABLE)
                            .where({
                            refname: postname
                        })
                            .join(constants_1.ACCESS_RESOURCES_TABLE, 'refresource', 'id')];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * En private hjälpfunktion för att sätta access.
     * @param table tabellen där access raderna finns
     * @param ref referens (användare eller post)
     * @param newaccess den nya accessen
     */
    AccessAPI.prototype.setAccess = function (table, ref, newaccess) {
        return __awaiter(this, void 0, void 0, function () {
            var inserts, status_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](table)
                            .where({
                            refname: ref
                        })["delete"]()];
                    case 1:
                        _a.sent();
                        inserts = newaccess.map(function (id) { return ({
                            refname: ref,
                            refresource: id
                        }); });
                        if (!(inserts.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, knex_1["default"](table).insert(inserts)];
                    case 2:
                        status_1 = _a.sent();
                        return [2 /*return*/, status_1[0] > 0];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Sätt access för en användare. VIKTIGT: Access är icke muterbart
     * vilket innebär att accessobjektet som matas ska innehålla allt
     * som behövs.
     * @param username användaren
     * @param newaccess den nya accessen
     */
    AccessAPI.prototype.setIndividualAccess = function (username, newaccess) {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                status = this.setAccess(constants_1.IND_ACCESS_TABLE, username, newaccess);
                logger.info("Updated access for user " + username);
                logger.debug("Updated access for user " + username + " to " + logger_1.Logger.pretty(newaccess));
                return [2 /*return*/, status];
            });
        });
    };
    /**
     * Sätt access för en post. VIKTIGT: Access är icke muterbart
     * vilket innebär att accessobjektet som matas ska innehålla allt
     * som behövs.
     * @param postname posten
     * @param newaccess den nya accessen
     */
    AccessAPI.prototype.setPostAccess = function (postname, newaccess) {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                status = this.setAccess(constants_1.POST_ACCESS_TABLE, postname, newaccess);
                logger.info("Updated access for post " + postname);
                logger.debug("Updated access for post " + postname + " to " + logger_1.Logger.pretty(newaccess));
                return [2 /*return*/, status];
            });
        });
    };
    /**
     * Hämta access för flera poster.
     * TODO: Kanske inkludera referens till post.
     * @param posts posterna
     */
    AccessAPI.prototype.getAccessForPosts = function (posts) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POST_ACCESS_TABLE)
                            .whereIn('refname', posts)
                            .join(constants_1.ACCESS_RESOURCES_TABLE, 'refresource', 'id')];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    return AccessAPI;
}());
exports.AccessAPI = AccessAPI;
