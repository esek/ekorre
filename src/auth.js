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
exports.hashWithSecret = exports.invalidateTokens = exports.invalidateToken = exports.verifyToken = exports.issueToken = exports.COOKIES = exports.EXPIRE_MINUTES = void 0;
var crypto_1 = require("crypto");
var jsonwebtoken_1 = require("jsonwebtoken");
var RequestErrors_1 = require("./errors/RequestErrors");
var logger_1 = require("./logger");
var logger = logger_1.Logger.getLogger('Auth');
var secrets = {
    accessToken: {
        value: '',
        time: Date.now(),
        refreshDays: 1
    },
    refreshToken: {
        value: '',
        time: Date.now(),
        refreshDays: 30
    }
};
var tokenBlacklist = [];
exports.EXPIRE_MINUTES = {
    accessToken: 60,
    refreshToken: 60 * 24 * 15
};
exports.COOKIES = {
    accessToken: 'e-access-token',
    refreshToken: 'e-refresh-token'
};
/**
 * Generera en ny secret om det behövs
 */
var SECRET = function (type) {
    var now = Date.now();
    var _a = secrets[type], value = _a.value, time = _a.time, refreshDays = _a.refreshDays;
    var inRange = now - time < refreshDays * 24 * 60 * 60 * 1000;
    // Om vi inte redan har ett value på secret, eller
    // att denna typ av token behöver en ny secret (vi har nått
    // refreshdays) skapar vi en ny
    if (!value || !inRange) {
        secrets[type].value = crypto_1.randomBytes(20).toString('hex');
        secrets[type].time = now;
    }
    return secrets[type].value;
};
/**
 * Skapa en token till ett objekt
 * @param obj - Objektet som ska finnas i token
 * @param type - Typen av token som skapas
 */
exports.issueToken = function (obj, type) {
    var expiration = exports.EXPIRE_MINUTES[type];
    // Add the current date as an `issued` prop to ensure it's always a new token being issued
    var token = jsonwebtoken_1["default"].sign(__assign(__assign({}, obj), { issued: Date.now() }), SECRET(type), {
        expiresIn: expiration + "min"
    });
    logger.debug("Issued a " + type + " for object: " + logger_1.Logger.pretty(obj));
    return token;
};
/**
 * Kollar ifall det finns en svartlistad token.
 * @param token - Den token som kollas
 * @returns Sant ifall den givna tokenen finns annars falskt.
 */
var isBlackListed = function (token, type) {
    var now = Date.now();
    tokenBlacklist = tokenBlacklist.filter(function (_a) {
        var time = _a.time, blacklistedToken = _a.token;
        return blacklistedToken && now - time < exports.EXPIRE_MINUTES[type] * 1000 * 60;
    });
    if (tokenBlacklist.some(function (_a) {
        var blacklistedToken = _a.token;
        return blacklistedToken === token;
    })) {
        logger.warn('Blacklisted token was used.');
        return true;
    }
    return false;
};
/**
 * Verifiera inkommande token. Kommer kasta error ifall den är ogiltig!
 * Om tokenen är godkänd så kommer dess data att returneras.
 * @param token jwt token
 * @param type typen av token, antingen `accessToken` eller `refreshToken`
 * @returns JWT payload eller eller Error ifall tokenen är invaliderad eller har annat fel.
 */
exports.verifyToken = function (token, type) {
    if (isBlackListed(token, type)) {
        throw new RequestErrors_1.UnauthenticatedError('This token is no longer valid');
    }
    var obj = jsonwebtoken_1["default"].verify(token, SECRET(type));
    logger.debug("Verified a " + type + " with value: " + logger_1.Logger.pretty(obj));
    return obj;
};
/**
 * Invalidera upp till 1000 tokens.
 * VARNING! Svarlistan är sparad i minnet och kommer förstöras
 * ifall servern startas om.
 * @param token - Den token som ska invalideras
 */
exports.invalidateToken = function (token) {
    tokenBlacklist.push({ token: token, time: Date.now() });
    logger.debug("Token " + token + " was invalidated");
};
/**
 * Invaliderar flera tokens på en gång
 * @param tokens - En array med tokens som ska invalideras
 */
exports.invalidateTokens = function () {
    var tokens = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        tokens[_i] = arguments[_i];
    }
    tokens.forEach(exports.invalidateToken);
};
/**
 * Hashar en string tillsammans med dagens secret
 * @param s Stringen att hasha
 * @returns Hash
 */
exports.hashWithSecret = function (s) {
    return crypto_1.createHash('sha256')
        .update(s + SECRET('refreshToken'))
        .digest('hex');
};
