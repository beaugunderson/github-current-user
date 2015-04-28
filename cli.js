#!/usr/bin/env node

var user = require('./')

if(process.argv[2]) {
  user.verifyUser(process.argv[2], output)
} else {
  user.verify(output)
}

function output (err, verified, username) {
  if (verified) console.log('You are verified as', username)
  else console.log('Could not verify you', err)
}