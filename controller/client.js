/*
     A place to take user requests, bring data from the Database and pass it back to the client.
*/

/* used for send mails using smtp*/
var smtpTransport = require('nodemailer-smtp-transport');

/*requiring for routing with request*/
var express = require ( "express" );

/* for connection with database */
var clientAuth = require ("models/client");

/* send mail */
const nodemailer = require('nodemailer');

var url = require('url');

/*creating object for init firebase database*/
var ClientAuth = new clientAuth();

/* it contains email and password of admin, nodemailer use this information for sending mail to the client */
var gmailInformation = require("PRIVATEFILES/nodemailer-config");

gmailInformation.auth.user=Buffer.from(gmailInformation.auth.user, 'base64').toString('ascii');

gmailInformation.auth.pass=Buffer.from(gmailInformation.auth.pass, 'base64').toString('ascii');


var client = {};

var transporter = nodemailer.createTransport(gmailInformation);

var TIMEINTERVAL = 5;// in minute 

var MINUTE = 30;
/*
	purpose : 
		-> this function is for checking queue for every user, It remove the queue of the perticular user, whose ordered product still in the queue,
		-> it refresh after every 5 min.
		-> delete those queue whose last requested time is greater than 30 min.

	input :- none
	output :- delete queue from database 

	dependencies: 
		-> ClientAuth.getPendingQuese
		-> clientAuth.removeQueue
*/

function intervalFunc () 
{
	currentTimeStamp = Date.now();
	
	previousTimeStamp = currentTimeStamp - 1000*60*MINUTE;

	ClientAuth.getPendingQueue(previousTimeStamp, function(queue)
	{
		if(queue)
		{
			for (everyUser in queue)
			{
				if(queue[everyUser].active && queue[everyUser].order)
				{
					ClientAuth.removeQueue(queue [everyUser],everyUser ,function(error , status){
						if(error)
						{
							console.log (error)
							return;
						}			
						console.log(status)
					})

				}
				else
				{
					console.log("queue is expired")
				}
			}	
		}
		else
		{
			console.log ("Queue Refreshed.");
		}
	}) 
}

setInterval(function(){
	intervalFunc();
}, 60000*TIMEINTERVAL);  // setup email data with unicode symbols

ClientAuth.getPendingRequest();


/*
	render home page to the desktop user
*/
client.index = function(request, response)
{
	response.render ( "home-md.ejs" );
	console.log("desktop-view");

}


/*
	render home page to the mobile user
*/

client.indexM = function(request, response)
{
	response.render("home-xs.ejs");
}


/*
	render login page to client/admin
*/

client.home = function (request, response)
{
	response.render("login.ejs");
}

/*
	when user is created by admin,  then a mail is send to client. In mail a link is send to the user for updating his password.
	when user click on this link a request is generated , then this function is  called.
	this function is called for rendering set user password page.
	
	this function check the validation of the user, It allow user to  click only one time. if user already click on this , it show link expire. 

*/

client.setPassword=function (request, response)
{

	var url_parts = url.parse(request.url, true);
	var uid = request.query.u;
	
	if(uid)
	{
		ClientAuth.checkRegisterStatus(uid, function(email)
		{
			if(email){
				response.render("setPassword.ejs", {email : email, uid : uid});
			}
			else {
				response.send("link expird")
			}
		})
	}
	else
		response.send("link expird")
}

/*
	-> for updating user password.
	-> send confirm mail to the user
*/

client.activateUser=function (request, response)
{
	extractObject(request, function (user)
	{
		if(user.uid && user.email){
			ClientAuth.sendVerification (user.uid, user.password, function (error, data){
				if(error)
				{
					response.status(400).send()
					return;
				}
				response.status(200);
				response.send();
				sendMailTo(user.email, data.displayName)
			})
		}
		else{
			response.status(400).send()
		}
	})
}

/*
	when user do a post request using java script, it extract object from that post request;
*/
function extractObject (request, callback)
{
	var body = "";
	var post = "";
	 request.on('data', function (data) {
            body += data;
      });

     request.on('end', function () {
            post = JSON.parse(body);
              callback (post)

      });
   
}
/*
	send mail to the user
*/

function sendMailTo(userEmail, userName)
{
	 var mailOptions = {
		from: '"D 👻" <devprasan4@gmail.com>',
		to: userEmail, 
		subject: 'Order  ✔', 
		text: 'Hello world ?'  
	};

	mailOptions.html = setPasswordMailBodyFor(userName);

	transporter.sendMail(mailOptions, (error, inf) => {
	    if (error) 
	    {
	        return console.log(error);
	    }
	    console.log('Message %s sent: %s', inf.messageId, inf.response);
	});
}

/*
	make email body for user.
*/
function setPasswordMailBodyFor(username)
{
	var bodyContent  = "Hi "+ username +"<br>";
	bodyContent += "Your password is set on Web-portal <br> Now you can buy product  <a href = 'localhost:5000'>web-Portal</a>";
	return bodyContent;
}

module.exports = client;
