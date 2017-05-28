var Git = require("nodegit");
var linkProvider = require('./link-provider');
var fs = require('fs');
var Repository = Git.Repository;
var Status = Git.Status;
var Reset = Git.Reset;
var Commit = Git.Commit;
var Checkout = Git.Checkout;
var Remote = Git.Remote;
var path = require("path");
var pathToRepo = path.resolve("../otmf-web-owner");
var home = require('os').homedir();
var pathToPublicKey = `${home}/.ssh/id_rsa.pub`;
var pathToPrivateKey = `${home}/.ssh/id_rsa`;
var fileName = 'package.json'
var packageJson = require(`${pathToRepo}/${fileName}`);
var ora = require('ora');

packageJson.dependencies['otmf-sdk'] = linkProvider.provideHerokuLink(packageJson.dependencies['otmf-sdk']);
fs.writeFileSync(`${pathToRepo}/${fileName}`, JSON.stringify(packageJson, null, 4));


var repo, index, oid, currentHeadCommit, spinner;
Repository.open(pathToRepo)
    .then(function(repoResult) {
        repo = repoResult;
        return repo.refreshIndex();
    })
    .then(function(indexResult) {
        index = indexResult;
    })
    .then(function() {
        return repo.getHeadCommit()
    })
    .then(function(commit) {
        currentHeadCommit = commit;
    })
    .then(function() {
        return index.addByPath(fileName);
    })
    .then(function() {
        return index.write();
    })
    .then(function() {
        return index.writeTree();
    })
    .then(function(oid) {
        var signature = repo.defaultSignature();
        return repo.createCommitOnHead([fileName], signature, signature, "HEROKU DEPLOY");
    })
    .then(function() {
        return Remote.lookup(repo, "heroku")
    })
    .then(function(remote) {
        spinner = ora('Pushing to heroku.').start();
        return remote.push(["+refs/heads/master:refs/heads/master"], {
            callbacks: {
                certificateCheck: function() {
                    return 1;
                },
                credentials: function(url, userName) {
                    return Git.Cred.sshKeyNew('git', pathToPublicKey, pathToPrivateKey, '');
                }
            }
        });
    })
    .then(function() {
        return Reset.reset(repo, currentHeadCommit, 3, {}, "head");
    })
    .catch(function(reason) {
        spinner.fail(reason)
    })
    .done(function() {
        spinner.succeed('Done!')
    });
