"use strict";
exports.__esModule = true;
exports.errorHandler = void 0;
var RequestErrors_1 = require("../../errors/RequestErrors");
var logger_1 = require("../../logger");
var logger = logger_1.Logger.getLogger('GraphQLErrorHandler');
exports.errorHandler = function (err) {
    var _a;
    var originalError = err.originalError;
    if (originalError instanceof RequestErrors_1["default"]) {
        logger.error(originalError.log());
        return originalError.response();
    }
    logger.warn("Non {RequestError} type found - " + ((_a = originalError === null || originalError === void 0 ? void 0 : originalError.name) !== null && _a !== void 0 ? _a : err.name) + ", see to change");
    return err;
};
