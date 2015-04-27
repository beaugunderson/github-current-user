'use strict';

var debug = require('debug')('github-current-user');
var ghsign = require('ghsign');
var gitUserEmail = require('git-user-email');
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

function usernameFromConfig() {
  var config = parse.sync({cwd: '/', path: gitConfig});

  if (config && config.user) {
    debug('username from .gitconfig', config.user.username);

    return config.user.username;
  }

  debug('no username in .gitconfig');
}

var current = exports.current = function (cb) {
  var username = usernameFromConfig();

  if (username) {
    return userFromUsername(username, cb);
  }

  userFromEmail(gitUserEmail(), cb);
};

exports.verify = function (cb) {
  current(function (err, user) {
    if (err || !user) {
      return cb(err);
    }

    var sign = ghsign.signer(user.login);
    var verify = ghsign.verifier(user.login);

    debug('signing with', user.login);

    sign(VERIFICATION_STRING, function (signError, signature) {
      if (signError) {
        return cb(signError);
      }

      debug('verifying with', user.login);

      verify(VERIFICATION_STRING, signature, function (verifyError, valid) {
        debug('valid', valid, 'username', user.login);

        cb(verifyError, valid, user.login);
      });
    });
  });
};
