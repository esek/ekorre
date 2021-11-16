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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.PostAPI = void 0;
/* eslint-disable class-methods-use-this */
var RequestErrors_1 = require("../errors/RequestErrors");
var graphql_generated_1 = require("../graphql.generated");
var logger_1 = require("../logger");
var validation_service_1 = require("../services/validation.service");
var util_1 = require("../util");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
var logger = logger_1.Logger.getLogger('PostAPI');
/**
 * Kontrollerar att posttyp och antalet platser som
 * definierades är kompatibla. Om de är det, eller ett
 * defaultvärde kan sättas, returneras detta. Annars
 * returneras null
 *
 * @param postType
 * @param spots
 */
var checkPostTypeAndSpots = function (postType, spots) {
    var s;
    if (postType === graphql_generated_1.PostType.U) {
        s = 1;
    }
    else if (postType === graphql_generated_1.PostType.Ea) {
        s = -1;
    }
    else if (postType === graphql_generated_1.PostType.N || postType === graphql_generated_1.PostType.ExactN) {
        // Om posten ska ha n möjliga platser måste spots ha
        // definierats
        if (spots !== undefined && spots !== null && spots >= 0) {
            s = spots;
        }
        else {
            s = null;
        }
    }
    else {
        s = null;
    }
    return s;
};
/**
 * Det här är apin för att hantera poster.
 */
var PostAPI = /** @class */ (function () {
    function PostAPI() {
    }
    /**
     * Hämta alla poster.
     */
    PostAPI.prototype.getPosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE)];
                    case 1:
                        posts = _a.sent();
                        validation_service_1.validateNonEmptyArray(posts, 'Inga poster hittades');
                        return [2 /*return*/, posts];
                }
            });
        });
    };
    PostAPI.prototype.getPost = function (postname) {
        return __awaiter(this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE).where('postname', postname).first()];
                    case 1:
                        post = _a.sent();
                        if (!post) {
                            throw new RequestErrors_1.NotFoundError('Posten kunde inte hittas');
                        }
                        return [2 /*return*/, post];
                }
            });
        });
    };
    PostAPI.prototype.getMultiplePosts = function (postnames) {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE).whereIn('postname', postnames)];
                    case 1:
                        posts = _a.sent();
                        validation_service_1.validateNonEmptyArray(posts, 'Inga poster hittades');
                        return [2 /*return*/, posts];
                }
            });
        });
    };
    /**
     * Hämta alla poster som en användare sitter på.
     * @param username användaren
     */
    PostAPI.prototype.getPostsForUser = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var refposts, posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_HISTORY_TABLE)
                            .where({
                            refuser: username,
                            end: null
                        })
                            .select('refpost')];
                    case 1:
                        refposts = _a.sent();
                        return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE).whereIn('postname', refposts.map(function (e) { return e.refpost; }))];
                    case 2:
                        posts = _a.sent();
                        validation_service_1.validateNonEmptyArray(posts, 'Inga poster hittades');
                        return [2 /*return*/, posts];
                }
            });
        });
    };
    /**
     * Hämta alla poster som tillhör ett utskott.
     * @param utskott utskottet
     */
    PostAPI.prototype.getPostsFromUtskott = function (utskott) {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE).where({
                            utskott: utskott
                        })];
                    case 1:
                        posts = _a.sent();
                        validation_service_1.validateNonEmptyArray(posts, 'Inga poster hittades');
                        return [2 /*return*/, posts];
                }
            });
        });
    };
    PostAPI.prototype.addUsersToPost = function (usernames, postname, period) {
        return __awaiter(this, void 0, void 0, function () {
            var uniqueUsernames, alreadyAdded, usernamesToUse, alreadyAddedString_1, insert, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uniqueUsernames = __spreadArrays(new Set(usernames));
                        return [4 /*yield*/, knex_1["default"](constants_1.POSTS_HISTORY_TABLE)
                                .select('refuser')
                                .where({
                                refpost: postname
                            })
                                .whereIn('refuser', uniqueUsernames)];
                    case 1:
                        alreadyAdded = _a.sent();
                        if (alreadyAdded.length > 0) {
                            alreadyAddedString_1 = alreadyAdded.map(function (e) { return e === null || e === void 0 ? void 0 : e.refuser; });
                            usernamesToUse = uniqueUsernames.filter(function (e) { return !alreadyAddedString_1.includes(e); });
                        }
                        else {
                            usernamesToUse = uniqueUsernames;
                        }
                        insert = usernamesToUse.map(function (e) { return ({
                            refuser: e,
                            refpost: postname,
                            start: new Date(),
                            end: null,
                            period: period
                        }); });
                        if (!insert.length) {
                            throw new RequestErrors_1.ServerError('Användaren kunde inte läggas till');
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.POSTS_HISTORY_TABLE).insert(insert)];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, res[0] > 0];
                }
            });
        });
    };
    PostAPI.prototype.createPost = function (_a) {
        var name = _a.name, utskott = _a.utskott, postType = _a.postType, spots = _a.spots, description = _a.description, interviewRequired = _a.interviewRequired;
        return __awaiter(this, void 0, void 0, function () {
            var s, doubles, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        s = checkPostTypeAndSpots(postType, spots);
                        if (s === null) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.getPost(name)["catch"](function () { return false; })];
                    case 1:
                        doubles = _b.sent();
                        if (doubles) {
                            throw new RequestErrors_1.BadRequestError('Denna posten finns redan');
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE).insert({
                                postname: name,
                                utskott: utskott,
                                postType: postType,
                                spots: s,
                                description: description !== null && description !== void 0 ? description : 'Postbeskrivning saknas :/',
                                interviewRequired: interviewRequired !== null && interviewRequired !== void 0 ? interviewRequired : false,
                                active: true
                            })];
                    case 2:
                        res = _b.sent();
                        if (res[0] > 0) {
                            // If post was added successfully.
                            logger.debug("Created a post named " + name);
                            return [2 /*return*/, true];
                        }
                        throw new RequestErrors_1.ServerError('Posten kunde inte skapas');
                }
            });
        });
    };
    /**
     * Modifierar en post
     * @param entry Modifiering av existerande artikel
     */
    PostAPI.prototype.modifyPost = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, name, update, s, dbPostType, dbSpots, res_1, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = util_1.stripObject(entry), name = _a.name, update = __rest(_a, ["name"]);
                        s = null;
                        if (!(entry.spots !== undefined)) return [3 /*break*/, 4];
                        if (!(entry.postType !== undefined)) return [3 /*break*/, 1];
                        s = checkPostTypeAndSpots(entry.postType, entry.spots);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE)
                            .select('postType')
                            .where('postname', name)
                            .returning('posttype')
                            .first()];
                    case 2:
                        dbPostType = _b.sent();
                        if (dbPostType === undefined) {
                            // Should not happen
                            return [2 /*return*/, false];
                        }
                        s = checkPostTypeAndSpots(dbPostType, entry.spots);
                        _b.label = 3;
                    case 3: return [3 /*break*/, 8];
                    case 4:
                        if (!(entry.postType !== undefined)) return [3 /*break*/, 6];
                        return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE)
                                .select('postType')
                                .where('postname', name)
                                .returning('number')
                                .first()];
                    case 5:
                        dbSpots = _b.sent();
                        s = checkPostTypeAndSpots(entry.postType, dbSpots);
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE).where('postname', name).update(update)];
                    case 7:
                        res_1 = _b.sent();
                        return [2 /*return*/, res_1 > 0];
                    case 8:
                        // Vi ville uppdatera, men vi hade inte en godkännd kombination
                        if (s === null) {
                            throw new RequestErrors_1.BadRequestError('Ogiltig kombination av post och antal platser');
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.POSTS_TABLE)
                                .where('postname', name)
                                .update(__assign(__assign({}, update), { spots: s }))];
                    case 9:
                        res = _b.sent();
                        return [2 /*return*/, res > 0];
                }
            });
        });
    };
    PostAPI.prototype.removeUsersFromPost = function (users, postname) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_HISTORY_TABLE)
                            .where({
                            refpost: postname
                        })
                            .whereIn('refuser', users)["delete"]()];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res > 0];
                }
            });
        });
    };
    PostAPI.prototype.getHistoryEntries = function (refpost) {
        return __awaiter(this, void 0, void 0, function () {
            var entries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_HISTORY_TABLE).where({
                            refpost: refpost
                        })];
                    case 1:
                        entries = _a.sent();
                        validation_service_1.validateNonEmptyArray(entries, 'Ingen posthistorik hittades');
                        return [2 /*return*/, entries];
                }
            });
        });
    };
    PostAPI.prototype.getHistoryEntriesForUser = function (refuser) {
        return __awaiter(this, void 0, void 0, function () {
            var entries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.POSTS_HISTORY_TABLE).where({
                            refuser: refuser
                        })];
                    case 1:
                        entries = _a.sent();
                        return [2 /*return*/, entries];
                }
            });
        });
    };
    return PostAPI;
}());
exports.PostAPI = PostAPI;
