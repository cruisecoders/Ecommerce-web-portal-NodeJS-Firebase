/* 
A place to define data structures and methods to interact with your data store.
*/
    var express = require ( "express" ),
	
	firebaseAdmin = require('firebase');

	require('firebase/auth');

	require ("firebase/database");

var fs = require ("file-system")

var config = {
    apiKey: "AIzaSyBmLqleCRdx2FryYwe7B0kCqihDxwv2W1I",
    authDomain: "coveda-coop.firebaseapp.com",
    databaseURL: "https://coveda-coop.firebaseio.com",
    storageBucket: "coveda-coop.appspot.com",
    messagingSenderId: "231200290278"
};

var admin = require("firebase-admin");


var serviceAccount = require("PRIVATEFILES/coveda-coop-firebase-adminsdk-aym8e-f15f6344df.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://coveda-coop.firebaseio.com"
}, "secondary");

var app = firebaseAdmin.initializeApp(config, "Secondary") ;

var dataRef = admin.database().ref();

var AdminAuth = function AdminAuth(){};


/*
	purpose: create user and send confirmation callback to the admin for updating database.
	this function take input from controller , this inputs are username, email , mobile number.
	output:-> callback to the controller admin.js for adding new user in database.
	
	Input :- user information, send by admin.
	output :- return callback of successfully created user.
	
	Dependencies:- admin.auth().createUser(),
				   admin.database().update()
*/

AdminAuth.prototype.createUser = function(user, done)
{
	var pass = createPassword();
	
	admin.auth().createUser({
	  email: user.email,
	  emailVerified: false,
	  password: pass,
	  displayName: user.firstName +" "+ user.lastName
	})
  	.then(function(userRecord) 
  	{

  		var clientRef = dataRef.child("users/"+userRecord.uid);
  		
  		var userRcrd = {
  			name : userRecord.displayName,
  			email: userRecord.email,
  			type : "client",
  			date: Date.now(),
  			mobileNumber : user.mobile,
  			active : false
  			//postalAddress : user.postalAddress,
  			//zipCode : user.zipCode
  		}
  	//	console.log(userRcrd)
 

  		clientRef.update(userRcrd)
  		
  		.then(status=>{
		   	 done(null, userRecord, pass)
			console.log("Successfully created new user:", userRecord.uid);
  		})

 	})
 	

  	.catch(function(error)
  	{
    	console.log("Error creating new user:", error);
    	done(error)
  	});
}

/*
	this function update user information,
	input:-> object of details
			object contains:- mobile number, name
*/

AdminAuth.prototype.updateUser = function(details, done)
{
	console.log ("dsdsds")
	if(details.name){

	  admin.auth().updateUser(details.uid, {
	 	 	displayName: details.name,
		})
	  .then (function()  {
	  	var obj = {
	  		name : details.name,
	  	}
	  	if(details.mobile)
	  		obj.mobileNumber = details.mobile;
	  	console.log (obj)
	  	return dataRef.child("users/"+details.uid).update(obj);
	  })
	  .then(function() {
	    done(null, "user-date-is-update")
	    console.log("Successfully updated user");
	  })
	  .catch(function(error) {
	  	done(error)
	    console.log("Error updating user:", error);
	  });
	}
	else
	{	  			
		dataRef.child("users/"+details.uid + "/mobileNumber").set(details.mobile)
		
		  .then(function(userRecord) {
		    done(null, "user-date-is-update")
		    console.log("Successfully updated user");
		  })
		  .catch(function(error) {
		  	done(error)
		    console.log("Error updating user:", error);
		  });
	}
}

/*
	it delete user from database,
	it accept  uid of the user as input,
	it return callback to the controller for deleted user.
*/

AdminAuth.prototype.deleteUser = function(uid, done)
{
	if(uid)
	{
		console.log(uid)
		admin.auth().deleteUser(uid)
		.then(function(Success){
			dataRef.child("users/"+uid).remove();
			done(null, "Successfully user deleted")
		})
		.catch(function(loss){
			done(loss)
		})
	}
	else{
		console.log ("okk")
		done("uid not defined")
	}
}

/*
	creating randomly generated password for user.
*/
function createPassword()
{
	var password = Date.now();
	//console.log (password)
	//var pass = fold(password);
	return password+"";
}
var adminObj = new AdminAuth();

module.exports = AdminAuth;

/*
AdminAuth.prototype.uploadPhoto = function (data)
{
	return new Promise(function(resolve, reject)
	{
		 var options = {
		 			destination: data.path,
					metadata: {
							    contentType: 'image/png'
							  }
				};
		//		console.log (data)

     		var backups = gcs.bucket("coveda-24.appspot.com");
 
			backups.upload(data.path, options, function(err, file) {
				fs.unlink(data.path, (error) => {
				  	if (error|| err)
				  	{
				  		reject (error||err);
				  		return;
				  	}	
				  	backups.file(data.path).getSignedUrl({
					  action: 'read',
					  expires: '03-17-2025'
					}, function(err1, url) {
					  if (err1) {
					    reject(err1);
					    return;
					  }
					  resolve(url)
					 })
				  })
			})
	})
}

*/
