#!/usr/bin/env node

var user = require('./')

user.verify(function (err, verified, username) {
  if (verified) console.log('You are verified as', username)
  else console.log('Could not verify you', err)
})
