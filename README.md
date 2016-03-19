## github-current-user

Get the current GitHub user and verify that they have access to a private key
that's been authorized to that account.

Uses the username in `user.username` or `github.user` or the email address in
`user.email` of the user's `.gitconfig` and the private keys in in the user's
`ssh-agent` with fallback to `~/.ssh/id_rsa` or `~/.ssh/id_dsa`.

If the username is known, you can use `verifyUser` and pass it as the first
argument which bypasses `.gitconfig` lookup work.

### examples

```js
var user = require('github-current-user');

user.verify(function (err, verified, username) {
  // if verified === true, the user has the correct private key or ssh-agent
  // for the username in the `username`
  console.log(verified, username);
});
```

```js
var user = require('github-current-user');

user.verifyUser('beaugunderson', function (err, verified, username) {
  // if verified === true, the user has the correct private key or ssh-agent
  // for the username in the `username`
  console.log(verified, username);
});
```

## test out on the cli

```
$ npm i github-current-user -g
$ github-current-user
You are verified as maxogden

$ github-current-user maxogden
You are verified as maxogden
```
