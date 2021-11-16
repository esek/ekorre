"use strict";
exports.__esModule = true;
exports.validateNonEmptyArray = void 0;
var RequestErrors_1 = require("../errors/RequestErrors");
/**
 * Checks if an array is empty and throws a NotFoundError if it is
 * @param {Array} arr The array to check
 * @param {string} errorMsg The message to pass to the error
 * @throws {NotFoundError} A 404 error indicating that nothing was found
 */
exports.validateNonEmptyArray = function (arr, errorMsg) {
    if (!(arr === null || arr === void 0 ? void 0 : arr.length)) {
        throw new RequestErrors_1.NotFoundError(errorMsg !== null && errorMsg !== void 0 ? errorMsg : 'Något gick fel');
    }
};
