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
var express_1 = require("express");
var user_api_1 = require("../api/user.api");
var auth_1 = require("../auth");
var authRoute = express_1.Router();
var userAPI = new user_api_1.UserAPI();
var cookieOptions = function (tokenType) {
    return {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: auth_1.EXPIRE_MINUTES[tokenType] * 60 * 1000
    };
};
/** Regular HTTP POST endpoint for refreshing tokens
 * Used instead of GQL due to URQL not supporting fetching the headers...
 */
authRoute.post('/refresh', function (req, res) {
    (function () { return __awaiter(void 0, void 0, void 0, function () {
        var cookies, refreshToken, accessToken, verified, user, newAccessToken, newRefreshToken, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cookies = req.cookies;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    refreshToken = cookies[auth_1.COOKIES.refreshToken];
                    accessToken = cookies[auth_1.COOKIES.accessToken];
                    verified = auth_1.verifyToken(refreshToken, 'refreshToken');
                    // Invalidate old tokens
                    auth_1.invalidateTokens(accessToken, refreshToken);
                    return [4 /*yield*/, userAPI.getSingleUser(verified.username)];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        // throw new UnauthorizedError('Ingen användare hittades');
                        throw new Error();
                    }
                    newAccessToken = auth_1.issueToken({ username: user.username }, 'accessToken');
                    newRefreshToken = auth_1.issueToken({ username: user.username }, 'refreshToken');
                    // Attach them
                    res.cookie(auth_1.COOKIES.accessToken, newAccessToken, cookieOptions('accessToken'));
                    res.cookie(auth_1.COOKIES.refreshToken, newRefreshToken, cookieOptions('refreshToken'));
                    return [2 /*return*/, res.sendStatus(200)];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, res.sendStatus(401)];
                case 4: return [2 /*return*/];
            }
        });
    }); })();
});
exports["default"] = authRoute;
