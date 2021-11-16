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
exports.userReduce = void 0;
var config_1 = require("../config");
function userReduce(user) {
    var _a;
    // Provide a stub for access to be resolved later.
    var access = {
        web: [],
        doors: []
    };
    // Strip sensitive data! https://stackoverflow.com/a/50840024
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var passwordSalt = user.passwordSalt, passwordHash = user.passwordHash, reduced = __rest(user, ["passwordSalt", "passwordHash"]);
    var photoUrl = user.photoUrl ? "" + config_1["default"].FILES.ENDPOINT + user.photoUrl : null;
    // If isFuncUser is undefined, assume false
    var isFuncUser = (_a = user.isFuncUser) !== null && _a !== void 0 ? _a : false;
    var u = __assign(__assign({}, reduced), { photoUrl: photoUrl, isFuncUser: isFuncUser, access: access, posts: [], userPostHistory: [] });
    return u;
}
exports.userReduce = userReduce;
