'use strict';

var debug = require('debug')('github-current-user');
var ghsign = require('ghsign');
var gitConfig = require('git-config-path');
var githubUsername = require('github-username');
var parse = require('parse-git-config');

var VERIFICATION_STRING = 'my voice is my passport';

var current = exports.current = function (cb) {
  var config = parse.sync({cwd: '/', path: gitConfig});

  var username = config && ((config.user && config.user.username) ||
                            (config.github && config.github.user));
  if (username) {
    debug('username from .gitconfig: %s', username);
    return cb(null, username);
  }

  var email = config && config.user && config.user.email;
  if (email) {
    debug('email from .gitconfig: %s', email);
    return githubUsername(email, cb);
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
