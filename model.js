/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('dotenv').config();

var uristring = process.env.dbURL || 'mongodb://localhost/test';

// Makes connection asynchronously. Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Succeeded connected to: ' + uristring);
    }
});

/**
 * Schema definitions.
 */

const OAuthTokensSchema = new Schema({
    accessToken: { type: String },
    accessTokenExpiresOn: { type: Date },
    client: { type: Object },  // `client` and `user` are required in multiple places, for example `getAccessToken()`
    clientId: { type: String },
    refreshToken: { type: String },
    refreshTokenExpiresOn: { type: Date },
    user: { type: Object },
    userId: { type: String },
})
mongoose.model('OAuthTokens', OAuthTokensSchema);


const OAuthClientsSchema = new Schema({
    clientId: { type: String },
    clientSecret: { type: String },
    redirectUris: { type: Array },
    grants: { type: Array }
})
mongoose.model('OAuthClients', OAuthClientsSchema);


const OAuthUsersSchema = new Schema({
    email: { type: String, default: '' },
    firstname: { type: String },
    lastname: { type: String },
    password: { type: String },
    username: { type: String }
})
mongoose.model('OAuthUsers', OAuthUsersSchema);


const OAuthAuthorizationCodeSchema = new Schema({
    authorizationCode: { type: String },
    redirect_uri: { type: String },
    expiresAt: { type: Date },
    client: { type: OAuthClientsSchema },
    clientId: { type: String },
    user: { type: OAuthUsersSchema }
})
mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);

var OAuthTokensModel = mongoose.model('OAuthTokens');
var OAuthClientsModel = mongoose.model('OAuthClients');
var OAuthUsersModel = mongoose.model('OAuthUsers');
var OAuthAuthorizationCodeModel = mongoose.model('OAuthAuthorizationCode');

OAuthAuthorizationCodeModel.find({}).remove()
    .then(() => console.log('Removed all OAuth Authorization Code'));
//Populate some datas
OAuthUsersModel.find({}).remove()
    .then(() => {
        OAuthUsersModel.create({
            email: 'test@email.com',
            firstname: 'Godefroi',
            lastname: 'Roussel',
            password: 'password',
            username: 'godefroiroussel'
        })
    })
    .then(function () {
        console.log('finished populating OAuthUsersModel');
    });

OAuthClientsModel.find({}).remove()
    .then(() => {
        OAuthClientsModel.create({
            clientId: 'a17c21ed',
            clientSecret: 'client1',
            redirectUris: ['http://localhost:3000/redirected'],
            grants: ['password', 'authorization_code']
        })
    }).
    then(() => {
        console.log('finished populating OAuthClientsModel');
    });


/**
 * Get access token.
 */

module.exports.getAccessToken = function (bearerToken) {
    // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
    //return OAuthTokensModel.findOne({ accessToken: bearerToken }).lean();
    return bearerToken
};

/**
 * Get client.
 */

module.exports.getClient = function (clientId, clientSecret) {
    return OAuthClientsModel.findOne({ clientId: clientId }).lean();
    //return OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }).lean();
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function (refreshToken) {
    //return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
    return refreshToken
};

/**
 * Get user.
 */
module.exports.getUser = function (username, password) {
    return OAuthUsersModel.findOne({ username: username, password: password }).lean();
};

/**
 * Get Authorization Code.
 */

module.exports.getAuthorizationCode = function (authorization_code) {
    return OAuthAuthorizationCodeModel.findOne({ authorizationCode: authorization_code }).lean()
};

/**
 * Save the Authorization Code
 */
module.exports.saveAuthorizationCode = function (authorizationCode, client, user) {
    var oAuthAuthorizationCode = new OAuthAuthorizationCodeModel({
        authorizationCode: 'test',
        redirect_uri: 'http://localhost:3000/redirected',
        expiresAt: Date.now() + 3600 * 1000,
        client: client,
        clientId: client.clientId,
        user: user
    })

    // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
    return new Promise(function (resolve, reject) {
        oAuthAuthorizationCode.save(function (err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    }).then(function (saveResult) {
        // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
        saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;

        return saveResult;
    });
};

/**
 * Save token.
 */

module.exports.saveToken = function (token, client, user) {
    var accessToken = new OAuthTokensModel({
        accessToken: token.accessToken,
        accessTokenExpiresOn: token.accessTokenExpiresOn,
        client: client,
        clientId: client.clientId,
        refreshToken: token.refreshToken,
        refreshTokenExpiresOn: token.refreshTokenExpiresOn,
        user: user,
        userId: user._id,
    });
    // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
    return new Promise(function (resolve, reject) {
        accessToken.save(function (err, data) {
            if (err) reject(err);
            else resolve(data);
        });
    }).then(function (saveResult) {
        // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
        saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;

        // Unsure what else points to `saveResult` in oauth2-server, making copy to be safe
        var data = new Object();
        for (var prop in saveResult) data[prop] = saveResult[prop];

        // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
        data.client = data.clientId;
        data.user = data.userId;

        return data;
    });
};

module.exports.revokeAuthorizationCode = function (authorization_code) {
    return OAuthAuthorizationCodeModel.findOne({ authorizationCode: authorization_code }).remove();
}