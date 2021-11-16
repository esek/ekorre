"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.meeting = exports.user = exports.post = exports.files = exports.auth = exports.article = exports.accessresources = exports.access = void 0;
var access_resolver_1 = require("./access.resolver");
__createBinding(exports, access_resolver_1, "default", "access");
var accessresources_resolver_1 = require("./accessresources.resolver");
__createBinding(exports, accessresources_resolver_1, "default", "accessresources");
var article_resolver_1 = require("./article.resolver");
__createBinding(exports, article_resolver_1, "default", "article");
var auth_resolver_1 = require("./auth.resolver");
__createBinding(exports, auth_resolver_1, "default", "auth");
var files_resolver_1 = require("./files.resolver");
__createBinding(exports, files_resolver_1, "default", "files");
var post_resolver_1 = require("./post.resolver");
__createBinding(exports, post_resolver_1, "default", "post");
// eslint-disable-next-line import/no-cycle
var user_resolver_1 = require("./user.resolver");
__createBinding(exports, user_resolver_1, "default", "user");
var meeting_resolver_1 = require("./meeting.resolver");
__createBinding(exports, meeting_resolver_1, "default", "meeting");
