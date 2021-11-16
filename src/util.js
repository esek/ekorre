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
exports.stripObject = exports.toUTC = void 0;
/**
 * Converts a date to UTC format
 * @param d Date to convert
 * @returns A new Date object in UTC format
 */
exports.toUTC = function (d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
};
/**
 * Removes unused keys from an object. Is needed before some
 * knex operations with `obj`
 * @param obj
 */
exports.stripObject = function (obj) {
    // Ts låter en inte indexera nycklar i params med foreach,
    // måste använda `StrictObject`
    var copy = __assign({}, obj);
    Object.keys(copy).forEach(function (key) { return (copy[key] === undefined ? delete copy[key] : {}); });
    return copy;
};
