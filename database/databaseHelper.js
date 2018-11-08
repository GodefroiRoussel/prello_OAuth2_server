const mongoose = require('mongoose');
require('dotenv').config();
const models = require('./models');

const TokensModel = models.TokensModel;
const ClientsModel = models.ClientsModel;
const UsersModel = models.UsersModel;
const AuthorizationCodeModel = models.AuthorizationCodeModel;
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


AuthorizationCodeModel.find({}).remove()
    .then(() => console.log('Removed all OAuth Authorization Code'));

TokensModel.find({}).remove()
    .then(() => console.log('Removed all OAuth Tokens '));
//Populate some datas
UsersModel.find({}).remove()
    .then(() => {
        UsersModel.create({
            createdAt: Date.now(),
            services: {},
            username: 'godefroiroussel',
            emails: ['test@email.com'],
            profile: {
                genderUser: 'Male',
                firstNameUser: 'Godefroi',
                lastNameUser: 'Roussel',
                nickNameUser: 'GodefroiRoussel',
                mailUser: 'test@email.com',
                biographyUser: '',
                initialsUser: 'GR',
                passwordUser: 'password',
                seedUser: 'test',
                avatarUser: '',
                languageUser: '',
                colourBlindUser: ''
            },

        })
    })
    .then(function () {
        console.log('finished populating UsersModel');
    });

ClientsModel.find({}).remove()
    .then(() => {
        ClientsModel.create({
            id: 'a17c21ed',
            clientSecret: 'client1',
            redirectUris: ['http://localhost:3000/redirected'],
            grants: ['implicit', 'authorization_code', 'refresh_token'],
            nameClient: 'Trello',
            logoClient: 'url',
            descriptionClient: '',
            websiteClient: 'https://trello.com/?truid=trc17f72-1cd0-4f52-ddb2-97554c799451'
        })
    }).
    then(() => {
        console.log('finished populating ClientsModel');
    });




// -------------------------- FUNCTIONS ---------------------------------------
module.exports.getAccessToken = function (bearerToken) {
    // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
    return TokensModel.findOne({ accessToken: bearerToken }).lean();
}

module.exports.getClientWithId = function (clientId) {
    return ClientsModel.findOne({ id: clientId }).lean();
}

module.exports.getClientWithIdAndSecret = function (clientId, clientSecret) {
    return ClientsModel.findOne({ id: clientId, clientSecret: clientSecret }).lean();
}

module.exports.getRefreshToken = function (refreshToken) {
    return TokensModel.findOne({ refreshToken: refreshToken }).lean();
}

module.exports.getUser = function (username, password) {
    return UsersModel.findOne({ username: username }).lean().then(user => {
        if (user && user.profile.passwordUser != password)
            return null

        return user;
    });
}

module.exports.getAuthorizationCode = function (authorization_code) {
    return AuthorizationCodeModel.findOne({ authorizationCode: authorization_code }).lean();
}

module.exports.saveAuthorizationCode = function (authorizationCode, client, user) {
    var oAuthAuthorizationCode = new AuthorizationCodeModel({
        authorizationCode: authorizationCode.authorizationCode,
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
    var accessToken = new TokensModel({
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
    return AuthorizationCodeModel.findOne({ authorizationCode: authorization_code.authorizationCode }).remove();
}

module.exports.revokeToken = function (token) {
    return TokensModel.findOne({ refreshToken: token.refreshToken }).remove();
}