'use strict';

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
  request.get({
    url: BASE_URL + '/search/users',
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
  request.get({
    url: BASE_URL + '/users/' + username,
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
    return config.user.username;
  }
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

    sign(VERIFICATION_STRING, function (signError, signature) {
      if (signError) {
        return cb(signError);
      }

      verify(VERIFICATION_STRING, signature, function (verifyError, valid) {
        cb(verifyError, valid, user.login);
      });
    });
  });
};
