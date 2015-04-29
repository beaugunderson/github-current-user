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

  debug('→ GET %s', url);

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

    cb(null, body.items[0].login);
  });
}

var current = exports.current = function (cb) {
  var config = parse.sync({cwd: '/', path: gitConfig});

  var username = config && config.user && config.user.username;
  if (username) {
    debug('username from .gitconfig: %s', username);
    return cb(null, username);
  }

  var email = config && config.user && config.user.email;
  if (email) {
    debug('email from .gitconfig: %s', email);
    return userFromEmail(email, cb);
  }

  debug('missing info in .gitconfig, or no .gitconfig');
  process.nextTick(function () {
    cb(new Error('missing info in .gitconfig, or no .gitconfig'));
  });
};

var verifyUser = exports.verifyUser = function (username, cb) {
  var sign = ghsign.signer(username);
  var verify = ghsign.verifier(username);

  debug('signing with "%s"', username);

  sign(VERIFICATION_STRING, function (signError, signature) {
    if (signError) {
      return cb(signError);
    }

    debug('verifying with "%s"', username);

    verify(VERIFICATION_STRING, signature, function (verifyError, valid) {
      debug('valid: %s, username: %s', valid, username);

      cb(verifyError, valid, username);
    });
  });
};

exports.verify = function (cb) {
  current(function (err, username) {
    if (err || !username) {
      return cb(err);
    }

    verifyUser(username, cb);
  });
};
