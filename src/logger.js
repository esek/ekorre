"use strict";
exports.__esModule = true;
exports.Logger = exports.LogLevel = void 0;
var util_1 = require("util");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["normal"] = 0] = "normal";
    LogLevel[LogLevel["info"] = 1] = "info";
    LogLevel[LogLevel["debug"] = 2] = "debug";
    LogLevel[LogLevel["error"] = 3] = "error";
    LogLevel[LogLevel["warn"] = 4] = "warn";
})(LogLevel || (LogLevel = {}));
exports.LogLevel = LogLevel;
/**
 * En simpel loggare. Bör vidareutvecklas.
 */
var Logger = /** @class */ (function () {
    function Logger(name) {
        this.c = console;
        this.loggerName = name;
    }
    Logger.getLogger = function (name) {
        return new Logger(name);
    };
    Logger.getLogLevelFromString = function (logLevel) {
        switch (logLevel.toLowerCase()) {
            case 'normal':
                return LogLevel.normal;
            case 'info':
                return LogLevel.info;
            case 'error':
                return LogLevel.error;
            case 'debug':
                return LogLevel.debug;
            case 'warn':
                return LogLevel.warn;
            default:
                return LogLevel.normal;
        }
    };
    Logger.pretty = function (o) {
        return util_1["default"].inspect(o, { colors: true });
    };
    Logger.prototype.l = function (prefix, o) {
        if (typeof o === 'string')
            this.c.log(prefix + " " + o);
        else
            this.c.log(prefix + " " + util_1["default"].inspect(o, { colors: true }));
    };
    Logger.prototype.e = function (prefix, o) {
        if (typeof o === 'string')
            this.c.error(prefix + " " + o);
        else
            this.c.error(prefix + " " + util_1["default"].inspect(o, { colors: true }));
    };
    Logger.prototype.w = function (prefix, o) {
        if (typeof o === 'string')
            this.c.warn(prefix + " " + o);
        else
            this.c.warn(prefix + " " + util_1["default"].inspect(o, { colors: true }));
    };
    Logger.prototype.i = function (prefix, o) {
        if (typeof o === 'string')
            this.c.info(prefix + " " + o);
        else
            this.c.info(prefix + " " + util_1["default"].inspect(o, { colors: true }));
    };
    Logger.prototype.d = function (prefix, o) {
        if (typeof o === 'string')
            this.c.debug(prefix + " " + o);
        else
            this.c.debug(prefix + " " + util_1["default"].inspect(o, { colors: true }));
    };
    Logger.prototype.log = function (o) {
        switch (Logger.logLevel) {
            case LogLevel.normal:
            case LogLevel.info:
            case LogLevel.debug:
                this.l("[" + this.loggerName + "]:", o);
                break;
            default:
                break;
        }
    };
    Logger.prototype.info = function (o) {
        switch (Logger.logLevel) {
            case LogLevel.info:
                this.i("[" + this.loggerName + ":info]:", o);
                break;
            default:
                break;
        }
    };
    Logger.prototype.debug = function (o) {
        switch (Logger.logLevel) {
            case LogLevel.debug:
                this.d("[" + this.loggerName + ":debug]:", o);
                break;
            default:
                break;
        }
    };
    Logger.prototype.warn = function (o) {
        switch (Logger.logLevel) {
            case LogLevel.normal:
            case LogLevel.info:
            case LogLevel.debug:
            case LogLevel.warn:
                this.w("[" + this.loggerName + ":warn]:", o);
                break;
            default:
                break;
        }
    };
    Logger.prototype.error = function (o) {
        switch (Logger.logLevel) {
            case LogLevel.error:
            case LogLevel.normal:
            case LogLevel.info:
            case LogLevel.debug:
                this.e("[\u001B[31m" + this.loggerName + "\u001B[0m]:", o);
                break;
            default:
                break;
        }
    };
    return Logger;
}());
exports.Logger = Logger;
