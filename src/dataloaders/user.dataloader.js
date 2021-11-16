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
exports.batchUsersFunction = exports.userApi = void 0;
var user_api_1 = require("../api/user.api");
var RequestErrors_1 = require("../errors/RequestErrors");
var reducers_1 = require("../reducers");
var user_reducer_1 = require("../reducers/user.reducer");
// Om vi kör tester beh;ver vi denna konstant
// för att kunna spionera på den
exports.userApi = new user_api_1.UserAPI();
/**
 * Funktion som används för att skapa en DataLoader
 * för att batcha User-requests och öka prestanda
 * markant
 * @param usernames List of usernames
 */
exports.batchUsersFunction = function (usernames) { return __awaiter(void 0, void 0, void 0, function () {
    var apiResponse, users, userMap, results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.userApi.getMultipleUsers(usernames)];
            case 1:
                apiResponse = _a.sent();
                if (apiResponse === null)
                    return [2 /*return*/, new Array(usernames.length).fill(new Error('User not found'))];
                users = reducers_1.reduce(apiResponse, user_reducer_1.userReduce);
                userMap = new Map();
                users.forEach(function (u) {
                    userMap.set(u.username, u);
                });
                results = usernames.map(function (name) {
                    return userMap.get(name) || new RequestErrors_1.NotFoundError("No result for username " + name);
                });
                return [2 /*return*/, results];
        }
    });
}); };
