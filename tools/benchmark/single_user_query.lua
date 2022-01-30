-- Simple configuration for getting information and post history
-- for user `aa0000bb-s`

wrk.method = 'POST'
wrk.body = "{\"query\":\"{\\n\\tuser(username: \\\"aa0000bb-s\\\") {\\n    username\\n    firstName\\n    lastName\\n    photoUrl\\n    email\\n    phone\\n    zipCode\\n    website\\n    address\\n    class\\n    posts {postname, history {holder {username}}}\\n    userPostHistory {\\n      post {postname, history {holder {username}}}\\n    }\\n  }\\n}\"}"
wrk.headers['Content-Type'] = 'application/json'