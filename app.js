/*
	app.js :- server file. which is directly intract to the client.
*/

require ('app-module-path').addPath (__dirname );

var express = require ( "express" ),
	
	path = require ( "path" ),

	bodyParser = require("body-parser");

var expressSession = require("express-session")

var client = require("routes/client");

var admin = require("routes/admin")

var	app = new express ();

app.set ("port" , ( process.env.PORT || 5000 ) );

app.set("view engine", "ejs");

app.set("views" , path.join ( __dirname, 'pages' ));

app.use (express.static (path.join (__dirname,'public')));

app.use (expressSession({secret: "shhhhhhhhhhhhhhhhhhhhh", saveUninitialized : true, resave : true}));

app.use ("/", client)

app.use ("/adminHome", admin);

app.listen (app.get("port"), function(){
	
	console.log ("listen on "+ app.get ("port"))

});