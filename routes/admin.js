/*
	Routing refers to determining how an application responds to a client request to a particular endpoint,
	which is a path and a specific HTTP request method (GET or POST).

	Purpose:-
		-> for separating client request and admin request
		-> if admin do a request, then according to path , it render  page.
*/

var express = require ("express");

var bodyParser = require("body-parser");

var admin = require( "controller/admin" )

var multer = require ("multer");

var app = express ();

var router  = express.Router ();

router.get( '/', admin.home);

router.post("/addUser" , admin.createUser);

router.post("/updateUserDetails" , admin.updateUserDetail);

router.post("/deleteUser", admin.deleteUser)

module.exports = router;
