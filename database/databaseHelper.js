const mongoose = require('mongoose');
require('dotenv').config();
const models = require('./models');

const OAuthTokensModel = models.OAuthTokensModel;
const OAuthClientsModel = models.OAuthClientsModel;
const OAuthUsersModel = models.OAuthUsersModel;
const OAuthAuthorizationCodeModel = models.OAuthAuthorizationCodeModel;
//------------------------ CONNECTION DATABASE ------------------------------------

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

// -------------------------- Populate DB --------------------------------


OAuthAuthorizationCodeModel.find({}).remove()
    .then(() => console.log('Removed all OAuth Authorization Code'));

OAuthTokensModel.find({}).remove()
    .then(() => console.log('Removed all OAuth Tokens '));
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
            id: 'a17c21ed',
            clientSecret: 'client1',
            redirectUris: ['http://localhost:3000/redirected'],
            grants: ['implicit', 'authorization_code', 'refresh_token'],
            nameClient: 'Trello',
            logoClient: 'url',
            descriptionClient: ''
        })
    }).
    then(() => {
        console.log('finished populating OAuthClientsModel');
    });




// -------------------------- FUNCTIONS ---------------------------------------
module.exports.findAuthorizationToken = function (bearerToken) {
    // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
    return OAuthTokensModel.findOne({ accessToken: bearerToken }).lean();
}

module.exports.getClientWithId = function (clientId) {
    return OAuthClientsModel.findOne({ id: clientId }).lean();
}

module.exports.getClientWithIdAndSecret = function (clientId, clientSecret) {
    return OAuthClientsModel.findOne({ id: clientId, clientSecret: clientSecret }).lean();
}

module.exports.getRefreshToken = function (refreshToken) {
    return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
}

module.exports.getUser = function (username, password) {
    return OAuthUsersModel.findOne({ username: username, password: password }).lean();
}

module.exports.getAuthorizationCode = function (authorization_code) {
    return OAuthAuthorizationCodeModel.findOne({ authorizationCode: authorization_code }).lean();
}

module.exports.saveAuthorizationCode = function (authorizationCode, client, user) {
    var oAuthAuthorizationCode = new OAuthAuthorizationCodeModel({
        authorizationCode: 'test',//authorizationCode.authorizationCode,
        redirect_uri: authorizationCode.redirectUri,
        expiresAt: authorizationCode.expiresAt,
        client: {
            id: client.id
        },
        user: {
            id: user._id
        },
    })

    // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
    return new Promise(function (resolve, reject) {
        return oAuthAuthorizationCode.save(function (err, data) {
            if (err) reject(err);
            else {
                resolve(data);
            }
        });
    }).then(function (saveResult) {
        // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
        saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;
        return saveResult;
    }).catch(err => console.log(err));
}

module.exports.saveToken = function (token, client, user) {
    var accessToken = new OAuthTokensModel({
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        client: {
            id: client.id
        },
        user: user
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

        return saveResult;
    });
}

module.exports.revokeAuthorizationCode = function (authorization_code) {
    return OAuthAuthorizationCodeModel.findOne({ authorizationCode: authorization_code.authorizationCode }).remove();
}

module.exports.revokeToken = function (token) {
    return OAuthTokensModel.findOne({ refreshToken: token.refreshToken }).remove();
}