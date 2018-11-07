const mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('dotenv').config();

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

// -------------------------- Creating Schema --------------------------------

/**
 * Schema definitions.
 */
const OAuthClientsSchema = new Schema({
    id: { type: String },
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


const OAuthTokensSchema = new Schema({
    accessToken: { type: String }, // JWT with user id and client id and all other information important
    accessTokenExpiresAt: { type: Date },
    client: {
        id: { type: String }
    },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
    user: {
        id: { type: String }
    },
})

/*
JWT Token
{
  "userId": "1234567890",
  "clientId": "ace54s85",
  "accessTokenExpiresAt": "1524521",
  "refreshToken": "dsiejz478",
  "refreshTokenExpiresAt": "145"
}
*/
mongoose.model('OAuthTokens', OAuthTokensSchema);


const OAuthAuthorizationCodeSchema = new Schema({
    authorizationCode: { type: String, default: 'test' },
    redirect_uri: { type: String },
    expiresAt: { type: Date },
    client: {
        id: { type: String }
    },
    user: { type: Object },
})
/*
JWT Authorization code


*/
mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);



// -------------------------- Creating Models ---------------------------------
const OAuthTokensModel = mongoose.model('OAuthTokens');
const OAuthClientsModel = mongoose.model('OAuthClients');
const OAuthUsersModel = mongoose.model('OAuthUsers');
const OAuthAuthorizationCodeModel = mongoose.model('OAuthAuthorizationCode');


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
            grants: ['implicit', 'authorization_code', 'refresh_token']
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