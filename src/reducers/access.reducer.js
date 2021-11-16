"use strict";
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
exports.accessReducer = void 0;
var graphql_generated_1 = require("../graphql.generated");
/**
 * Reduce database access arrays to an access object
 * @param dbAccess database access
 * @returns access object
 */
exports.accessReducer = function (dbAccess) {
    var initial = {
        doors: [],
        web: []
    };
    var access = dbAccess.reduce(function (acc, curr) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        var refname = curr.refname, refresource = curr.refresource, resource = __rest(curr, ["refname", "refresource"]);
        switch (resource.resourceType) {
            case graphql_generated_1.AccessResourceType.Web:
                if (acc.web.some(function (web) { return web.id === resource.id; })) {
                    break;
                }
                acc.web.push(resource);
                break;
            case graphql_generated_1.AccessResourceType.Door:
                if (acc.doors.some(function (door) { return door.id === resource.id; })) {
                    break;
                }
                acc.doors.push(resource);
                break;
            default:
                break;
        }
        return acc;
    }, initial);
    return access;
};
