/*
	models:  A place to define data structures and methods to interact with your data store.
		controller request to model files. And according to request it return data.
*/

var express = require ( "express" ),

	firebase = require('firebase');

	require('firebase/auth');

	require ("firebase/database");
 
 /* used for send mails using smtp*/

var smtpTransport = require('nodemailer-smtp-transport');


/* send mail */

const nodemailer = require('nodemailer');


/* it contains email and password of admin, nodemailer use this information for sending mail to the client */
var gmailInformation = require("PRIVATEFILES/nodemailer-config")

var transporter = nodemailer.createTransport(gmailInformation);


/*
	For intraction with firebase
*/

var admin = require("firebase-admin");

/*
	it contains secret key, for reading and writing  database
*/

var serviceAccount = require("PRIVATEFILES/coveda-coop-firebase-adminsdk-aym8e-f15f6344df.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://coveda-coop.firebaseio.com"
});

var DELIMITER = "♥"

var dataRef = admin.database().ref();

var clientAuth = function clientAuth(){};

/*
	User Verification:-
		when user is request for set password, this function check user is activate or not.
		if user is exist and not active it return true,
		alse it return false.
*/

clientAuth.prototype.checkRegisterStatus = function(uid , done)
{

	var userRef = dataRef.child("users/"+uid)
	userRef.once("value", function(user){
		var userVal = user.val()
		if(userVal && userVal.active == false)
		{
			var obj = {};
			obj["active"] = true
			userRef.update(obj)
			.then(status =>{
				console.log("in update")
				console.log (userVal.email)
				done(userVal.email)
			})
			.catch(error=>{
				done(false)
			})

		}
		else{
			console.log ("in checkRegisterStatus false")
			done(false)
		}
	})
}

/*
	update password and store in database.
	Input :- userId, 
			new password,
	output :- return callback of successfull operation/error.
*/
clientAuth.prototype.sendVerification = function(uid, password , done)
{
	if(uid && password){

	  admin.auth().updateUser(uid, {
	 	 	emailVerified: true,
	 		 password: password
		})
	  .then(function(userRecord) {
	  	
	  		done(null, userRecord.toJSON())		
	  	
	    
	  })
	  .catch(function(error) {
	  	done(error)
	    	console.log("Error updating user:", error);
	  });
	}
	else{
		done("something is missing")
	}
}

/*
	When server remove queue from database, before this increase the stock quantity of the product.
	this function is used todo this task.
	
	Input :- info object contain : productId,
			 value
	output :- return Promise.
	
	Dependencies :- It use Transaction function to increase or decrease quantity of product. 
*/

clientAuth.prototype.addQueueQuantityToStock = function(info, value) {

	return new Promise (function (resolve, reject)
	{
		var dbItemRef=dataRef.child('product/').child( info.productId).child("inStock");
   		dbItemRef.transaction(function(inStock) 
   		{
			if(inStock != null)
			{
		    		inStock = (inStock*1000 + value*1000)/1000; 
		      		resolve(inStock)
			}
			return inStock;    
	   	});
	})
};

/*
	this function is used to remove the queue of the single user, and update original product quantity from the database.
	
	Input :- UserId,
			userQueue,
	Output :- return callback.
	
	Dependencies :- 
				addQueueQuantityToStock(),
				remove();
			
*/
clientAuth.prototype.removeQueue = function (user,key,done)
{
	var length = Object.keys(user.order).length;
	var i = 0;
	console.log(key)
	for(everyProduct in user.order)
	{
		var array= everyProduct.split(DELIMITER);

		var stock = user.order[everyProduct].quantity*user.order[everyProduct].packaging
		console.log(stock);
		this.addQueueQuantityToStock({productId : array[0]}, stock )
		.then( a=>{
			i++;
			if(length == i)
			{
				dataRef.child("queue/"+key+"/active").set(false);
					done(null, "done")
			}
		})
		.catch(error=>{
			done (error);
		})	
	}

}

/*
	get pending queue from the database, whose last request time is greater than 30 min.
	Input : oldtime : before 30 min from now
	Output : return callback, It contain queues of user.
	
*/

clientAuth.prototype.getPendingQueue = function(oldTime, done)
{	
	var queueRef = dataRef.child("queue").orderByChild("lastRequestTime").startAt(-oldTime)

	queueRef.once("value", function(queueValue)
	{
		done(queueValue.val())
	})
}

/*
	send mail to the user, when user buy product , and also send mail when admin confirm those product for delivery.
	
	It used Child_added event for sending mail to the user, if any messege is detect on the firebase, it pick that messege and send to the user,
*/

clientAuth.prototype.getPendingRequest = function()
{
	var msgRef = dataRef.child("pendingEmail")
	msgRef.on("child_added", function(snap){
		var emailInfo = snap.val()
	var mailOptions = {
			from: 'Gurjinder Singh',
			to: emailInfo.email, 
			subject: 'Coveda-Team Order  ✔', 
			text: 'Hello world ?'  
		};

		mailOptions.html = emailInfo.body

		transporter.sendMail(mailOptions, (error, inf) => {
		    if (error) 
		    {
		        return console.log(error);
		    }
		    msgRef.child(snap.key).remove()
		    console.log('Message %s sent: %s', inf.messageId, inf.response);
		});


	})
}

module.exports = clientAuth;