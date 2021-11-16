"use strict";
/* eslint-disable class-methods-use-this */
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
exports.ArticleAPI = void 0;
var graphql_generated_1 = require("../graphql.generated");
var util_1 = require("../util");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
/**
 * Det här är API:n för att hantera artiklar
 */
// TODO: Fixa vad som ska kräva auth och inte
var ArticleAPI = /** @class */ (function () {
    function ArticleAPI() {
    }
    /**
     * Hämta alla artiklar
     */
    ArticleAPI.prototype.getAllArticles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allArticles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE)];
                    case 1:
                        allArticles = _a.sent();
                        return [2 /*return*/, allArticles];
                }
            });
        });
    };
    /**
     * Hämtar alla nyhetsartiklar
     */
    ArticleAPI.prototype.getAllNewsArticles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allNewsArticles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE)
                            .where('articletype', 'news')
                            .orderBy('createdat', 'desc')];
                    case 1:
                        allNewsArticles = _a.sent();
                        return [2 /*return*/, allNewsArticles];
                }
            });
        });
    };
    ArticleAPI.prototype.getAllInformationArticles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allInformationArticles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE).where('articletype', 'information')];
                    case 1:
                        allInformationArticles = _a.sent();
                        return [2 /*return*/, allInformationArticles];
                }
            });
        });
    };
    /**
     * Hämtar alla nyhetsartiklar i ett intervall. Utelämnas
     * parametrar finns ingen begränsning.
     * @param creator
     * @param after
     * @param before
     */
    ArticleAPI.prototype.getNewsArticlesFromInterval = function (after, before, creator) {
        return __awaiter(this, void 0, void 0, function () {
            var search, newsArticleModels;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        search = {
                            articleType: graphql_generated_1.ArticleType.News
                        };
                        if (creator) {
                            search.refcreator = creator;
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE)
                                .where(search)
                                .andWhere('createdAt', '<', before)
                                .andWhere('createdAt', '>', after)];
                    case 1:
                        newsArticleModels = _a.sent();
                        return [2 /*return*/, (newsArticleModels === null || newsArticleModels === void 0 ? void 0 : newsArticleModels.length) ? newsArticleModels : []];
                }
            });
        });
    };
    /**
     * Returns the article with the specified id
     * @param id article id
     */
    ArticleAPI.prototype.getArticle = function (_a) {
        var id = _a.id, slug = _a.slug;
        return __awaiter(this, void 0, void 0, function () {
            var dbId, regex, match, article;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dbId = id;
                        if (slug) {
                            regex = RegExp(/(\d+)[^-]*$/).exec(slug);
                            if (regex === null || regex === void 0 ? void 0 : regex.length) {
                                match = regex[0];
                                dbId = match;
                            }
                        }
                        if (dbId == null) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE).where('id', dbId).first()];
                    case 1:
                        article = _b.sent();
                        return [2 /*return*/, article !== null && article !== void 0 ? article : null];
                }
            });
        });
    };
    /**
     * Returns a list of AticleModels from database WHERE params match.
     * @param params possible params are ArticleModel parts.
     */
    ArticleAPI.prototype.getArticles = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var safeParams, article;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        safeParams = util_1.stripObject(params);
                        return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE).where(safeParams)];
                    case 1:
                        article = _a.sent();
                        return [2 /*return*/, article !== null && article !== void 0 ? article : null];
                }
            });
        });
    };
    /**
     * Hämtar de senaste nyhetsartiklarna
     * @param nbr antal artiklar
     */
    ArticleAPI.prototype.getLatestNews = function (limit) {
        return __awaiter(this, void 0, void 0, function () {
            var lastestNews;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE)
                            .where('articleType', 'news')
                            .orderBy('createdat', 'desc')
                            .limit(limit)];
                    case 1:
                        lastestNews = _a.sent();
                        return [2 /*return*/, lastestNews];
                }
            });
        });
    };
    /**
     * Lägger till en ny artikel
     * @param entry artikel som ska läggas till
     */
    ArticleAPI.prototype.newArticle = function (entry) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var creator, reduced, article, res;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        creator = entry.creator, reduced = __rest(entry, ["creator"]);
                        article = __assign(__assign({}, reduced), { createdAt: util_1.toUTC(new Date()), lastUpdatedAt: util_1.toUTC(new Date()), tags: (_a = entry.tags) !== null && _a !== void 0 ? _a : [], refcreator: creator, reflastupdateby: creator });
                        return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE).insert(article)];
                    case 1:
                        res = _c.sent();
                        return [2 /*return*/, __assign(__assign({}, article), { id: (_b = res[0].toString()) !== null && _b !== void 0 ? _b : -1 })];
                }
            });
        });
    };
    /**
     * Modifierar en artikel; notera att vissa saker inte får
     * modifieras via API:n
     * @param entry Modifiering av existerande artikel
     */
    ArticleAPI.prototype.modifyArticle = function (id, entry) {
        return __awaiter(this, void 0, void 0, function () {
            var update, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update = util_1.stripObject(entry);
                        // TODO: Add lastUpdatedBy using auth
                        update.lastUpdatedAt = util_1.toUTC(new Date());
                        return [4 /*yield*/, knex_1["default"](constants_1.ARTICLE_TABLE).where('id', id).update(update)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res > 0];
                }
            });
        });
    };
    return ArticleAPI;
}());
exports.ArticleAPI = ArticleAPI;
