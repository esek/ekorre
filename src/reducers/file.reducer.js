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
exports.__esModule = true;
exports.fileReduce = void 0;
var fs_1 = require("fs");
var config_1 = require("../config");
var _a = config_1["default"].FILES, ENDPOINT = _a.ENDPOINT, ROOT = _a.ROOT;
/**
 * Maps `FileModel` to `FileResponse` and reads the filesize
 * from the filesystem
 *
 * @param file FileModel to map
 * @returns `FileResponse` object with reference to creator
 */
exports.fileReduce = function (file) {
    var size = fs_1.statSync(ROOT + "/" + file.folderLocation).size;
    return __assign(__assign({}, file), { url: "" + ENDPOINT + file.folderLocation, createdBy: {
            username: file.refuploader
        }, size: size });
};
