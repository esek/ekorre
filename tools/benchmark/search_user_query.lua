-- Simple wrk configuration script to send high amounts of search requests
-- to the ekorre API, geting username, firstName, lastName and class.
--
-- Search string is `"-s"`, i.e. ending of STiL-ID

wrk.method = "POST"
wrk.body = "{\"query\":\"{ searchUser(search: \\\"-s\\\") { username firstName lastName class } }\"}"
wrk.headers["Content-Type"] = "application/json"