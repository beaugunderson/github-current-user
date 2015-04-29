'use strict';

var debug = require('debug')('github-current-user');
var ghsign = require('ghsign');
var gitConfig = require('git-config-path');
var parse = require('parse-git-config');

var request = require('request').defaults({
  headers: {
    'User-Agent': 'github-current-user'
  }
});

var BASE_URL = 'https://api.github.com';
var VERIFICATION_STRING = 'my voice is my passport';

function userFromEmail(email, cb) {
  var url = BASE_URL + '/search/users';

  debug('GET', url);

  request.get({
    url: url,
    json: true,
    qs: {
      q: email
    }
  }, function (err, response, body) {
    if (err || !body.items || !body.items.length) {
      return cb(err);
    }

    cb(null, body.items[0]);
  });
}

function userFromUsername(username, cb) {
  var url = BASE_URL + '/users/' + username;

  debug('GET', url);

  request.get({
    url: url,
    json: true
  }, function (err, response, body) {
    if (err) {
      return cb(err);
    }

    cb(null, body);
  });
}

var current = exports.current = function (cb) {
  var config = parse.sync({cwd: '/', path: gitConfig});

  var username = config && config.user && config.user.username;
  if (username) {
    debug('username from .gitconfig', username);
    return userFromUsername(username, cb);
  }

  var email = config && config.user && config.user.email;
  if (email) {
    debug('email from .gitconfig', email);
    return userFromEmail(email, cb);
  }

  debug('missing info in .gitconfig, or no .gitconfig');
  process.nextTick(function () {
    cb(new Error('missing info in .gitconfig, or no .gitconfig'));
  });
};

exports.verify = function (cb) {
  current(function (err, user) {
    if (err || !user) {
      return cb(err);
    }
    verifyUser(user.login, cb);
  });
};

exports.verifyUser = verifyUser;

function verifyUser(login, cb) {
  var sign = ghsign.signer(login);
  var verify = ghsign.verifier(login);

  debug('signing with', login);

  sign(VERIFICATION_STRING, function (signError, signature) {
    if (signError) {
      return cb(signError);
    }

    debug('verifying with', login);

    verify(VERIFICATION_STRING, signature, function (verifyError, valid) {
      debug('valid', valid, 'username', login);

      cb(verifyError, valid, login);
    });
  });
}
