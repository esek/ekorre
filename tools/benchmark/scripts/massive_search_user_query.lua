-- Configuration for highly inneficient query searching all users
-- containing "-s" and getting pretty much all their information,
-- including duplicate information about post history

wrk.method = "POST"
wrk.body = "{\"query\":\"{ searchUser(search: \\\"-s\\\") { username firstName lastName photoUrl email phone address zipCode website class posts { postname utskott postType spots description active access { web { slug name description resourceType } doors { slug name description resourceType } } interviewRequired history { postname holder { username } start end } } userPostHistory { start end post { postname utskott postType spots description active access { web { slug name description resourceType } doors { slug name description resourceType } } interviewRequired history { postname holder { username } start end } } } access { web { slug name description resourceType } doors { slug name description resourceType } } isFuncUser } }\"}"
wrk.headers['Content-Type'] = 'application/json'