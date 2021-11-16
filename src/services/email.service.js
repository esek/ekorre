"use strict";
exports.__esModule = true;
exports.sendEmail = void 0;
var axios_1 = require("axios");
var config_1 = require("../config");
var _a = config_1["default"].EBREV, URL = _a.URL, API_TOKEN = _a.API_TOKEN;
/*
  Creates an axios-instance and sets the baseUrl and authorization header
  to the corresponding values in the config
*/
var api = axios_1["default"].create({
    baseURL: URL,
    headers: { Authorization: API_TOKEN }
});
exports.sendEmail = function (to, subject, templateName, overrides) {
    return api.post('/send', {
        to: to instanceof Array ? to : [to],
        subject: subject,
        templateName: templateName,
        overrides: overrides
    });
};
