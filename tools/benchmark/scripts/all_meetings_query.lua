-- Configuration for query used to load all meetings with all docs,
-- with minimal information about the files themselves

wrk.method = "POST"
wrk.body = "{\"query\":\"{meetings { id name number type year documents { id } lateDocuments { id } protocol { id } summons { id } agenda {id} appendix { id } } }\"}"
wrk.headers["Content-Type"] = "application/json"