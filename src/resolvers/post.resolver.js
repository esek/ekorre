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
exports.__esModule = true;
var post_api_1 = require("../api/post.api");
var reducers_1 = require("../reducers");
var post_reducer_1 = require("../reducers/post.reducer");
var api = new post_api_1.PostAPI();
// TODO: Lägg till auth
var postresolver = {
    Query: {
        post: function (_, _a) {
            var name = _a.name;
            return __awaiter(void 0, void 0, void 0, function () {
                var res;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getPost(name)];
                        case 1:
                            res = _b.sent();
                            if (res != null)
                                return [2 /*return*/, post_reducer_1.postReduce(res)];
                            return [2 /*return*/, null];
                    }
                });
            });
        },
        posts: function (_, _a) {
            var utskott = _a.utskott;
            return __awaiter(void 0, void 0, void 0, function () {
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            if (!(utskott != null)) return [3 /*break*/, 2];
                            _b = reducers_1.reduce;
                            return [4 /*yield*/, api.getPostsFromUtskott(utskott)];
                        case 1: return [2 /*return*/, _b.apply(void 0, [_d.sent(), post_reducer_1.postReduce])];
                        case 2:
                            _c = reducers_1.reduce;
                            return [4 /*yield*/, api.getPosts()];
                        case 3: return [2 /*return*/, _c.apply(void 0, [_d.sent(), post_reducer_1.postReduce])];
                    }
                });
            });
        }
    },
    Mutation: {
        addPost: function (_, _a) {
            var info = _a.info;
            return api.createPost(info);
        },
        modifyPost: function (_, _a) {
            var info = _a.info;
            return api.modifyPost(info);
        },
        addUsersToPost: function (_, _a) {
            var usernames = _a.usernames, postname = _a.postname, period = _a.period;
            return api.addUsersToPost(usernames, postname, period);
        },
        removeUsersFromPost: function (_, _a) {
            var usernames = _a.usernames, postname = _a.postname;
            return api.removeUsersFromPost(usernames, postname);
        }
    },
    User: {
        posts: function (_a, _, ctx) {
            var username = _a.username;
            return __awaiter(void 0, void 0, void 0, function () {
                var posts, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _b = reducers_1.reduce;
                            return [4 /*yield*/, api.getPostsForUser(username)];
                        case 1:
                            posts = _b.apply(void 0, [_c.sent(), post_reducer_1.postReduce]);
                            posts.forEach(function (p) {
                                // Vi vill inte ladda in dessa fler gånger
                                // i samma request, så vi sparar dem i vår dataloader
                                ctx.postDataLoader.prime(p.postname, p);
                            });
                            return [2 /*return*/, posts];
                    }
                });
            });
        },
        userPostHistory: function (_a, _, ctx) {
            var username = _a.username;
            return __awaiter(void 0, void 0, void 0, function () {
                var entries, a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getHistoryEntriesForUser(username)];
                        case 1:
                            entries = _b.sent();
                            a = Promise.all(entries.map(function (e) { return __awaiter(void 0, void 0, void 0, function () {
                                var post;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, ctx.postDataLoader.load(e.refpost)];
                                        case 1:
                                            post = _a.sent();
                                            return [2 /*return*/, __assign(__assign({}, e), { post: post })];
                                    }
                                });
                            }); }));
                            return [2 /*return*/, a];
                    }
                });
            });
        }
    },
    Post: {
        history: function (_a, _, ctx) {
            var postname = _a.postname;
            return __awaiter(void 0, void 0, void 0, function () {
                var entries, a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getHistoryEntries(postname)];
                        case 1:
                            entries = _b.sent();
                            a = Promise.all(entries.map(function (e) { return __awaiter(void 0, void 0, void 0, function () {
                                var holder;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, ctx.userDataLoader.load(e.refuser)];
                                        case 1:
                                            holder = _a.sent();
                                            return [2 /*return*/, __assign(__assign({}, e), { holder: holder, postname: postname })];
                                    }
                                });
                            }); }));
                            return [2 /*return*/, a];
                    }
                });
            });
        }
    }
};
exports["default"] = postresolver;
