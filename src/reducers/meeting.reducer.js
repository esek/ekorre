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
exports.meetingReduce = void 0;
var graphql_generated_1 = require("../graphql.generated");
// Adds leading zeroes to a number and returns as string
var zeroPad = function (num, places) { return String(num).padStart(places, '0'); };
var addIfRefNotNull = function (obj, type, ref) {
    // If not null or undefined uses !=
    if (ref != null) {
        // obj is passed by reference; We add to it here
        // eslint-disable-next-line no-param-reassign
        obj[type] = { id: ref };
    }
};
function meetingReduce(meeting) {
    var name;
    if (meeting.type === graphql_generated_1.MeetingType.Sm || meeting.type === graphql_generated_1.MeetingType.Extra) {
        name = "" + meeting.type + zeroPad(meeting.number, 2);
    }
    else {
        name = meeting.type + " " + meeting.year;
    }
    // If a reference is missing, the documents is not to be added to response
    var refsummons = meeting.refsummons, refdocuments = meeting.refdocuments, reflateDocuments = meeting.reflateDocuments, refprotocol = meeting.refprotocol, reduced = __rest(meeting, ["refsummons", "refdocuments", "reflateDocuments", "refprotocol"]);
    var m = __assign(__assign({}, reduced), { name: name });
    // Add stubs to be resolved by file resolver
    addIfRefNotNull(m, graphql_generated_1.MeetingDocumentType.Summons, refsummons);
    addIfRefNotNull(m, graphql_generated_1.MeetingDocumentType.Documents, refdocuments);
    addIfRefNotNull(m, graphql_generated_1.MeetingDocumentType.LateDocuments, reflateDocuments);
    addIfRefNotNull(m, graphql_generated_1.MeetingDocumentType.Protocol, refprotocol);
    return m;
}
exports.meetingReduce = meetingReduce;
