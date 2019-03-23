const low = require('lowdb');
const srs = require('secure-random-string');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

function InMemoryCache() {
  db.defaults({
      uid: 0,
      clients: [],
      users: [],
      authCodes: [],
      tokens: []
    })
    .write();
}



InMemoryCache.prototype.generateClient = function() {
  db.get('clients').push({
    clientId: srs(),
    clientSecret: srs(),
    "grants":["authorization_code","refresh_token"],
    redirectUris: ['']
  }).write();
}

InMemoryCache.prototype.addUser = function(user) {
  db.get('users').push({
    id: srs(),
    username: user.username,
    password: user.password
  }).write();
}

InMemoryCache.prototype.dump = function() {
  console.log('clients', this.clients);
  console.log('tokens', this.tokens);
  console.log('users', this.users);
};

/*
 * Get access token.
 */

InMemoryCache.prototype.getAccessToken = async function(bearerToken) {
  return db.get('tokens')
    .find({
      accessToken: bearerToken
    })
    .value();
};

/**
 * Get refresh token.
 */

InMemoryCache.prototype.getRefreshToken = async function(bearerToken) {
  return db.get('tokens')
    .find({
      refreshToken: bearerToken
    })
    .value();
};

/**
 * Get client.
 */

InMemoryCache.prototype.getClient = async function(clientId, clientSecret) {
  return db.get('clients')
    .find({
      clientId: clientId
    })
    .value();
};

InMemoryCache.prototype.getAuthorizationCode = async function getAuthorizationCode(authorizationCode) {
  return db.get('authCodes')
    .find({
      authorizationCode: authorizationCode
    })
    .value();
}

InMemoryCache.prototype.saveAuthorizationCode = async function(code, client, user) {
  let authCode = {
    authorizationCode: code.authorizationCode,
    expires_at: code.expiresAt,
    redirect_uri: code.redirectUri,
    scope: code.scope,
    client_id: client.id,
    user_id: user.id
  };
  db.get('authCodes').push(authCode).write();
  return authCode;
}


InMemoryCache.prototype.saveToken = async function(token, client, user) {
  db.get('tokens').push({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    userId: user.id
  }).write();
};

/*
 * Get user.
 */

InMemoryCache.prototype.getUser = async function(username, password) {
  return db.get('users')
    .find({
      username: username,
      password: password
    })
    .value();
};

/**
 * Export constructor.
 */

module.exports = InMemoryCache;