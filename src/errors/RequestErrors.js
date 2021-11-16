"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.NotFoundError = exports.ServerError = exports.UnauthenticatedError = exports.BadRequestError = void 0;
var apollo_server_errors_1 = require("apollo-server-errors");
var RequestError = /** @class */ (function (_super) {
    __extends(RequestError, _super);
    function RequestError(message) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        return _this;
    }
    RequestError.prototype.response = function (stack) {
        return {
            errorType: this.name,
            statusCode: this.code,
            message: this.message,
            stack: stack !== null && stack !== void 0 ? stack : this.stack
        };
    };
    RequestError.prototype.log = function () {
        return "{" + this.name + "} Request failed with status " + this.code + " - " + this.message;
    };
    return RequestError;
}(apollo_server_errors_1.ApolloError));
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.code = 400;
        _this.name = 'BadRequestError';
        return _this;
    }
    return BadRequestError;
}(RequestError));
exports.BadRequestError = BadRequestError;
var UnauthenticatedError = /** @class */ (function (_super) {
    __extends(UnauthenticatedError, _super);
    function UnauthenticatedError() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.code = 401;
        _this.name = 'UnauthenticatedError';
        return _this;
    }
    return UnauthenticatedError;
}(RequestError));
exports.UnauthenticatedError = UnauthenticatedError;
var ServerError = /** @class */ (function (_super) {
    __extends(ServerError, _super);
    function ServerError() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.code = 500;
        _this.name = 'ServerError';
        return _this;
    }
    return ServerError;
}(RequestError));
exports.ServerError = ServerError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.code = 404;
        _this.name = 'NotFoundError';
        return _this;
    }
    return NotFoundError;
}(RequestError));
exports.NotFoundError = NotFoundError;
exports["default"] = RequestError;
