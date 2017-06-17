/*
	Routing refers to determining how an application responds to a client request to a particular endpoint,
	which is a path and a specific HTTP request method (GET or POST).

	Purpose:-
		-> for separating client request and admin request
		-> if client do a request, then according to path , it render  page.
		-> it use body parser module for extracting FORM tag data.
*/

var express = require ("express");

var bodyParser = require("body-parser");

var client = require( "controller/client" )

var app = express ();

var router  = express.Router ();

router.get( '/', client.home);

router.get("/home", client.index);

router.get("/home-m", client.indexM)

router.get("/setPassword", client.setPassword);

router.post("/setPassword", bodyParser.urlencoded ({extended : false}), client.activateUser);

module.exports = router;
     