var config = {
    apiKey: "AIzaSyBmLqleCRdx2FryYwe7B0kCqihDxwv2W1I",
    authDomain: "coveda-coop.firebaseapp.com",
    databaseURL: "https://coveda-coop.firebaseio.com",
    storageBucket: "coveda-coop.appspot.com",
    messagingSenderId: "231200290278"
};


firebase.initializeApp(config);


function FirebaseApp()
{
  var self = this;

  self.checkUserState();

  this.login = function (email, password)
  {
    var spinner=document.getElementById("loader");
    spinner.removeAttribute("hidden");
    return firebase.auth().signInWithEmailAndPassword (email, password )
  }


  this.checkAdmin = function(uid, done )
  {
    var ref = firebase.database().ref("/admin/"+uid);
    
    ref.once("value")
    .then(function(snapshot) {
     // console.log("d")
        done ( snapshot.val() )
    });
  }

  this.sendVerification = function (email)
  {
    console.log (email);
    return firebase.auth().sendPasswordResetEmail(email);
  }
}

FirebaseApp.prototype.checkUserState = function()
{
  var self = this;

  firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
      self.checkAdmin(user.uid, admin=>{
        if(admin)
        {
          
            localStorage["firebaseAuth:"+user.uid]  = "plmoknijb"
            location.href = "/adminHome"
        }
        else
        {
            localStorage["firebaseAuth:"+user.uid]  = "qazwsxedc"
            var url = "/home"
            if(screen.width <400)
            {
                url += "-m";
            }
            location.href = url 
        }
    })

  }
  else{
    document.getElementById("loader").setAttribute("hidden", true);
    document.getElementById("body").removeAttribute("hidden");
   // console.log("okdksdks")
  }

});
}

var Firebase = new FirebaseApp()

function coveda() 
{

  this.auth = Firebase;


  this.loginTab = document.getElementById ("login-tab");

  this.forgetPasswordTab = document.getElementById ("f-p-tab");

  this.loginButton = document.getElementById ("login-page")

  this.FP = document.getElementById ("f-p");

  this.loginSubmit = document.getElementsByName("sign-in")[0];

  this.form = document.getElementById ("login-form")

  this.userNameLogin = document.getElementById ('user_name_login');

  this.userPassLogin = document.getElementById ('user_pass_login');
  
  this.forgetPasswordEmail = document.getElementById ("email_f");

  this.spinner=document.getElementById("loader");

  this.forgetPasswordSubmit = document.getElementById ("btn_f");

  this.loginSubmit.addEventListener("click", this.login.bind(this))

  this.forgetPasswordSubmit.addEventListener ("click", this.forgetPassword.bind(this))
 // this.loginButton.addEventListener ("click" , this.loginTabOpen.bind(this));
  //this.registrationTab.addEventListener( 'click' , this.registrationTabOpen.bind(this));

 // this.FP.addEventListener ("click" , this.showForgetPasswordTab.bind(this));

}

coveda.prototype.login = function(event)
{ 
  event.preventDefault();
  this.auth.login(this.userNameLogin.value, this.userPassLogin.value)
    .then (user=>{
      //console.log(user)

    })
    .catch (error=>{
     this.spinner.setAttribute("hidden",true);
      this.userPassLogin.value="";
      alertMsg(error.message);

    })
  }

coveda.prototype.forgetPassword = function()
{
  //alertMsg(this.forgetPasswordEmail.value);
  if(this.forgetPasswordEmail.value)
  {
    this.auth.sendVerification(this.forgetPasswordEmail.value)
    .then(status =>{
        alertMsg ("Recovery mail is send to you.")
        this.forgetPasswordEmail.value="";
    })
    .catch(error=>{
      console.log (error)
      alertMsg(error.message);
    })
  }
}

coveda.prototype.registrationTabOpen = function(){
  //console.log ("rt")
	this.registrationTab.removeAttribute ("hidden");
	this.loginTab.setAttribute ("hidden", "true");
    this.forgetPasswordTab.setAttribute("hidden", "true")
}

coveda.prototype.loginTabOpen = function(){
  //console.log ("lt")
	this.loginTab.removeAttribute ("hidden");
  this.forgetPasswordTab.setAttribute ("hidden", "true")
	this.registrationTab.setAttribute ("hidden", "true");

}

coveda.prototype.showForgetPasswordTab = function ()
{
	this.forgetPasswordTab.removeAttribute("hidden");
	this.loginTab.setAttribute ("hidden" , "true");
      this.registrationTab.setAttribute ("hidden", "true");
}


window.onload = function() {
  window.Coveda = new coveda();
};


function sendRequest (url, requestMethod, extraInfo, response)
{
  var request=new XMLHttpRequest();
  request.open(requestMethod, url);
  if(extraInfo instanceof Function )
    request.send();
  else
    request.send(extraInfo);

  request.addEventListener('load',function(event)
  {
    if(request.status == 200)
    {
      var data = ""
      if(request.responseText)
        data = JSON.parse ( request.responseText )

      if(extraInfo instanceof Function )
        extraInfo(null, data);
      else
        response(null, data);

    }
    else
    {
      var data = JSON.parse ( request.responseText )
      if(extraInfo instanceof Function )
        extraInfo(data);
      else
        response(data);

    }

  });
}

