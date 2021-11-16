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
var RequestErrors_1 = require("../errors/RequestErrors");
var logger_1 = require("../logger");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
var logger = logger_1.Logger.getLogger('ResourcesAPI');
var ResourcesAPI = /** @class */ (function () {
    function ResourcesAPI() {
    }
    ResourcesAPI.prototype.getResources = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var q;
            return __generator(this, function (_a) {
                q = knex_1["default"](constants_1.ACCESS_RESOURCES_TABLE);
                if (type) {
                    return [2 /*return*/, q.where('resourceType', type)];
                }
                return [2 /*return*/, q];
            });
        });
    };
    ResourcesAPI.prototype.getResource = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var resouce;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ACCESS_RESOURCES_TABLE)
                            .where('id', id)
                            .first()];
                    case 1:
                        resouce = _a.sent();
                        if (!resouce) {
                            logger.error("Resource with id " + id + " not found");
                            throw new RequestErrors_1.NotFoundError("Resource with id " + id + " not found");
                        }
                        return [2 /*return*/, resouce];
                }
            });
        });
    };
    ResourcesAPI.prototype.addResource = function (name, description, resourceType) {
        return __awaiter(this, void 0, void 0, function () {
            var id, errStr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ACCESS_RESOURCES_TABLE).insert({
                            description: description,
                            name: name,
                            resourceType: resourceType
                        })];
                    case 1:
                        id = (_a.sent())[0];
                        if (!id) {
                            errStr = "Failed to add resource with name " + name;
                            logger.error(errStr);
                            throw new RequestErrors_1.ServerError(errStr);
                        }
                        return [2 /*return*/, {
                                id: id,
                                name: name,
                                description: description,
                                resourceType: resourceType
                            }];
                }
            });
        });
    };
    ResourcesAPI.prototype.removeResouce = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.ACCESS_RESOURCES_TABLE).where('id', id)["delete"]()];
                    case 1:
                        res = _a.sent();
                        if (!res) {
                            logger.error("Failed to remove resource with id " + id);
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return ResourcesAPI;
}());
exports["default"] = ResourcesAPI;
