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
exports.articleReducer = exports.convertMarkdownToHtml = void 0;
var dompurify_1 = require("dompurify");
var jsdom_1 = require("jsdom");
var showdown_1 = require("showdown");
var constants_1 = require("./constants");
var converter = new showdown_1["default"].Converter(constants_1.SHOWDOWN_CONVERTER_OPTIONS);
var dom = new jsdom_1.JSDOM();
// DOMWindow och Window är i detta fallet kompatibla,
// och detta testas i test/unit så borde vara fine
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
var dompurify = dompurify_1["default"](dom.window);
/**
 * Converts MarkDown to HTML and sanatizes MarkDown
 * @param md string formatted as Markdown
 */
exports.convertMarkdownToHtml = function (md) {
    var html = converter.makeHtml(md);
    html = dompurify.sanitize(html, { USE_PROFILES: { html: true } }); // Don't want any dirty XSS xD
    return html.trim();
};
/**
 * Converts HTML to Markdown
 * @param html string formatted as HTML
 */
var convertHtmlToMarkdown = function (html) {
    return converter.makeMarkdown(html, dom.window.document);
};
/**
 * Creates a slug out of a string
 * Converts it to lowercase
 * Converts å/ä to a, and ö to o
 * Strips special characters
 * Replaces spaces with dashes
 * @param str The string to slugify
 * @returns Slug, ex: `this-is-an-article`
 */
var generateSlug = function (str) {
    return str
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/[ö]/g, 'o')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};
var articleReduce = function (article, markdown) {
    var _a;
    // Vi lagrar alltid HTML i databasen; vi gör om till markdown vid
    // förfrågan
    var sanitizedBody = !markdown ? article.body : convertHtmlToMarkdown(article.body);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var body = article.body, refcreator = article.refcreator, reflastupdateby = article.reflastupdateby, reduced = __rest(article, ["body", "refcreator", "reflastupdateby"]);
    var a = __assign(__assign({}, reduced), { body: sanitizedBody.trim(), slug: generateSlug(reduced.title + "-" + ((_a = reduced.id) !== null && _a !== void 0 ? _a : '')), 
        // Exteremely temporary fix for tags, as knex doesn't send them back as an array
        tags: reduced.tags.toString().split(','), creator: {
            username: refcreator
        }, lastUpdatedBy: {
            username: reflastupdateby
        } });
    return a;
};
function articleReducer(a, markdown) {
    return __awaiter(this, void 0, void 0, function () {
        var aa;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(a instanceof Array)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all(a.map(function (e) { return articleReduce(e, markdown); }))];
                case 1:
                    aa = _a.sent();
                    return [2 /*return*/, aa];
                case 2: return [2 /*return*/, articleReduce(a, markdown)];
            }
        });
    });
}
exports.articleReducer = articleReducer;
