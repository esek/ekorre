"use strict";
exports.__esModule = true;
exports.useDataLoader = exports.createDataLoader = void 0;
var dataloader_1 = require("dataloader");
var RequestErrors_1 = require("../errors/RequestErrors");
/**
 * Creates a new dataloader of type T
 * @param cb Callback function for handling dataloader requests
 * @returns Dataloader of type T
 */
exports.createDataLoader = function (cb) { return new dataloader_1["default"](cb); };
/**
 * Generic helper function to create a dataloader of any type as well as load it with the correct key
 * @param cb Callback function that takes the value to load as well as the type of dataloader to use
 * @returns A promise of type E
 * @throws Error if key is undefiend
 *
 * @example
 * // Use the userDataLoader for this request (context)
 * // using DataBasePostHistory as a model
 * const udl = useDataLoader<DatabasePostHistory, User>((entry, context) => ({
 *      key: entry.refuser,
 *      dataLoader: context.userDataLoader,
 *    }));
 * // userDataLoader uses batchUsersFunction internally,
 * // so no reduce needed
 * const u: User = await udl(e, {}, ctx);
 */
exports.useDataLoader = function (cb) { return function (model, _, ctx) {
    var _a = cb(model, ctx), key = _a.key, dataLoader = _a.dataLoader;
    if (!key) {
        throw new RequestErrors_1.NotFoundError('Nyckeln kunde inte hittas');
    }
    return dataLoader.load(key);
}; };
