const mongoose = require('mongoose');
var Schema = mongoose.Schema;
// -------------------------- Creating Schema --------------------------------

const ClientsSchema = new Schema({
    id: { type: String },
    clientSecret: { type: String },
    redirectUris: { type: Array },
    grants: { type: Array },
    nameClient: { type: String },
    logoClient: { type: String },
    descriptionClient: { type: String, optional: true },
    websiteClient: { type: String }
})


const UsersSchema = new Schema({
    createdAt: { type: Date },
    services: { type: Object },
    username: { type: String },
    emails: { type: Array },
    profile: {
        genderUser: { type: String },
        firstNameUser: { type: String },
        lastNameUser: { type: String },
        nickNameUser: { type: String },
        mailUser: { type: String },
        biographyUser: { type: String },
        initialsUser: { type: String },
        passwordUser: { type: String },
        seedUser: { type: String },
        avatarUser: { type: String },
        languageUser: { type: String },
        colourBlindUser: { type: String },
    }
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
const TokensSchema = new Schema({
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


const AuthorizationCodeSchema = new Schema({
    authorizationCode: { type: String },
    redirect_uri: { type: String },
    expiresAt: { type: Date },
    client: {
        id: { type: String }
    },
    user: { type: Object },
})

// -------------------------- Creating Models ---------------------------------
module.exports.TokensModel = mongoose.model('accessTokens', TokensSchema);
module.exports.ClientsModel = mongoose.model('clients', ClientsSchema);
module.exports.UsersModel = mongoose.model('users', UsersSchema);
module.exports.AuthorizationCodeModel = mongoose.model('authorizationcodes', AuthorizationCodeSchema);
