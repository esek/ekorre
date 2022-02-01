-- Simple configuration for getting information and post history
-- for user `aa0000bb-s`

wrk.method = 'POST'
wrk.body = "{\"query\":\"{ user(username: \\\"aa0000bb-s\\\") { username firstName lastName photoUrl email phone zipCode website address class posts {postname, history {holder {username}}} userPostHistory { post {postname, history {holder {username}}} } } }\"}"
wrk.headers['Content-Type'] = 'application/json'