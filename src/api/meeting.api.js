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
exports.MeetingAPI = void 0;
/* eslint-disable class-methods-use-this */
var RequestErrors_1 = require("../errors/RequestErrors");
var graphql_generated_1 = require("../graphql.generated");
var logger_1 = require("../logger");
var validation_service_1 = require("../services/validation.service");
var util_1 = require("../util");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
var logger = logger_1.Logger.getLogger('MeetingAPI');
var MeetingAPI = /** @class */ (function () {
    function MeetingAPI() {
    }
    /**
     *
     * @param limit
     * @param sortOrder
     */
    MeetingAPI.prototype.getAllMeetings = function (limit, sortOrder) {
        if (limit === void 0) { limit = 20; }
        if (sortOrder === void 0) { sortOrder = 'desc'; }
        return __awaiter(this, void 0, void 0, function () {
            var m;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE)
                            .select('*')
                            .orderBy('id', sortOrder)
                            .limit(limit)];
                    case 1:
                        m = _a.sent();
                        validation_service_1.validateNonEmptyArray(m, 'Hittade inga möten');
                        return [2 /*return*/, m];
                }
            });
        });
    };
    /**
     * Hämta ett möte.
     * @param id det unika mötes-idt
     * @throws `NotFoundError` om mötet ej kan hittas
     */
    MeetingAPI.prototype.getSingleMeeting = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var m;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE).where({ id: id }).first()];
                    case 1:
                        m = _a.sent();
                        if (m == null) {
                            throw new RequestErrors_1.NotFoundError('Mötet kunde inte hittas');
                        }
                        return [2 /*return*/, m];
                }
            });
        });
    };
    MeetingAPI.prototype.getMultipleMeetings = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var safeParams, m;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        safeParams = util_1.stripObject(params);
                        return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE).where(safeParams)];
                    case 1:
                        m = _a.sent();
                        if (m === null) {
                            throw new RequestErrors_1.ServerError('Mötessökningen misslyckades');
                        }
                        validation_service_1.validateNonEmptyArray(m, 'Hittade inga möten');
                        return [2 /*return*/, m];
                }
            });
        });
    };
    /**
     * Hämtar de senaste `limit` styrelsemötena
     * @param limit antal styrelsemöten som ska returneras. Om null
     * returneras alla
     */
    MeetingAPI.prototype.getLatestBoardMeetings = function (limit) {
        return __awaiter(this, void 0, void 0, function () {
            var query, m;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = knex_1["default"](constants_1.MEETING_TABLE)
                            .where({ type: graphql_generated_1.MeetingType.Sm })
                            .orderBy('number', 'desc')
                            .orderBy('year', 'desc');
                        if (limit != null) {
                            query.limit(limit);
                        }
                        return [4 /*yield*/, query];
                    case 1:
                        m = _a.sent();
                        if (m === null) {
                            throw new RequestErrors_1.ServerError('Mötessökningen misslyckades');
                        }
                        validation_service_1.validateNonEmptyArray(m, 'Hittade inga möten');
                        return [2 /*return*/, m];
                }
            });
        });
    };
    /**
     * Skapar ett nytt möte. Misslyckas om mötet redan existerar
     * @param type
     * @param number
     * @param year
     */
    MeetingAPI.prototype.createMeeting = function (type, number, year) {
        return __awaiter(this, void 0, void 0, function () {
            var safeYear, safeNbr, lastNbr, possibleDouble, err_1, logStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        safeYear = (Number.isSafeInteger(year) ? year : new Date().getFullYear());
                        safeNbr = number;
                        if (!!Number.isSafeInteger(safeNbr)) return [3 /*break*/, 2];
                        return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE)
                                .select('number')
                                .where({ type: type, year: safeYear })
                                .orderBy('number', 'desc')
                                .orderBy('year', 'desc')
                                .first()];
                    case 1:
                        lastNbr = _a.sent();
                        if (lastNbr === undefined) {
                            // Vi hittade inget tidigare möte detta året,
                            // så detta är första
                            safeNbr = 1;
                        }
                        else {
                            safeNbr = lastNbr.number + 1;
                        }
                        _a.label = 2;
                    case 2: return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE)
                            .where({
                            type: type,
                            number: safeNbr,
                            year: safeYear
                        })
                            .first()];
                    case 3:
                        possibleDouble = _a.sent();
                        if (possibleDouble !== undefined) {
                            throw new RequestErrors_1.BadRequestError('Mötet finns redan!');
                        }
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE).insert({
                                type: type,
                                number: safeNbr,
                                year: safeYear
                            })];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        err_1 = _a.sent();
                        logStr = "Failed to create meeting with values: " + logger_1.Logger.pretty({
                            type: type,
                            number: number,
                            year: year
                        });
                        logger.error(logStr);
                        throw new RequestErrors_1.ServerError('Attans! Mötet kunde inte skapas!');
                    case 7: return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Tar bort ett möte
     * @param id Mötes-ID
     * @throws `NotFoundError` om mötet ej kunde tas bort
     */
    MeetingAPI.prototype.removeMeeting = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE)["delete"]().where({ id: id })];
                    case 1:
                        res = _a.sent();
                        if (res === 0) {
                            throw new RequestErrors_1.NotFoundError('Mötet kunde inte hittas');
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Försöker lägga till en fil till ett möte.
     * Ger `ServerError` om filen redan finns för detta mötet
     * @param meetingId
     * @param fileId
     * @param fileType
     * @throws `ServerError`
     */
    MeetingAPI.prototype.addFileToMeeting = function (meetingId, fileId, fileType) {
        return __awaiter(this, void 0, void 0, function () {
            var ref, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ref = "ref" + fileType;
                        return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE)
                                .where('id', meetingId)
                                .whereNull(ref)
                                .update(ref, fileId)];
                    case 1:
                        res = _a.sent();
                        if (res === 0) {
                            throw new RequestErrors_1.ServerError("Antingen finns detta m\u00F6te inte, eller s\u00E5 finns dokument av typen " + fileType + " redan p\u00E5 detta m\u00F6te!");
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Försöker ta bort ett dokument från ett möte. Returnerar true
     * om mötet hittades och referensen till denna dokumenttypen garanterat
     * är `null` i databasen.
     *
     * Även kännt som _Annas Metod_, denna skapades specifikt för att
     * Ordförande 2021 Anna Hollsten älskade att ladda upp handlingar
     * som protokoll och vice versa, och den gamla hemsidan hade ingen
     * funktion för att ta bort dokument...
     * @param meetingId
     * @param fileType
     */
    MeetingAPI.prototype.removeFileFromMeeting = function (meetingId, fileType) {
        return __awaiter(this, void 0, void 0, function () {
            var ref, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ref = "ref" + fileType;
                        return [4 /*yield*/, knex_1["default"](constants_1.MEETING_TABLE).where('id', meetingId).update(ref, null)];
                    case 1:
                        res = _a.sent();
                        if (res === 0) {
                            throw new RequestErrors_1.ServerError("Kunde inte ta bort m\u00F6tesdokument, troligen existerar inte m\u00F6tet med id " + meetingId);
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return MeetingAPI;
}());
exports.MeetingAPI = MeetingAPI;
