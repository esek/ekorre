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
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var path_1 = require("path");
var config_1 = require("../config");
var RequestErrors_1 = require("../errors/RequestErrors");
var graphql_generated_1 = require("../graphql.generated");
var logger_1 = require("../logger");
var validation_service_1 = require("../services/validation.service");
var constants_1 = require("./constants");
var knex_1 = require("./knex");
var ROOT = config_1["default"].FILES.ROOT;
var logger = logger_1.Logger.getLogger('Files');
var FilesAPI = /** @class */ (function () {
    function FilesAPI() {
    }
    /**
     * Saves a new file to the server
     * @param file The file to save
     * @param type What type of file it is
     * @param path Where to save the file
     * @param creator Username of the creator of the file
     * @returns A `DatabaseFile` object with the data of the saved file
     */
    FilesAPI.prototype.saveFile = function (file, accessType, path, creator) {
        return __awaiter(this, void 0, void 0, function () {
            var type, hashedName, trimmedPath, folder, location_1, newFile, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        type = this.getFileType(file.name);
                        hashedName = this.createHashedName(file.name);
                        trimmedPath = this.trimFolder(path);
                        folder = ROOT + "/" + trimmedPath;
                        location_1 = "" + folder + hashedName;
                        // Create folder(s) if it doesn't exist
                        if (!fs_1["default"].existsSync(folder)) {
                            fs_1["default"].mkdirSync(folder, { recursive: true });
                        }
                        // Move file to correct location
                        return [4 /*yield*/, file.mv(location_1)];
                    case 1:
                        // Move file to correct location
                        _a.sent();
                        newFile = {
                            id: hashedName,
                            name: file.name,
                            refuploader: creator,
                            folderLocation: "" + trimmedPath + hashedName,
                            accessType: accessType,
                            createdAt: new Date(),
                            type: type
                        };
                        return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE).insert(newFile)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, newFile];
                    case 3:
                        err_1 = _a.sent();
                        logger.error(err_1);
                        throw new RequestErrors_1.ServerError('Kunde inte spara filen');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a folder on the filesystem
     * @param folder The directory in which to save the folder
     * @param name Name of the folder
     * @param creator Username of the creator of the folder
     * @returns The location of the newly created folder
     */
    FilesAPI.prototype.createFolder = function (folder, name, creator, customHash) {
        return __awaiter(this, void 0, void 0, function () {
            var folderTrimmed, hash, fullPath, location_2, dbData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        folderTrimmed = this.trimFolder(folder);
                        hash = customHash !== null && customHash !== void 0 ? customHash : this.createHashedName(name);
                        fullPath = ROOT + "/" + folderTrimmed + hash;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        // Create folder in storage
                        fs_1["default"].mkdirSync(fullPath, { recursive: true });
                        location_2 = "" + folderTrimmed + hash;
                        dbData = {
                            id: hash,
                            accessType: graphql_generated_1.AccessType.Public,
                            createdAt: new Date(),
                            folderLocation: location_2,
                            name: name,
                            refuploader: creator,
                            type: graphql_generated_1.FileType.Folder
                        };
                        return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE).insert(dbData)];
                    case 2:
                        _b.sent();
                        logger.info("Created folder " + name + " with hash " + hash);
                        return [2 /*return*/, location_2];
                    case 3:
                        _a = _b.sent();
                        throw new RequestErrors_1.ServerError('Mappen kunde inte skapas');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes file from `Files` DB and removes it from the system
     * @param id File id
     * @returns A boolean indicating if the deletion was a success
     */
    FilesAPI.prototype.deleteFile = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var file, location;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getFileData(id)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new RequestErrors_1.NotFoundError('Filen kunde inte hittas');
                        }
                        location = ROOT + "/" + file.folderLocation;
                        // Delete file from system
                        fs_1["default"].rmSync(location, { recursive: true });
                        // Delete file from DB
                        return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE)
                                .where('id', id)["delete"]()["catch"](function () {
                                throw new RequestErrors_1.ServerError('Kunde inte ta bort filen');
                            })];
                    case 2:
                        // Delete file from DB
                        _a.sent();
                        logger.info("Deleted " + file.type + " " + file.name);
                        return [2 /*return*/];
                }
            });
        });
    };
    FilesAPI.prototype.getMultipleFiles = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!type) return [3 /*break*/, 2];
                        return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE).where('type', type)];
                    case 1:
                        files = _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE)];
                    case 3:
                        files = _a.sent();
                        validation_service_1.validateNonEmptyArray(files, 'Inga filer hittades');
                        return [2 /*return*/, files];
                }
            });
        });
    };
    FilesAPI.prototype.getMultipleFilesById = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var f;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE).whereIn('id', ids)];
                    case 1:
                        f = _a.sent();
                        return [2 /*return*/, f];
                }
            });
        });
    };
    /**
     * Gets a files data
     * @param id Id of the file to fetch
     * @returns FileData
     */
    FilesAPI.prototype.getFileData = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE).where('id', id).first()];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new RequestErrors_1.NotFoundError('Filen kunde inte hittas');
                        }
                        return [2 /*return*/, file];
                }
            });
        });
    };
    /**
     * Helper method to get Enum value of file type
     * @param name Name of the file, including extension
     * @returns Enumvalue for filetype
     */
    FilesAPI.prototype.getFileType = function (name) {
        var _a;
        var ext = path_1.extname(name);
        var REGEX = (_a = {},
            _a[graphql_generated_1.FileType.Image] = /[/.](gif|jpg|jpeg|tiff|png|svg)$/i,
            _a[graphql_generated_1.FileType.Pdf] = /[/.](pdf)$/i,
            _a[graphql_generated_1.FileType.Text] = /[/.](txt|doc|docx)$/i,
            _a[graphql_generated_1.FileType.Code] = /[/.](html|htm|js|ts|jsx|tsx|tex)$/i,
            _a[graphql_generated_1.FileType.Powerpoint] = /[/.](ppt)$/i,
            _a[graphql_generated_1.FileType.Spreadsheet] = /[/.](xlx|xlsx|xls)$/i,
            _a);
        var type = Object.keys(REGEX).find(function (k) { return RegExp(REGEX[k]).exec(ext); });
        if (!type) {
            logger.warn("No matching FileType found for " + ext);
        }
        return type !== null && type !== void 0 ? type : graphql_generated_1.FileType.Other;
    };
    /**
     * Gets all items in provided folder
     * @param folder The path to the directory
     * @returns List of folder/files
     */
    FilesAPI.prototype.getFolderData = function (folder) {
        return __awaiter(this, void 0, void 0, function () {
            var folderTrimmed, fullPath, pathNames, dbPaths, fileIds, files, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        folderTrimmed = this.trimFolder(folder);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        fullPath = "" + ROOT + (folderTrimmed === '/' ? '' : "/" + folderTrimmed);
                        pathNames = folderTrimmed.split('/').filter(function (p) { return p; });
                        return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE)
                                .where('id', 'in', pathNames)
                                .select('id', 'name')];
                    case 2:
                        dbPaths = _a.sent();
                        fileIds = fs_1["default"].readdirSync(fullPath);
                        // If no files, return empty array
                        if (!(fileIds === null || fileIds === void 0 ? void 0 : fileIds.length)) {
                            return [2 /*return*/, [[], dbPaths]];
                        }
                        return [4 /*yield*/, knex_1["default"](constants_1.FILES_TABLE).where('id', 'in', fileIds)];
                    case 3:
                        files = _a.sent();
                        return [2 /*return*/, [files, dbPaths]];
                    case 4:
                        err_2 = _a.sent();
                        throw new RequestErrors_1.ServerError('Kunde inte hämta filer');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Helper to ensure folder name is formatted as /\<foldername>/
     *
     * Excluding root, which should always be /
     *
     * @param folder folder to format
     * @returns Correctly formatted foldername
     */
    FilesAPI.prototype.trimFolder = function (folder) {
        var trimmed = folder.replace('..', '').trim();
        if (trimmed.charAt(0) !== '/') {
            trimmed = "/" + trimmed;
        }
        if (trimmed.charAt(trimmed.length - 1) !== '/') {
            trimmed = trimmed + "/";
        }
        return trimmed;
    };
    /**
     * Generates an md5 hash consisting of a string and the current date
     * to ensure that it will always be unique
     * @param name The string to hash
     * @returns Random unique md5 hash
     */
    FilesAPI.prototype.createHashedName = function (name) {
        var date = new Date();
        var hashedName = crypto_1.createHash('md5')
            .update(name + date.valueOf().toString())
            .digest('hex') + path_1.extname(name);
        return hashedName;
    };
    return FilesAPI;
}());
exports["default"] = FilesAPI;
