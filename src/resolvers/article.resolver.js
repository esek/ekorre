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
// Använt av userLoader
// userLoader är ett sätt att cacha User, då dessa
// används på flera olika ställen i API:n. Jag har utgått
// från detta projekt: https://github.com/benawad/graphql-n-plus-one-example
var article_api_1 = require("../api/article.api");
var dataloaders_1 = require("../dataloaders");
var article_reducer_1 = require("../reducers/article.reducer");
var articleApi = new article_api_1.ArticleAPI();
var articleResolver = {
    Article: {
        // Load creator & lastUpdateBy using dataloader for performace reasons
        creator: dataloaders_1.useDataLoader(function (model, ctx) { return ({
            key: model.creator.username,
            dataLoader: ctx.userDataLoader
        }); }),
        lastUpdatedBy: dataloaders_1.useDataLoader(function (model, ctx) { return ({
            key: model.lastUpdatedBy.username,
            dataLoader: ctx.userDataLoader
        }); }),
        lastUpdatedAt: function (model) { return new Date(model.lastUpdatedAt); },
        createdAt: function (model) { return new Date(model.createdAt); }
    },
    Query: {
        newsentries: function (_, _a) {
            var creator = _a.creator, after = _a.after, before = _a.before, markdown = _a.markdown;
            return __awaiter(void 0, void 0, void 0, function () {
                var safeMarkdown, articleResponse, apiResponse, beforeDate, afterDate, apiResponse;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            safeMarkdown = markdown !== null && markdown !== void 0 ? markdown : false;
                            if (!(!creator && !after && !before)) return [3 /*break*/, 3];
                            return [4 /*yield*/, articleApi.getAllNewsArticles()];
                        case 1:
                            apiResponse = _b.sent();
                            if (apiResponse === null)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, article_reducer_1.articleReducer(apiResponse, safeMarkdown)];
                        case 2:
                            articleResponse = _b.sent();
                            return [3 /*break*/, 6];
                        case 3:
                            beforeDate = new Date(before !== null && before !== void 0 ? before : Number.MAX_VALUE);
                            afterDate = new Date(after !== null && after !== void 0 ? after : Number.MIN_VALUE);
                            return [4 /*yield*/, articleApi.getNewsArticlesFromInterval(afterDate, beforeDate, creator !== null && creator !== void 0 ? creator : undefined)];
                        case 4:
                            apiResponse = _b.sent();
                            return [4 /*yield*/, article_reducer_1.articleReducer(apiResponse, safeMarkdown)];
                        case 5:
                            articleResponse = _b.sent();
                            _b.label = 6;
                        case 6: return [2 /*return*/, articleResponse];
                    }
                });
            });
        },
        latestnews: function (_, _a) {
            var limit = _a.limit, markdown = _a.markdown;
            return __awaiter(void 0, void 0, void 0, function () {
                var safeMarkdown, articleResponse, apiResponse, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            safeMarkdown = markdown !== null && markdown !== void 0 ? markdown : false;
                            if (!limit) return [3 /*break*/, 3];
                            return [4 /*yield*/, articleApi.getLatestNews(limit)];
                        case 1:
                            apiResponse = _c.sent();
                            if (apiResponse === null)
                                return [2 /*return*/, []];
                            return [4 /*yield*/, article_reducer_1.articleReducer(apiResponse, safeMarkdown)];
                        case 2:
                            articleResponse = _c.sent();
                            return [3 /*break*/, 6];
                        case 3:
                            _b = article_reducer_1.articleReducer;
                            return [4 /*yield*/, articleApi.getAllNewsArticles()];
                        case 4: return [4 /*yield*/, _b.apply(void 0, [_c.sent(), safeMarkdown])];
                        case 5:
                            articleResponse = _c.sent();
                            _c.label = 6;
                        case 6:
                            // If we get no articles, we should just return null directly.
                            if (articleResponse.length === 0) {
                                return [2 /*return*/, []];
                            }
                            // Vi vill returnera en tom array, inte null
                            return [2 /*return*/, articleResponse];
                    }
                });
            });
        },
        article: function (_, _a) {
            var id = _a.id, slug = _a.slug, markdown = _a.markdown;
            return __awaiter(void 0, void 0, void 0, function () {
                var safeMarkdown, apiResponse, articleResponse;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            safeMarkdown = markdown !== null && markdown !== void 0 ? markdown : false;
                            return [4 /*yield*/, articleApi.getArticle({ id: id, slug: slug })];
                        case 1:
                            apiResponse = _b.sent();
                            // Om API::n returnerar null finns inte artikeln; returnera null
                            if (apiResponse == null) {
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, article_reducer_1.articleReducer(apiResponse, safeMarkdown)];
                        case 2:
                            articleResponse = _b.sent();
                            return [2 /*return*/, articleResponse];
                    }
                });
            });
        },
        articles: function (_, _a) { return __awaiter(void 0, void 0, void 0, function () {
            var creator, lastUpdateBy, markdown, reduced, safeMarkdown, articleResponse, params, _b, apiResponse;
            var parameters = __rest(_a, []);
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        creator = parameters.creator, lastUpdateBy = parameters.lastUpdateBy, markdown = parameters.markdown, reduced = __rest(parameters, ["creator", "lastUpdateBy", "markdown"]);
                        safeMarkdown = markdown !== null && markdown !== void 0 ? markdown : false;
                        params = __assign(__assign({}, reduced), { refcreator: creator, reflastupdateby: lastUpdateBy });
                        if (!(Object.values(params).filter(function (v) { return v; }).length === 0)) return [3 /*break*/, 3];
                        _b = article_reducer_1.articleReducer;
                        return [4 /*yield*/, articleApi.getAllArticles()];
                    case 1: return [4 /*yield*/, _b.apply(void 0, [_c.sent(), safeMarkdown])];
                    case 2:
                        // We have no entered paramters
                        articleResponse = _c.sent();
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, articleApi.getArticles(params)];
                    case 4:
                        apiResponse = _c.sent();
                        if (apiResponse === null)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, article_reducer_1.articleReducer(apiResponse, safeMarkdown)];
                    case 5:
                        articleResponse = _c.sent();
                        _c.label = 6;
                    case 6:
                        // If we get no articles, we should just return null directly.
                        if (articleResponse.length === 0) {
                            return [2 /*return*/, []];
                        }
                        // Return raw data here, article-resolver will handle mapping of creator and lastupdatedby
                        return [2 /*return*/, articleResponse];
                }
            });
        }); }
    },
    Mutation: {
        addArticle: function (_, _a) {
            var entry = _a.entry;
            return __awaiter(void 0, void 0, void 0, function () {
                var apiResponse, refcreator, reflastupdateby, reduced, a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, articleApi.newArticle(entry)];
                        case 1:
                            apiResponse = _b.sent();
                            refcreator = apiResponse.refcreator, reflastupdateby = apiResponse.reflastupdateby, reduced = __rest(apiResponse, ["refcreator", "reflastupdateby"]);
                            a = __assign(__assign({}, reduced), { creator: {
                                    username: refcreator
                                }, lastUpdatedBy: {
                                    username: reflastupdateby
                                } });
                            return [2 /*return*/, a];
                    }
                });
            });
        },
        modifyArticle: function (_, _a) {
            var articleId = _a.articleId, entry = _a.entry;
            return articleApi.modifyArticle(articleId, entry);
        }
    }
};
/**
 * Maps an `DatabaseArticle` i.e. a partial of `Article` to an ArticleResponse object
 * @param partial DatabaseArticle to be mapped
 * @returns ArticleResponse object with references to `creator` and
 * `lastUpdatedBy`
 */
exports["default"] = articleResolver;
