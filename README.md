## **How to Use**. ##

* git clone 

* npm install

* Run server as `node app`

* Open browser at `localhost:5000`

## **About E-commerce-Web-Portal-NodeJs-Firebase**. ##

It is an e-commerce website can be used by a shopkeeper for a particular community.It used the realtime database.

**Functionality**
* client can be decreased and increase in quantity.

* once a quantity is selected it remains in queue(means it booked) until it not ordered/removed.

* on increase  in quantity it also check for stock, if stock not available then alert it to user.

* client can also change the quantity on order table.

* client can check order history.

* also functionality of forget password, a confirmation mail is sent to client mail.

* It uses the firebase database.




**FRONT END***

###Login pages###
This HTML page contain three div tag. one for showing login page, second for registration page and third for forget password. Only one Div is display at a time according to the click event and Other  two are hidden.

*Login*
-------
first of all it contain two input field (for e-mail and password) and one submit button. Client fill this information and click login submit button.

When we click on the login button.then javaScript file check the email and password is in well formatted or not. If both are not in well format then browser show an error massage. Else it send request to the server(Node.js) and Response back to the client. If user is registered and password is correct, server redirect the user to Home page.
else if user is not registered server show error massage.

*Registration Page* 
--------------------
It also contain five input field (for user details) and one submit button. Client fill this information and click login submit button.

When we click on the registration page button.then javaScript file check all information field by user is correct. If all information is not in well format then browser show an error massage. Else it send request to the server(Node.js) and check the Email is in already exist or not. If user is already registered then server send error message,else it create account for user. and redirect to to login page.

Forget-password Page
--------------------

Same functionality as the login page, except there user only enter here email address, and send request to the server using form tag. if user is registered. It send mail to the user, and there user can update here password.  



Home Page
--------------------
 It contained 4 division apart from header and footer.

  1. Product Table.

     It contains all product categorised based on their category( different table contains different category's products).

  2. Order Table.

     It contained that items which were selected to buy.

  3. Order History Table

     It contains history of order which were place by the user.

  4. Loader/Spinner

    It used to show that data is loading


Only one division display at a time.




### Back-end Design using Node.js ###

*  Why used 
*  Security
*  Fast
##Architecture ##

we design this app using three layer architecture (MVC) concept, which make our website very flexible, modular as well as fast. it has three level:
M is for model. A place to define data structures and methods to interact with your data store.

V is for view. A place to manage everything the end user sees on his or her screen.

C is for controller. A place to take user requests, bring data from the model and pass it back to the view.

in our project we make folder for MVC, Which every folder contain file for client and in future we can add new file of admin without changing any other files.
So lets be start project description.
structure of file system

```
/public
    /assets
       /js
       /css

/views
    /home.ejs
    /login.ejs
    /productTable
    /orderHistoryTable

/routes
    /client.js

/controller 
    /client.js

/model
    /index.js
/app.js
/package.json

```


###Controller/client.js###


The Controller will render information to the screen. Essentially, the view is a class which sends a response to the browser. Express provides a short way to do this:

```
res.render('index', { title: 'Express' });
```

The response object is a wrapper, which has a nice API, making our life easier. However, I'd prefer to create a module which will encapsulate this functionality. The default views directory will be changed to templates and a new one will be created, which will host the Base view class. this file contain function like login , logout, register, home, updatePassword , getCategory, Setcategory. this function used the data from the client and send to models and models process with this and return to controller, and controller render the pages to the client.


###models/client.js###


The model is what will be handling the data that's in our application. It should have access to a datbase object, returned by firebase . Our model should also have a method for extending it, because we may want to create different types of models.
this file contain function like CreateUserWithEmailAndPassword, SignIn, getCategories , setCategory, fetchUser, createUser, sendVerification, logout etc. and also contain configuration file used by to connect with firebase.