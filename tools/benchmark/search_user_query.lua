-- Simple wrk configuration script to send high amounts of search requests
-- to the ekorre API, geting username, firstName, lastName and class.
--
-- Search string is `"-s"`, i.e. ending of STiL-ID

wrk.method = "POST"
wrk.body = "{\"query\":\"{\\n\\tsearchUser(search: \\\"-s\\\") {\\n    username\\n    firstName\\n    lastName\\n    class\\n  }\\n}\"}"
wrk.headers["Content-Type"] = "application/json"