
var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var http = require('http');
var expressJWT = require('express-jwt');
var path = require("path");
var mongoose = require('mongoose');
const oauthServer = require("oauth2-server");
var Request = require('oauth2-server').Request;
var Response = require('oauth2-server').Response;
var UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var staticPath = path.join(__dirname, './views');
app.use(express.static(staticPath));
app.set('view engine', 'ejs'); // set up ejs for templating

// Add OAuth server
app.oauth = new oauthServer({
    debug: true,
    model: require('./model'),
    grants: ['authorization_code', 'password']
})

// TODO DELETE JUST HERE FOR DEVELOPMENT PURPOSES
var OAuthUsersModel = mongoose.model('OAuthUsers');

/*
app.all('/*', function (req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    // Custom headers
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,X-Access-Token,X-Key,Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});
*/

// Get authorization page.
app.get('/oauth/authorize', function (req, res) {
    // render an authorization form

    res.render('login.ejs', { application: 'Prello Third Parties Application' });
});

// Post authorization.
app.post('/oauth/authorize', function (req, res, next) {
    // Only accessible from my website
    // Check if the user gives its approval
    // Then redirct to the URL given and give an authorization_code
    var request = new Request(req);
    var response = new Response(res);

    //TODO: DELETE IT: JUST HERE FOR DEVELOPMENT PURPOSES
    let authenticateHandler = {
        handle: function (request, response) {
            return OAuthUsersModel.findOne({ username: 'godefroiroussel', password: 'password' }).lean();;
        }
    };

    const option = { authenticateHandler: authenticateHandler }
    return app.oauth.authorize(request, response, option).then(function (code) {
        res.locals.oauth = { code: code };
    }).then(function () {
        return handleResponse.call(this, req, res, response);
    })
        .catch(function (err) {
            // handle error condition
            console.log(err)
            return handleError.call(this, err, req, res, response, next);
        });
});

// Post token.
app.post('/oauth/access_token', function (req, res) {

    var request = new Request(req);
    var response = new Response(res);

    return app.oauth.token(request, response)
        .then(function (token) {
            // Todo: remove unnecessary values in response
            const token_modified = {
                accessToken: token.accessToken, // JWT with user id and client id and all other information important
                accessTokenExpiresAt: token.accessTokenExpiresAt,
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                token_type: "bearer"
            }
            return res.json(token_modified)
        }).catch(function (err) {
            return res.status(500).json(err)
        });
});
// Give the Access token to the third party application

app.all('/redirected', (req, res) => {
    res.end('You have been successfully redirected')
})

// Case 404 
app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
});

//app.set('port', process.env.PORT || 3000);
/*
http.createServer(app).listen(3000);
https.createServer({}, app).listen(3001);*/
const port = 3000;

app.listen(port, () => {
    console.log('Server listening on ' + "http://127.0.0.1:" + port);
});

// --------------------- FUNCTION -----------------------------

/**
 * Handle response.
 */
var handleResponse = function (req, res, response) {

    if (response.status === 302) {
        var location = response.headers.location;
        delete response.headers.location;
        res.set(response.headers);
        res.redirect(location);
    } else {
        res.set(response.headers);
        res.status(response.status).send(response.body);
    }
};

/**
 * Handle error.
 */

var handleError = function (e, req, res, response, next) {

    if (this.useErrorHandler === true) {
        next(e);
    } else {
        if (response) {
            res.set(response.headers);
        }

        res.status(e.code);

        if (e instanceof UnauthorizedRequestError) {
            return res.send();
        }

        res.send({ error: e.name, error_description: e.message });
    }
};