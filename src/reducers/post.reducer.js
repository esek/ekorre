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
exports.postReduce = void 0;
function postReduce(post) {
    var access = {
        doors: [],
        web: []
    };
    var p = __assign(__assign({}, post), { access: access, history: [] });
    return p;
}
exports.postReduce = postReduce;
