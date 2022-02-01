-- Script for a large election query, which will put high strain
-- on the ekorre API

wrk.method = "POST"
wrk.body = '{"query":"{ openElection { id nominationsHidden acceptedNominations { user { firstName lastName username class } post { postname utskott } } } latestElections { id open nominationsHidden acceptedNominations { user { firstName lastName username class } post { postname utskott } } creator { username firstName lastName photoUrl } openedAt closedAt open } } "}'
wrk.headers["Content-Type"] = "application/json"