const bodyParser = require('koa-bodyparser');
const koa = require('koa');
const oauthServer = require('oauth2-server');
const router = require('koa-router')();
const views = require('koa-views');
const session = require('koa-session');
const path = require('path');
const util = require('util');
const model = require('./model');
const gateway = require('./gateway');
const Request = oauthServer.Request;
const Response = oauthServer.Response;

const CONFIG = {
    key: 'JSESSIONID',
    maxAge: 86400000,
    autoCommit: true,
    overwrite: true,
    httpOnly: true,
    signed: false,
    rolling: false,
    renew: false,
};

const app = new koa();

app.use(bodyParser());

app.use(session(CONFIG, app));

app.use(views(path.join(__dirname, '/views'), {
    extension: 'ejs'
}));

const tokenModel = new model();

const oauth = new oauthServer({
    debug: true,
    model: tokenModel
});

const authenticateHandler = function (ctx) {
    return {
        handle: function (request, response) {
            return {
                'user': ctx.session.user
            };
        }
    };
};


router.post('/oauth/token', async (ctx) => {
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);
    await oauth.token(request, response);
});


router.get('/oauth/authorize', async (ctx) => {
    let req = ctx.request;
    // Redirect anonymous users to login page.
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


router.post('/oauth/authorize', async (ctx) => {
    let req = ctx.request;
    if (!ctx.session.user) {
        return ctx.redirect(util.format('/login?client_id=%s&redirect_uri=%s&state=%s&response_type=%s',
            req.body.client_id,
            req.body.redirect_uri,
            req.body.state));
    }

    const request = new Request(req);
    const response = new Response(ctx.response);

    await oauth.authorize(request, response, {
        authenticateHandler: authenticateHandler(ctx)
    });

    ctx.redirect(response.get('Location'));
});


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
    const path = req.body.redirect || '/home';

    return ctx.redirect(util.format('%s?client_id=%s&redirect_uri=%s&state=%s&response_type=%s',
        path,
        req.body.client_id,
        req.body.redirect_uri,
        req.body.state,
        req.body.response_type));
});

router.post('/aligenie/gateway', async (ctx) => {
    const request = new Request(ctx.request);
    const response = new Response(ctx.response);
    await oauth.authenticate(request, response);
    await gateway.handle(ctx);
});

router.get('/public', async (ctx) => {
    ctx.body = 'Public area';
});

app.use(router.routes());

app.listen(3000);

//localhost:3000/oauth/authorize?client_id=civp5wRqGGL81R33ycml2fV3zhG8UxbQ&state=1234&response_type=code&redirect_uri=http://www.baidu.com/callback
//localhost:3000/token?grant_type=authorization_code&client_id=civp5wRqGGL81R33ycml2fV3zhG8UxbQ&client_secret=FVohvD98bc3bEDAumlBDsmkLNNGZ_YVH&code=XXXXXXXX&redirect_uri=http://www.baidu.com/callback
//localhost:3000/token?grant_type=refresh_token&client_id=civp5wRqGGL81R33ycml2fV3zhG8UxbQ&client_secret=FVohvD98bc3bEDAumlBDsmkLNNGZ_YVH&refresh_token=XXXXXX