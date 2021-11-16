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
var express_fileupload_1 = require("express-fileupload");
var files_api_1 = require("../api/files.api");
var user_api_1 = require("../api/user.api");
var config_1 = require("../config");
var graphql_generated_1 = require("../graphql.generated");
var auth_middleware_1 = require("../middlewares/rest/auth.middleware");
var reducers_1 = require("../reducers");
var file_reducer_1 = require("../reducers/file.reducer");
var filesRoute = express_1.Router();
var filesAPI = new files_api_1["default"]();
var userApi = new user_api_1.UserAPI();
// Sets res.locals.getUser as a helper function for getting the current user
filesRoute.use(auth_middleware_1.setUser);
/**
 * HTTP POST endpoint for handling uploading of files
 * Requests are to be sent using FormData with a parameter of `file`
 * containing the file to upload
 *
 * Type and path parameters can be supplied in FormData body
 *
 * @default `type`: AccessType.Public
 * @default `path`: '/'
 *
 * TODO: Fix auth for this endpoint -- who should be able to upload what type of file?
 */
filesRoute.post('/upload', express_fileupload_1["default"](), auth_middleware_1.verifyAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, body, files, file, accessType, path, dbFile;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _a = req, body = _a.body, files = _a.files;
                if (!(files === null || files === void 0 ? void 0 : files.file)) {
                    // If no file is provided, send HTTP status 400
                    return [2 /*return*/, res.status(400).send('File missing')];
                }
                if (!res.locals.user) {
                    return [2 /*return*/, res.status(401).send('User missing')];
                }
                file = files.file instanceof Array ? files.file[0] : files.file;
                accessType = (_b = body === null || body === void 0 ? void 0 : body.accessType) !== null && _b !== void 0 ? _b : graphql_generated_1.AccessType.Public;
                path = (_c = body === null || body === void 0 ? void 0 : body.path) !== null && _c !== void 0 ? _c : '/';
                return [4 /*yield*/, filesAPI.saveFile(file, accessType, path, res.locals.user.username)];
            case 1:
                dbFile = _d.sent();
                return [2 /*return*/, res.send(dbFile)];
        }
    });
}); });
filesRoute.post('/upload/avatar', express_fileupload_1["default"](), auth_middleware_1.verifyAuthenticated, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var files, username, path, newPath, file, accessType, dbFile, e_1, error;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                files = req.files;
                if (!(files === null || files === void 0 ? void 0 : files.file)) {
                    // If no file is provided, send HTTP status 400
                    return [2 /*return*/, res.status(400).send('File missing')];
                }
                username = (_a = res.locals.user) === null || _a === void 0 ? void 0 : _a.username;
                if (!username) {
                    return [2 /*return*/, res.status(401).send()];
                }
                path = 'avatars';
                return [4 /*yield*/, filesAPI.getFileData('avatars')];
            case 1:
                if (!!(_b.sent())) return [3 /*break*/, 3];
                return [4 /*yield*/, filesAPI.createFolder('', path, username, path)];
            case 2:
                newPath = _b.sent();
                if (!newPath) {
                    return [2 /*return*/, res.status(500).send('Could not create directory')];
                }
                path = newPath;
                _b.label = 3;
            case 3:
                file = files.file instanceof Array ? files.file[0] : files.file;
                accessType = graphql_generated_1.AccessType.Authenticated;
                return [4 /*yield*/, filesAPI.saveFile(file, accessType, path, username)];
            case 4:
                dbFile = _b.sent();
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 8]);
                return [4 /*yield*/, userApi.updateUser(username, { photoUrl: dbFile.folderLocation })];
            case 6:
                _b.sent();
                return [2 /*return*/, res.send(dbFile)];
            case 7:
                e_1 = _b.sent();
                error = e_1;
                return [2 /*return*/, res.status(error.code).send(error.message)];
            case 8: return [2 /*return*/, res.send(reducers_1.reduce(dbFile, file_reducer_1.fileReduce))];
        }
    });
}); });
// Host static files
filesRoute.use('/', auth_middleware_1.verifyFileReadAccess(filesAPI), express_1.static(config_1["default"].FILES.ROOT));
exports["default"] = filesRoute;
