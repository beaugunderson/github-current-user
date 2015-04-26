'use strict';

var ghsign = require('ghsign');
var gitUserEmail = require('git-user-email');

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

var current = exports.current = function (cb) {
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
