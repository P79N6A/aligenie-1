/**
 * Module dependencies.
 */

var bodyParser = require('koa-bodyparser');
var koa = require('koa');
var oauthServer = require('oauth2-server');
var router = require('koa-router')();
var views = require('koa-views');
var session = require('koa-session');
var path = require('path');
var util = require('util');
var model = require('./model');
var gateway = require('./gateway');
var Request = oauthServer.Request;
var Response = oauthServer.Response;

var CONFIG = {
  key: 'JSESSIONID',
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: false,
  rolling: false,
  renew: false,
};

// Create a Koa application.
var app = new koa();

// Add body parser.
app.use(bodyParser());

app.use(session(CONFIG, app));

app.use(views(path.join(__dirname, '/views'), {
  extension: 'ejs'
}));

var tokenModel = new model();

var oauth = new oauthServer({
  debug: true,
  model: tokenModel
});

var authenticateHandler = function(ctx) {
  return {
    handle: function(request, response) {
      return {
        'user': ctx.session.user
      };
    }
  };
};


// Get AccessToken
router.post('/oauth/token', async (ctx) => {
  var request = new Request(ctx.request);
  var response = new Response(ctx.response);
  await oauth.token(request, response);
});

// Get authorization code.
router.get('/oauth/authorize', async (ctx) => {
  // Redirect anonymous users to login page.
  let req = ctx.request;
  if (!ctx.session.user) {
    return ctx.redirect(util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s&state=%s&response_type=%s',
      req.path,
      req.query.client_id,
      req.query.redirect_uri,
      req.query.state,
      req.query.response_type));
  }

  await ctx.render('authorize', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    state: req.query.state,
    response_type: req.query.response_type
  });
});

// Get authorization code.
router.post('/oauth/authorize', async (ctx) => {
  let req = ctx.request;
  if (!ctx.session.user) {
    return ctx.redirect(util.format('/login?client_id=%s&redirect_uri=%s&state=%s&response_type=%s',
      req.body.client_id,
      req.body.redirect_uri,
      req.body.state));
  }

  var request = new Request(req);
  var response = new Response(ctx.response);

  await oauth.authorize(request, response, {
    authenticateHandler: authenticateHandler(ctx)
  });

  ctx.redirect(response.get('Location'));
});

// Login page
router.get('/login', async (ctx) => {
  let req = ctx.request;
  await ctx.render('login', {
    redirect: req.query.redirect,
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    state: req.query.state,
    response_type: req.query.response_type
  });
});

// Post login.
router.post('/login', async (ctx) => {
  let req = ctx.request;
  if (req.body.email !== '1@1.com') {
    return await ctx.render('login', {
      redirect: req.body.redirect,
      client_id: req.body.client_id,
      redirect_uri: req.body.redirect_uri,
      state: req.body.state,
      response_type: req.body.response_type
    });
  }

  ctx.session.user = {
    uid: 1
  };

  // Successful logins should send the user back to /oauth/authorize.
  var path = req.body.redirect || '/home';

  return ctx.redirect(util.format('%s?client_id=%s&redirect_uri=%s&state=%s&response_type=%s',
    path,
    req.body.client_id,
    req.body.redirect_uri,
    req.body.state,
    req.body.response_type));
});

// Get secret.
router.get('/secret', async (ctx) => {
  var request = new Request(ctx.request);
  var response = new Response(ctx.response);
  await oauth.authenticate(request, response);
  ctx.body = 'Secret area';
});

router.post('/aligenie/gateway', async (ctx) => {
  var request = new Request(ctx.request);
  var response = new Response(ctx.response);
  await oauth.authenticate(request, response);
  await gateway.handle(ctx);
});

router.get('/public', async (ctx) => {
  ctx.body = 'Public area';
});

app.use(router.routes());

// Start listening for requests.
app.listen(3000);

//localhost:3000/oauth/authorize?client_id=civp5wRqGGL81R33ycml2fV3zhG8UxbQ&state=1234&response_type=code&redirect_uri=http://www.baidu.com/callback