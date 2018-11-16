/**
 * Module dependencies.
 */
var jwt = require('jsonwebtoken');

var tokenUtil = require('oauth2-server/lib/utils/token-util');
const db = require('./database/databaseHelper')

const SCOPES = ['read', 'write'];

// TODO: Generate the scope depending on the user demand
module.exports.generateAccessToken = function (client, user, scope) {
    return jwt.sign({
        userId: user.id,
        clientId: client.id,
        scopes: SCOPES,
        iss: process.env.URL,
        refreshToken: tokenUtil.generateRandomToken(),
        refreshTokenExpiresAt: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 14) // 2 semaines
    }, process.env.secretKey, { expiresIn: 60 * 30 }); // 30 minutes
}


/**
 * Get access token.
 */
module.exports.getAccessToken = function (bearerToken) {
    return db.getAccessToken(bearerToken)
};

/**
 * Get client.
 */
module.exports.getClient = function (clientId, clientSecret) {
    if (clientSecret == null)
        return db.getClientWithId(clientId);
    else
        return db.getClientWithIdAndSecret(clientId, clientSecret);
};

/**
 * Get refresh token.
 */
module.exports.getRefreshToken = function (refreshToken) {
    return db.getRefreshToken(refreshToken);
};

/**
 * Get user.
 */
module.exports.getUser = function (username, password) {
    return db.getUser(username, password);
};

/**
 * Get Authorization Code.
 */

module.exports.getAuthorizationCode = function (authorization_code) {
    return db.getAuthorizationCode(authorization_code);
};

/**
 * Save the Authorization Code
 * 
 */
module.exports.saveAuthorizationCode = function (authorizationCode, client, user) {
    return db.saveAuthorizationCode(authorizationCode, client, user);

};

/**
 * Save token.
 */
module.exports.saveToken = function (token, client, user) {
    return db.saveToken(token, client, user);
};

module.exports.revokeAuthorizationCode = function (authorization_code) {
    return db.revokeAuthorizationCode(authorization_code);
}

module.exports.revokeToken = function (token) {
    return db.revokeToken(token);
}
