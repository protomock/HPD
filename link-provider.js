module.exports = {
    provideHerokuLink: function(current) {
        var params = current.match(/[^:$\/]+/g);
        return `git+https://${process.env.PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/${params[1]}/${params[2]}`
    }
}
