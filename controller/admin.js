var express = require ( "express" );

var adminAuth = require ("models/admin");

var url = require('url');

const nodemailer = require('nodemailer');

var gmailInformation = require("PRIVATEFILES/nodemailer-config");

gmailInformation.auth.user=Buffer.from(gmailInformation.auth.user, 'base64').toString('ascii');

gmailInformation.auth.pass=Buffer.from(gmailInformation.auth.pass, 'base64').toString('ascii');

var transporter = nodemailer.createTransport(gmailInformation);

var adminAuth = new adminAuth();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var admin = {};

admin.constructor = function(){};

/*
	render adminhome page when admin send request to the server.
*/

admin.home = function(request, response)
{
	response.render ( "admin/home.ejs")
}

/*
	Create User:
		-> admin send data to the server, then server create account for user, add into the authetication table of the firebase.
		-> and also add into database of firebase.
		-> if user is already exist/ invalid-email, it send error code to the admin.
		-> after creating user, it send mail to the user.  	
*/


admin.createUser = function(request, response)
{
	extractObject(request, function(user)
	{
		
		adminAuth.createUser(user, function(error , userRecord, pwd)
		{
			var errorType = {};

			if(error)
			{
				switch (error.errorInfo.code)
				{
					case 'auth/invalid-email': errorType.code = 1;
											   errorType.description = "invalid-email"
				
					case "auth/email-already-exists":errorType.code = 2;
												     errorType.description = "email-already-exists";
				}
				console.log (errorType)
				response.status(400).send(JSON.stringify( errorType ))
				return
			}
			
			console.log(userRecord)

			response.status(200).send(JSON.stringify( userRecord ))
			var mailOptions = {
		    			from: '"D 👻" <devprasan4@.com>',
			    		to: userRecord.email, 
		    			subject: 'Web-Portal-Registration ✔', 
		    			text: 'Hello world ?',  
					};
			mailOptions.html = "<B> Hi "+ userRecord.displayName+"</b><br><br>You are registered to D community.</b>To activate your account click on <a href='localhost:5000/setPassword?u="+ userRecord.uid+ "' >Set Password</a>";
			
			
			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) 
			    {
			        return console.log(error);
			    }
			    console.log('Message %s sent: %s', info.messageId, info.response);
			});
		})

	})
}

/*
	for deleting user.
		-> It remove data from both table of firebase i.e. authetication table and database table.
*/
admin.deleteUser = function(request, response)
{
	extractObject(request, function(user)
	{
		adminAuth.deleteUser(user.uid, function(error, status)
		{
			if(error)
			{
				response.status(400).send (JSON.stringify(error))
			}
			else{
				response.status(200).send();
			}
		})
	})
}
/*
	for updating user infomation :
		it accept input :-> uid of the user,
				-> updating information : - name, mobile number
*/

admin.updateUserDetail = function (request, response){		
	extractObject(request, function(details){
		console.log (details)
			
		var updateDetails = {};
		if(details.uid)
		{

			updateDetails.uid = details.uid;

			if(details.name)
			{
				updateDetails.name = details.name; 
			}
			
			if(details.mobile)
			{
				updateDetails.mobile = details.mobile;
			}

			console.log (updateDetails)
			adminAuth.updateUser (updateDetails, function (error, status){
				if(error)
				{
					response.status(400).send(JSON.stringify ({error : error}));
				}
				else
				{
					response.status(200).send();
				}
			})
		
		}
		else {
			response.status(400).send(JSON.stringify ({error : "pass some information to update"}));
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


module.exports = admin;
