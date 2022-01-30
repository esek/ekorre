-- Configuration for query used to load all meetings with all docs,
-- with minimal information about the files themselves

wrk.method = "POST"
wrk.body = "{\"query\":\"{\\n\\t\\tmeetings {\\n\\t\\t\\tid\\n\\t\\t\\tname\\n\\t\\t\\tnumber\\n\\t\\t\\ttype\\n\\t\\t\\tyear\\n\\t\\t\\tdocuments {\\n\\t\\t\\t\\tid\\n\\t\\t\\t}\\n\\t\\t\\tlateDocuments {\\n\\t\\t\\t\\tid\\n\\t\\t\\t}\\n\\t\\t\\tprotocol {\\n\\t\\t\\t\\tid\\n\\t\\t\\t}\\n\\t\\t\\tsummons {\\n\\t\\t\\t\\tid\\n\\t\\t\\t}\\n\\t\\t\\tappendix {\\n\\t\\t\\t\\tid\\n\\t\\t\\t}\\n\\t\\t}\\n\\t}\\n\"}"
wrk.headers["Content-Type"] = "application/json"