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
var meeting_api_1 = require("../api/meeting.api");
var reducers_1 = require("../reducers");
var meeting_reducer_1 = require("../reducers/meeting.reducer");
var api = new meeting_api_1.MeetingAPI();
// TODO: Säkra upp, typ kräv inlogg för queries och
// admin för mutations
var meetingResolver = {
    Meeting: {
        // För dessa löser Files-resolvern att omvandla FileResponse -> File
        summons: function (_a, _, ctx) {
            var summons = _a.summons;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    if ((summons === null || summons === void 0 ? void 0 : summons.id) != null) {
                        return [2 /*return*/, ctx.fileDataLoader.load(summons.id)];
                    }
                    return [2 /*return*/, null];
                });
            });
        },
        documents: function (_a, _, ctx) {
            var documents = _a.documents;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    if ((documents === null || documents === void 0 ? void 0 : documents.id) != null) {
                        return [2 /*return*/, ctx.fileDataLoader.load(documents.id)];
                    }
                    return [2 /*return*/, null];
                });
            });
        },
        lateDocuments: function (_a, _, ctx) {
            var lateDocuments = _a.lateDocuments;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    if ((lateDocuments === null || lateDocuments === void 0 ? void 0 : lateDocuments.id) != null) {
                        return [2 /*return*/, ctx.fileDataLoader.load(lateDocuments.id)];
                    }
                    return [2 /*return*/, null];
                });
            });
        },
        protocol: function (_a, _, ctx) {
            var protocol = _a.protocol;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    if ((protocol === null || protocol === void 0 ? void 0 : protocol.id) != null) {
                        return [2 /*return*/, ctx.fileDataLoader.load(protocol.id)];
                    }
                    return [2 /*return*/, null];
                });
            });
        }
    },
    Query: {
        meeting: function (_, _a) {
            var id = _a.id;
            return __awaiter(void 0, void 0, void 0, function () {
                var m;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getSingleMeeting(id)];
                        case 1:
                            m = _b.sent();
                            return [2 /*return*/, reducers_1.reduce(m, meeting_reducer_1.meetingReduce)];
                    }
                });
            });
        },
        meetings: function (_, params) { return __awaiter(void 0, void 0, void 0, function () {
            var strictParams, m;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        strictParams = params;
                        return [4 /*yield*/, api.getMultipleMeetings(strictParams)];
                    case 1:
                        m = _a.sent();
                        return [2 /*return*/, reducers_1.reduce(m, meeting_reducer_1.meetingReduce)];
                }
            });
        }); },
        latestBoardMeetings: function (_, _a) {
            var limit = _a.limit;
            return __awaiter(void 0, void 0, void 0, function () {
                var m;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, api.getLatestBoardMeetings(limit !== null && limit !== void 0 ? limit : undefined)];
                        case 1:
                            m = _b.sent();
                            return [2 /*return*/, reducers_1.reduce(m, meeting_reducer_1.meetingReduce)];
                    }
                });
            });
        }
    },
    Mutation: {
        addMeeting: function (_, _a) {
            var type = _a.type, number = _a.number, year = _a.year;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    return [2 /*return*/, api.createMeeting(type, number !== null && number !== void 0 ? number : undefined, year !== null && year !== void 0 ? year : undefined)];
                });
            });
        },
        removeMeeting: function (_, _a) {
            var id = _a.id;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    return [2 /*return*/, api.removeMeeting(id)];
                });
            });
        },
        addFileToMeeting: function (_, _a) {
            var meetingId = _a.meetingId, fileId = _a.fileId, fileType = _a.fileType;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    return [2 /*return*/, api.addFileToMeeting(meetingId, fileId, fileType)];
                });
            });
        },
        removeFileFromMeeting: function (_, _a) {
            var meetingId = _a.meetingId, fileType = _a.fileType;
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    return [2 /*return*/, api.removeFileFromMeeting(meetingId, fileType)];
                });
            });
        }
    }
};
exports["default"] = meetingResolver;
