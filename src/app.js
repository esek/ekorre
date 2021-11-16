"use strict";
var _a, _b;
exports.__esModule = true;
exports.schema = void 0;
var apollo_server_express_1 = require("apollo-server-express");
var cookie_parser_1 = require("cookie-parser");
var cors_1 = require("cors");
require("dotenv/config");
var express_1 = require("express");
var graphql_scalars_1 = require("graphql-scalars");
var graphql_tools_1 = require("graphql-tools");
var auth_1 = require("./auth");
var config_1 = require("./config");
var dataloaders_1 = require("./dataloaders");
var file_dataloader_1 = require("./dataloaders/file.dataloader");
var post_dataloader_1 = require("./dataloaders/post.dataloader");
var user_dataloader_1 = require("./dataloaders/user.dataloader");
var logger_1 = require("./logger");
var errorhandler_middleware_1 = require("./middlewares/graphql/errorhandler.middleware");
var Resolvers = require("./resolvers/index");
var auth_routes_1 = require("./routes/auth.routes");
var door_routes_1 = require("./routes/door.routes");
var files_routes_1 = require("./routes/files.routes");
var PORT = config_1["default"].PORT, HOST = config_1["default"].HOST, FILES = config_1["default"].FILES, CORS = config_1["default"].CORS;
// Visa en referens till källfilen istället för den kompilerade
logger_1.Logger.logLevel = logger_1.Logger.getLogLevelFromString((_a = process.env.LOGLEVEL) !== null && _a !== void 0 ? _a : 'normal');
var logger = logger_1.Logger.getLogger('App');
logger.log('Beginning startup...');
// Ladda alla scheman från .graphql filer
var schemas = graphql_tools_1.loadSchemaSync('./src/schemas/*.graphql', {
    loaders: [new graphql_tools_1.GraphQLFileLoader()],
    resolvers: {
        Date: graphql_scalars_1.DateResolver
    }
});
// Gör en map av alla resolvers
var resolvers = Object.entries(Resolvers).map(function (_a) {
    var _ = _a[0], value = _a[1];
    return value;
});
// Konstruera root schema. VIKTIGT! Det senaste schemat kommer skugga andra.
exports.schema = graphql_tools_1.mergeSchemas({
    schemas: [schemas],
    resolvers: resolvers
});
// Starta server.
var app = express_1["default"]();
var corsOptions = {
    origin: CORS.ALLOWED_ORIGINS,
    credentials: true
};
app.use(cookie_parser_1["default"]());
app.use(cors_1["default"](corsOptions));
// Setup files endpoint for REST-file handling
app.use(FILES.ENDPOINT, files_routes_1["default"]);
// Doors endpoint used by LU to give access
app.use('/doors', door_routes_1["default"]);
app.use('/auth', auth_routes_1["default"]);
var apolloLogger = logger_1.Logger.getLogger('Apollo');
var server = new apollo_server_express_1.ApolloServer({
    schema: exports.schema,
    context: function (_a) {
        var _b, _c;
        var req = _a.req, res = _a.res;
        var accessToken = (_b = req.cookies[auth_1.COOKIES.accessToken]) !== null && _b !== void 0 ? _b : '';
        var refreshToken = (_c = req.cookies[auth_1.COOKIES.refreshToken]) !== null && _c !== void 0 ? _c : '';
        // console.log({ accessToken, refreshToken });
        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            response: res,
            request: req,
            getUser: function () { return auth_1.verifyToken(accessToken, 'accessToken'); },
            userDataLoader: dataloaders_1.createDataLoader(user_dataloader_1.batchUsersFunction),
            postDataLoader: dataloaders_1.createDataLoader(post_dataloader_1.batchPostsFunction),
            fileDataLoader: dataloaders_1.createDataLoader(file_dataloader_1.batchFilesFunction)
        };
    },
    debug: ['info', 'debug'].includes((_b = process.env.LOGLEVEL) !== null && _b !== void 0 ? _b : 'normal'),
    plugins: [
        {
            requestDidStart: function (_a) {
                var request = _a.request;
                apolloLogger.info(request);
            }
        },
    ],
    tracing: true,
    formatError: errorhandler_middleware_1.errorHandler
});
server.applyMiddleware({ app: app, path: '/', cors: corsOptions });
app.listen(PORT, HOST, function () {
    logger.log("Server started on http://" + HOST + ":" + PORT);
});
