
var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var http = require('http');
var path = require("path");
const oauthServer = require("oauth2-server");
var Request = require('oauth2-server').Request;
var Response = require('oauth2-server').Response;
var UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');
const db = require('./database/databaseHelper');
var WebSocket = require('ws')
const createClass = require("asteroid").createClass;

const Asteroid = createClass();
// Connect to a Meteor backend
const asteroid = new Asteroid({
    endpoint: process.env.APIURL || 'ws://localhost:9000/websocket',
    SocketConstructor: WebSocket
});



const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var staticPath = path.join(__dirname, './views');
app.use(express.static(staticPath));
app.set('view engine', 'ejs'); // set up ejs for templating

// Add OAuth server
app.oauth = new oauthServer({
    //debug: true,
    model: require('./model')
})


app.all('/*', function (req, res, next) {
    // CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    // Custom headers
    //res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,X-Access-Token,X-Key,Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

//TODO: UPDATE THE LOGIN FORM AND LET THE POSSIBILITY TO GET AN AUTHORIZATION PAGE WITH ONLY ALLOW OR DENY CHOICE
// Get authorization page.
app.get('/oauth/authorize', function (req, res) {
    // render an authorization form
    const cookie = false;
    if (cookie) {
        // TODO: Display Authorization page
    } else {
        const client_id = req.query.client_id;
        const response_type = req.query.response_type;
        const state = req.query.state;
        const redirect_uri = req.query.redirect_uri;

        if (client_id) {
            db.getClientWithId(client_id).then(client => {
                if (!client) {
                    res.setHeader('Content-Type', 'text/plain');
                    return res.status(404).send('Client not found !');
                }
                res.render('login.ejs', { client: client, response_type: response_type, state: state, redirect_uri: redirect_uri });
            })
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.status(400).send('Bad Request ! ');
        }
    }
});

// Post authorization.
app.post('/oauth/authorize', function (req, res, next) {
    // Only accessible from my website
    // Check if the user gives its approval
    // Then redirct to the URL given and give an authorization_code
    var request = new Request(req);
    var response = new Response(res);

    const username = request.body.username;
    const password = request.body.password;

    let authenticateHandler = {
        handle: function (request, response) {
            return db.getUserWithUsername(username).then(user => {
                if (user && !user.services.password) {
                    return asteroid.call('loginPolytech', { username: username, password: password }).then(res => {
                        return db.getUserWithUsername(username);
                    }).catch(err => {
                        console.log(err)
                        return handleError.call(this, err, req, res, response, next);
                    });
                } else {
                    return asteroid.loginWithPassword({ username: username, password: password }).then(res => {
                        return db.getUserWithUsername(username);
                    }).catch(err => {
                        console.log(err)
                        return handleError.call(this, err, req, res, response, next);
                    });
                }
            })

        }
    };

    const option = {
        authenticateHandler: authenticateHandler,
        accessTokenLifetime: 1800
    }

    return app.oauth.authorize(request, response, option)
        .then(function (code) {
            res.locals.oauth = { code: code };
            if (code.accessToken) {
                //Case Implicit Grant
                const token_modified = {
                    accessToken: code.accessToken, // JWT with user id and client id and all other information important
                    accessTokenExpiresAt: code.accessTokenExpiresAt,
                    token_type: "bearer"
                }
                return res.json(token_modified)
            } else {
                return handleResponse.call(this, req, res, response);
            }
        }).catch(function (err) {
            // handle error condition
            return handleError.call(this, err, req, res, response, next);
        });
});

// Post token.
app.post('/oauth/access_token', function (req, res) {

    var request = new Request(req);
    var response = new Response(res);

    const option = {
        accessTokenLifetime: 1800
    }

    return app.oauth.token(request, response, option)
        .then(function (token) {
            const token_modified = {
                accessToken: token.accessToken, // JWT with user id and client id and all other information important
                accessTokenExpiresAt: token.accessTokenExpiresAt,
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                token_type: "bearer"
            }
            return res.status(200).json(token_modified)
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

    console.log("ERREUR")
    console.log(e)
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

        res.status(400).send({ error: e.name, error_description: e.message });
    }
};