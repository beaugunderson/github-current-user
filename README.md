## github-current-user

Get the current GitHub user and verify that they have access to a private key
that's been authorized to that account.

Uses the email address stored in `user.email` of the user's `.gitconfig` and
the private keys in in the user's `ssh-agent` with fallback to `~/.ssh/id_rsa`
or `~/.ssh/id_dsa`.

### example

```js
var user = require('github-current-user');

user.verify(function (err, verified, username) {
  // if verified === true, the user has the correct private key or ssh-agent
  // for the username in the `username`
});
```
