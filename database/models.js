const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// -------------------------- Creating Schema --------------------------------

const OAuthClientsSchema = new Schema({
    id: { type: String },
    clientSecret: { type: String },
    redirectUris: { type: Array },
    grants: { type: Array },
    nameClient: { type: String },
    logoClient: { type: String },
    descriptionClient: { type: String, optional: true }
})


const OAuthUsersSchema = new Schema({
    email: { type: String, default: '' },
    firstname: { type: String },
    lastname: { type: String },
    password: { type: String },
    username: { type: String }
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


const OAuthAuthorizationCodeSchema = new Schema({
    authorizationCode: { type: String, default: 'test' },
    redirect_uri: { type: String },
    expiresAt: { type: Date },
    client: {
        id: { type: String }
    },
    user: { type: Object },
})

// -------------------------- Creating Models ---------------------------------
module.exports.OAuthTokensModel = mongoose.model('OAuthTokens', OAuthTokensSchema);
module.exports.OAuthClientsModel = mongoose.model('OAuthClients', OAuthClientsSchema);
module.exports.OAuthUsersModel = mongoose.model('OAuthUsers', OAuthUsersSchema);
module.exports.OAuthAuthorizationCodeModel = mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);
