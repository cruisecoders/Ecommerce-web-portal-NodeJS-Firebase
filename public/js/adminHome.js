$("body").on("click", "a",function(e){

    var fromTop = 80;
    var href= e.target.href;
    var res=window.location.origin+"/adminHome" ;
    if(e.target.tagName!='a'){
       href= e.target.closest("a").href;
    }
    if(href.indexOf("#") > -1 ) {
        //console.log(e.target.href);
        if(href.indexOf("#0")>-1){
            res += "#our-products";
        }
        else if(href.indexOf("#1")>-1){
            res +=  "#add-user";
        }
        else if(href.indexOf("#2")>-1){
            res +=  "#add-product";
        }
        else if(href.indexOf("#3")>-1){
            res += "#pending-orders";
        }
        else if(e.target.parentNode.parentNode.id=="dropdown"){
            
            res +="#category-" + e.target.innerHTML;
            var ele=document.getElementById(e.target.name);
            var scroll_to=ele.offsetTop-80;

            $('html, body').animate({ scrollTop: scroll_to },{ duration: 'slow', easing: 'swing'});
        
            //window.scrollTo(0,scroll_to);
        }
        else{
            return;
        }

            if(history && "pushState" in history) {
                history.pushState({}, document.title, res );//
                return false;
            }
    }
});    


//This function is using to removing padding if screen size < 600
function adjustStyle(width) {
  width = parseInt(width);
  if (width < 600) {
    $(".container").css("padding","0px");
    $(".container").css("width","96%");

  }
}

//This function is using to removing padding if screen size < 600
function adjustStyle(width) {
  width = parseInt(width);
  if (width < 600) {
    $(".container").css("padding","10px");
    $(".container").css("width","96%");

  }
}

$(function(){
  adjustStyle($(this).width());
  $(window).resize(function() {
    adjustStyle($(this).width());
  });
});

/*This function is used to scroll page  ( 150 bottom from top ) on select category
function scroll_if_anchor(href) {
    href = typeof(href) == "string" ? href : $(this).attr("href");
    
    var fromTop = 80;
    
    if(href.indexOf("#") == 0) {
        var $target = $(href);
        
        if($target.length) {
            $('html, body').animate({ scrollTop: $target.offset().top - fromTop });
            if(history && "pushState" in history) {
                history.pushState({}, document.title, window.location.pathname + href);
                return false;
            }
        }
    }
} 

scroll_if_anchor(window.location.hash);  

$("body").on("click", "a", scroll_if_anchor); */

// used to show a alert box.
// input to this function is message that will show
function alertMsg(msg){
    var alertBox=document.getElementById("alertMsg");
        alertBox.querySelector('h4').innerHTML=msg;
        $("#alertMsg").modal('show');

}



var config = {
    apiKey: "AIzaSyBmLqleCRdx2FryYwe7B0kCqihDxwv2W1I",
    authDomain: "coveda-coop.firebaseapp.com",
    databaseURL: "https://coveda-coop.firebaseio.com",
    storageBucket: "coveda-coop.appspot.com",
    messagingSenderId: "231200290278"
};

var delimiter = "♥";

firebase.initializeApp(config);

var AdminAuth = function(){};

var dataRef = firebase.database().ref();

var authRef = firebase.auth();

// used to read categories details( id , name) from firebase database
AdminAuth.prototype.getBriefCategories = function (callback)
{
    var catRef = dataRef.child("categories");
    catRef.once( "value", ss =>{
        callback(ss.val())
    })      
}

//used to read products details from firebase database
AdminAuth.prototype.getProductDetails  = function(done) 
{
    if(authRef.currentUser.uid) 
    {  
        var dbItemRef = dataRef.child('product/');
        dbItemRef.once ("value", function(snap){
            done(snap.val());            
        })
    }
    else{
        alertMsg("login first")
        done({})
    }   
};

/*
AdminAuth.prototype.getCategory = function (done)
{
    var catRef = dataRef.child("categories");

    catRef.once( "value", ss =>{
      done(ss.val());
    })   
}
*/

// used to read pending orders from firebase database
AdminAuth.prototype.getPendingOrder = function(done)
{

  var pendingOrderRef = dataRef.child("orders").orderByChild("pendingStatus").equalTo(true)
  //console.log("Hello");
  pendingOrderRef.once("value", function(ss){
    //console.log(ss.val());
    done(ss.val());

  })
}

//  used to read users details from firebase database
AdminAuth.prototype.user = function (done)
{
  var userRef = dataRef.child("users")
  userRef.once("value", users=>{
    done(users.val())
  })
}

// used to update details in DB of pending order when confiremed by admin
AdminAuth.prototype.deliverProduct = function(orderID, productList,date, done)
{
  var obj = {};
  
  for(key in productList)
  {
    if(productList[key])
    {
    //  console.log (key)
      var productKey ="order/"+ key+"/productPendingStatus"
      obj[productKey] = false;
    }
  }

  obj["pendingStatus"] = false;
  obj["deliveryDate"] = date;

  //console.log (obj);

  var pendingRequestRef = dataRef.child("orders/" + orderID)

  pendingRequestRef.update(obj)
  
  .then(status=>{

      done(null , status)
  
  })
  .catch(error=>{
    done(error, null)
  })

}

// used to update details( quantity & price) of a products
AdminAuth.prototype.modify = function(info, callback) 
{
  var dbItemRef =dataRef.child('product')  //child( info.categoryId ).child("items");
  
  var item = dbItemRef.child(info.productId);

  item.transaction(function(item) 
  {

      if(item != null)
      {       

          item.inStock =  info.quantity

          item.price= info.price;

          callback(item);
      }
      return item;

    });
  
};

/*
AdminAuth.prototype.getProductByCategoryId = function(id, done) 
{ 

        var  dbItemRef = dataRef.child('product/').orderByChild ("category").equalTo(id);
        dbItemRef.once ("value", function(snap){
        done(snap.val(),index);


    })
};

*/

// //////////////////////// ////////////////
AdminAuth.prototype.getOrderById = function(id, done)
{
  var orderRef = dataRef.child("orders/"+id)
  orderRef.once( "value", function(orderDetails)
  {
    done( orderDetails.val() )
  })
}

// used to add a new product in DB
AdminAuth.prototype.addProduct = function (productDetail, done)
{
  productDetail.date = Date.now();
    //console.log ("added Product Details : ",productDetail)
    
    dataRef.child("product").push(productDetail)
    .then (function (data)
    {
      //console.log (productDetail)
      done(null, data.key)     
    })
    .catch (function (error)
    {
      console.log(error)
      done (error)
    })

}

// used to add a new category in DB
AdminAuth.prototype.addCategory = function (categoryDetails, done)
{
  categoryDetails.date = Date.now();
  var categoryRef = dataRef.child("categories");
  var newKey = categoryRef.push().key;
  
  refObj = {};
  
  var key1 = "categories/"+newKey
  

  refObj[key1] = categoryDetails;

   dataRef.update(refObj)
   .then(()=>{
    done(null, newKey)
   })
   .catch(error=>{
    done(error)
   })

}

// 
AdminAuth.prototype.sendMessage = function(orderID, info)
{
  return dataRef.child("pendingEmail/"+orderID).set(info);
}

AdminAuth.prototype.setTotalAmountOfOrder = function(orderID, info)
{
  console.log(orderID, info)
      return dataRef.child("orders/"+orderID+"/amount").set(info);
}

var adminDatabase = new AdminAuth();

// used to check session of user
firebase.auth().onAuthStateChanged(function(user) {
  if (user )
  {
      firebase.auth().currentUser.t = localStorage["firebaseAuth:"+firebase.auth().currentUser.uid]
      if(firebase.auth().currentUser.t === "plmoknijb")
      {
              addCategoriesIntoDom();
      }    
      else {
          var url = "/home"
            if(screen.width <600)
            {
                url += "-m";
            }
            location.href = url

      }
  }
  else{
          location.href = "/"
  }

});

var logout = document.getElementById("logout")

// used to destroy session on user on logout
logout.addEventListener("click", function ()
{ 
  if(connectionStatus())
  {
      delete localStorage["firebaseAuth:"+firebase.auth().currentUser.uid] 
      //delete localStorage.currentPage;
      firebase.auth().signOut().then(function()
        {
            //console.log ("logout");
       
        }).catch (error=>{

            alertMsg ("Error<br>Can not log out.")
        
        })
    }else{
        //spinner.setAttribute("hidden",true);
        alertMsg("You are offline.");
    
}

})
/*
function updateCategoryNameinAddProductForm(){
    categorySelectOptions.innerHTML="";
    var option=document.createElement('option');
    option.innerHTML="Select - Category";  
    categorySelectOptions.appendChild(option);
/*
    adminDatabase.getBriefCategories( function(obj)
    { 
        for (key in obj){
            
        }
    });
}
*/


function changeQuantity(id)
{
  var ide=document.getElementById(id);
  var idTtlStk=document.getElementById(id+"-s");

  var quantity = parseFloat(document.getElementById(id+"-q").value);
  var price = parseFloat(document.getElementById(id+"-p").value);

  var info = {}
  if(quantity < 0)
  {
    alertMsg("Quantity can't be nagative")
    return;
  }
  if(price < 0)
  {
    alertMsg("Price can't be nagative")
    return;
  }
  info.price = price;
  info.quantity = quantity;
  info.productId = id;

  if(connectionStatus())
  {
    adminDatabase.modify(info,function(item)
    {

      $("#updateAlert").modal('show');
      if(quantity)
      {
        document.getElementById(id+"-m").style["background-color"]="white";
      }
      else
      {
        document.getElementById(id+"-m").style["background-color"]="#DADADA";
      }

      alertMsg("Item Update");        
    });
  }
  else
  {

      alertMsg("You are offline.");
  }


}



function addCategory( div){
    
    var inputCategoryName = document.getElementById("cname")
    if(inputCategoryName.value){
        adminDatabase.addCategory({name : inputCategoryName.value}, function(error, key){
            if(error)
            {
              console.log(error)
                alertMsg("Sorry.<br>Category not added.")
            }
            else
            {
                alertMsg("Category is added.")
                var CNlist=document.getElementById("categoryNameList");
                var ul=document.getElementById('dropdown');

                var li=document.createElement('li');
                var anchor=document.createElement('a');
                anchor.setAttribute("href",'#'+key);
                anchor.innerHTML = inputCategoryName.value.toUpperCase();
                li.appendChild(anchor);
                ul.appendChild(li);
                var option=document.createElement("option");
                option.setAttribute("value",key);
                option.innerHTML=inputCategoryName.value.toUpperCase();
                categorySelectOptions.appendChild(option);
                var CNlist=document.getElementById("categoryNameList");
                CNlist.innerHTML="";
             
                var option1=document.createElement('option');
                option1.setAttribute('value',inputCategoryName.value);
                CNlist.appendChild(option1);
                
                var cloneCatHeading=catHeading.cloneNode(true);
                cloneCatHeading.querySelector('b').innerHTML=inputCategoryName.value.toUpperCase();
                cloneCatHeading.setAttribute('id',key);  
                productsTab.appendChild(cloneCatHeading); 


                inputCategoryName.value=""

            }
        })
    }
    else{
        alertMsg("Please enter category name.")
    }   
}

/*
function getRequest( url , callback)
{
   // console.log("Request Sent");
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
    if (request.readyState === XMLHttpRequest.DONE) {
    if (request.status === 200) {
      callback(request.response);  
    }
   }
  }
  request.open('GET', url );
  request.send();
      setTimeout(function(){

        if ( request && request.readyState > 0 && request.readyState < 4 ) { 
          request.abort();
            alertMsg("Request Cancelled due to Time-Out <br> ( 20-sec )");
            spinner.setAttribute("hidden",true);
            callback();
            return;  
       }
           
        },20000);
} */
var spinner=document.getElementById("loader");
var container=document.getElementById("container");
var productsTab=document.getElementById("productDiv");


var addProductAndCategoryTab=document.getElementById("productForm");
var btnAddProduct=document.getElementById("btnAddProduct");
var btnProduct=document.getElementById("btnProduct");

var orderTab=document.getElementById("orderDiv");
var customerTab=document.getElementById("customerDiv");
//var customerTab=document.getElementById("customerTab");


var addUserBtn = document.getElementById("sign-up-for-client")
 var btnCustomerDetails=document.getElementById("btnCustomer");
 var categorySelectOptions=document.getElementById("cat");
 var catDropdown=document.getElementById("catDropdown");

 var catHeading=document.querySelector(".cat-heading");  
    var catTable=document.querySelector("#cat-table");
    var productRow=document.querySelector("#product-row table tbody tr");;
    var emptyCat=document.querySelector("#empty-cat");
    var userRow=document.querySelector("#user-row table tbody tr");
    var orderTable=document.querySelector("#order-table div");
    var orderRow=document.querySelector("#order-row table tbody tr");



// awake when click on added user button
addUserBtn.addEventListener("click", function(event){
  event.preventDefault();

  addUserBtn.disabled=true;

  var email = document.getElementById("user_email");

  var firstName = document.getElementById("first_name");

  var lastName = document.getElementById("last_name");

  var mobile = document.getElementById("mobile");

  var userData = {

              email : email.value,

              mobile : mobile.value,

              firstName : firstName.value,

              lastName : lastName.value

            };
  if(check(userData)){
  if(connectionStatus()){

    sendRequest("adminHome/addUser","post", JSON.stringify(userData), function(err, user)
    {
        if(err)
        {
          console.log(err);
          if(err.code==2)
          {
            alertMsg("User Already Exist");
          }
          else{
              alertMsg("User is not register");
          }

        }
        else
        {

            addUserBtn.disabled=false;

            userData.name = userData.firstName+" "+userData.lastName;
            userData.mobileNumber = userData.mobile;
            delete userData.mobile;
            var userObj = JSON.parse(user)
           

            addUserIntoTableBody(userData, userObj.uid);
  
            customerDetails=false;
  
            alertMsg("User sucessfully added.");
            resetUserForm();
            userTableBody.scrollIntoView();
            //spinner.setAttribute("hidden",true);alertMsg("User registered.");
            
        }
        addUserBtn.disabled=false;

    })
    }
    else{
        //spinner.setAttribute("hidden",true);
        alertMsg("You are offline.");
    }
    }
    else{
      addUserBtn.disabled=false;
    }
})
/*
function addUserIntoTable(user){

    var userTableBody=document.getElementById("userTableBody");
    var tr =document.createElement('tr');
    var td1 =document.createElement('td');
    td1.innerHTML=user.firstName + " " + user.lastName;
    tr.appendChild(td1);
    var td2 =document.createElement('td');
    td2.innerHTML=user.email;
    tr.appendChild(td2);
    var td3 =document.createElement('td');
    td3.innerHTML="+91 " +user.mobile;
    tr.appendChild(td3);
    userTableBody.appendChild(tr);
    tr.style["background-color"]="gray";
    tr.scrollIntoView();
    setTimeout(function(){
        tr.style["background-color"]="";
    },10000);
    userTableBody.appendChild(tr);

}*/

// used to reset add User form
function resetUserForm(){
 
document.getElementById("user_email").value="";

 document.getElementById("first_name").value="";

 document.getElementById("last_name").value="";

 document.getElementById("mobile").value="";

// document.getElementById("postalAddress").value="";

// document.getElementById("ZipCode").value="";

}

// awake when click "Users" in header
 btnCustomerDetails.addEventListener('click',function(e){
  showCustomerDetails();
 })

//awake when click "Add Product" in header
btnAddProduct.addEventListener('click',function(envent){
    showAddProductPage();
});

//awake when click "Home" in header
btnProduct.addEventListener('click',function(event){
 showProductPage(); 
});

/*awake when click "Users" in header 
btnReg.addEventListener('click',function(event){
    showAddUserPage();
 
});*/


var btnOrder=document.getElementById("btnOrder");

//awake when click "Pending Orders" in header 
btnOrder.addEventListener("click",function(e){
       showOrderPage(); 
});

// used to show "Add Product Form" section and hide remaning all sections
function showAddProductPage(){
    console.log("showAddProductPage");
    productsTab.setAttribute("hidden",true);
    customerTab.setAttribute("hidden",true);
    orderTab.setAttribute('hidden',true);
    addProductAndCategoryTab.removeAttribute("hidden");
    localStorage.currentPage=2;
    catDropdown.disabled=true;
}

/* used to show "Add User" section and hide remaning all sections
function showAddUserPage(){
   //console.log("showAddUserPage");
    form.setAttribute("hidden",true);
    customerTab.setAttribute("hidden",true);
    productsTab.setAttribute("hidden",true);
    orderTab.setAttribute('hidden',true);
    localStorage.currentPage="addUser";
    catDropdown.disabled=true;

}
*/
// used to show "Home" section and hide remaning all sections

function showProductPage(){
  //console.log("showProductPage")
  customerTab.setAttribute("hidden",true);
  addProductAndCategoryTab.setAttribute("hidden",true);
  orderTab.setAttribute('hidden',true);
  productsTab.removeAttribute("hidden");
  localStorage.currentPage=0; 
  catDropdown.disabled=false;

}

var customerDetails= false;
function showCustomerDetails(){
  //console.log("showCustmerDetails");
    addProductAndCategoryTab.setAttribute("hidden",true);
    productsTab.setAttribute("hidden",true);
    orderTab.setAttribute('hidden',true);
    customerTab.removeAttribute("hidden");
    localStorage.currentPage=1;
    catDropdown.disabled=true;

  if(!customerDetails){
  if(connectionStatus()){
    customerDetails=true;
   adminDatabase.user(function(users){
    for( key in users){
    var user=users[key];
          addUserIntoTableBody(user, key)
    }
    // used to make a dataList of existing emails
    var emailList=$("#emailList");
      $("table tr").each(function(index) {
        if (index !== 0) 
          {
            $row = $(this);
            var email = $row.find("td:eq( 1 )").text();
             var option='<option value="'+email+'" />'
             document.getElementById("emailList").innerHTML += option;
          }
      }); 
   });

  }
  else{
        //spinner.setAttribute("hidden",true);
        alertMsg("You are offline.");
    }
}
}

var isOrderRecieve = false;
// used to show "Pending Orders" section and hide remaning all sections
function showOrderPage(){
    addProductAndCategoryTab.setAttribute("hidden",true);
    customerTab.setAttribute("hidden",true);
    productsTab.setAttribute("hidden",true);
    orderTab.removeAttribute('hidden');
    localStorage.currentPage=3;
    catDropdown.disabled=true;

    if(isOrderRecieve){
      return;
    }
    else{
    isOrderRecieve  = true;
    adminDatabase.getPendingOrder(function(orders){
     for(key in orders)
     {
        var order=orders[key];
        var cloneOrderTable = orderTable.cloneNode(true);
        cloneOrderTable.querySelector("tbody").setAttribute("id",key);
        cloneOrderTable.querySelector("button").setAttribute("id",key);
        cloneOrderTable.querySelector("table").setAttribute("id",key);
        var h5s=cloneOrderTable.querySelectorAll("h5");
        var date=convertTimeStampIntoDate(-order.date);
        h5s[0].innerHTML="User Name : " +   order.name;
        h5s[1].innerHTML="Order At : " +   date;

        orderTab.querySelector(".tables").appendChild(cloneOrderTable);
        for(key in order.order){
            var item=order.order[key];
            //console.log(item);
            var cloneOrderRow = orderRow.cloneNode(true);
            var tds = cloneOrderRow.querySelectorAll("td");
            
            var unit=item.packaging + item.measuredIn;
            if(parseFloat(item.packaging)<1){
                if(item.measuredIn=='kg'){
                    unit=parseFloat(item.packaging)*1000 + "gms";
                }
                if(item.measuredIn=='L'){
                    unit=parseFloat(item.packaging)*1000 + "mL";
                }
            }
            tds[0].innerHTML=item.name +" - "+ unit;
            tds[1].innerHTML=item.quantity;
            var input = tds[2].querySelectorAll("div input");
            input[0].setAttribute("name",key);
            input[1].setAttribute("name",key);
            cloneOrderTable.querySelector("tbody").appendChild(cloneOrderRow);
        }

    }

  }); 
  }
}

// used to load current section when user reload the page;
function loadCurrentPage(){
    var currentPage=localStorage.currentPage;
    if(currentPage==2){
        showAddProductPage();
    }
    else if(currentPage==3){
      showOrderPage();
    }
    else if(currentPage==1){
      showCustomerDetails();
    }
    else{
      showProductPage();
     /* if(history && "pushState" in history) {
                if(window.location.href.indexOf("catrgory")>-1){
                history.pushState({}, document.title, window.location.origin +"/adminHome" );
                return false;
                }
            }
    */
    }

}

loadCurrentPage();

// used to add a row containing user details( name,email & mobile number) in user table
// input: user(object) :that containing user details and
//         key : userID
function addUserIntoTableBody(user, key)
{
    var cloneUserRow =userRow.cloneNode(true);
    cloneUserRow.setAttribute("id",key+'-m');
    var tds=cloneUserRow.querySelectorAll('td');
    tds[0].querySelector('input').setAttribute("value",user.name);
    tds[1].innerHTML=user.email;
    tds[2].querySelector('input').setAttribute("value", user.mobileNumber);
    tds[3].querySelector('a').setAttribute("id",key);
    tds[4].querySelector('a').setAttribute("id",key);
    userTableBody.appendChild(cloneUserRow);
}


// used to update product info
// awake click on update button in products table
function updateProductInfo(id)
{
  var ide=document.getElementById(id);
  var idTtlStk=document.getElementById(id+"-s");

  var quantity = parseFloat(document.getElementById(id+"-q").value);
  var price = parseFloat(document.getElementById(id+"-p").value);

  var info = {}
  if(quantity < 0)
  {
    alertMsg("Quantity can't be nagative")
    return;
  }
  if(price < 0)
  {
    alertMsg("Price can't be nagative")
    return;
  }
  info.price = price;
  info.quantity = quantity;
  info.productId = id;

  if(connectionStatus())
  {
    adminDatabase.modify(info,function(item)
    {

      $("#updateAlert").modal('show');
      if(quantity)
      {
        document.getElementById(id+"-m").style["background-color"]="white";
      }
      else
      {
        document.getElementById(id+"-m").style["background-color"]="#DADADA";
      }

      alertMsg("Item Update");        
    });
  }
  else
  {

      alertMsg("You are offline.");
  }


}

// used to add categories into dom:
// used to make category heading,dropdown list, select List( into add product form)
function addCategoriesIntoDom(){
if(connectionStatus){  
  adminDatabase.getBriefCategories( function(obj)
  { 
    if(obj)
    {
        
           catDropdown.disabled=false;   

           var x=Object.keys(obj);
           var objLength=x.length;
           var CNlist=document.getElementById("categoryNameList");
           var ul=document.getElementById('dropdown');
           var objLength=Object.keys(obj).length;
           var numberOfCat=0;
      for(key in obj)
        {
            numberOfCat++;
            var li=document.createElement('li');
            var anchor=document.createElement('a');
            anchor.setAttribute("href",'#');
			anchor.setAttribute("name",key);
            anchor.innerHTML=obj[key].name.toUpperCase();
            li.appendChild(anchor);
            ul.appendChild(li);
            var option=document.createElement("option");
            option.setAttribute("value",key);
            option.innerHTML=obj[key].name.toUpperCase();
            categorySelectOptions.appendChild(option);
            var CNlist=document.getElementById("categoryNameList");
            CNlist.innerHTML="";
            var option1=document.createElement('option');
            option1.setAttribute('value',obj[key].name);
            CNlist.appendChild(option1);
                
                var cloneCatHeading=catHeading.cloneNode(true);
                cloneCatHeading.querySelector('b').innerHTML=obj[key].name.toUpperCase();
                cloneCatHeading.setAttribute('id',key);  
                productsTab.appendChild(cloneCatHeading); 

                if(objLength==numberOfCat){
                    addProductsIntoDom();
                }
        }   
      }
    });


}else{
       // spinner.setAttribute("hidden",true);
       alertMsg("You are offline.");
    }
}

// used to add all products into DOM
function addProductsIntoDom(){
adminDatabase.getProductDetails( function(items){            
    productDetails=items;         
    for( key in items ){
        var item=items[key];
        addProductIntoDoms(item, key)
    }
                
}); 
}

// used to show all product description on click product name 
function showProductDetails(id){
    var item=productDetails[id];
    var modal=document.getElementById("productPopUp");
  
   if(item.description){
    //modal.querySelector('#title').innerHTML="<b>Name</b> : " + item.name;
    //modal.querySelector('#price').innerHTML="<b>Price</b> : " +item.price + "/Rs." + item.measuredIn;
    //modal.querySelector('#fName').innerHTML="<b>Farmer</b> : " + item.purchasedFrom;
   
    if(item.picture){
    modal.querySelector(".thumbnail").removeAttribute("hidden");
    modal.querySelector("img").setAttribute("src",item.picture);
     }
     else{
       modal.querySelector(".thumbnail").setAttribute("hidden",true);
     }
     modal.querySelector("p").innerHTML="<b>Description</b> : " +item.description;
     $("#productPopUp").modal('show');
    
   }
 }

// used to send a get & post request to server
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
        data =  request.responseText ;

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

/*
function disabledRow(id){
  var btn=$('#'+ id);
   if( btn.html()==="Yes"){

    btn.parents("tr").css({"background-color": "#DADADA",});
    btn.removeClass("btn-primary");
    btn.addClass("btn-danger");
    if(btn.parents("tr").find('input').prop('checked')){
        btn.parents("tr").find('input').prop('checked', false);
       

}
    btn.parents("tr").find('input').prop( "disabled", true );
    btn.html("No&nbsp");
}
else{
   btn.parents("tr").css({"background-color": "white",});
    btn.parents("tr").find('input').prop( "disabled", false );
    btn.html("Yes");
    btn.removeClass("btn-danger");
    btn.addClass("btn-primary");
}
}
*/


// used to validate user details filled in add user form
function check (field)
{

 
   if(!field.email || field.email.indexOf('@') == -1 || field.email.indexOf('.') == -1)
   {
        //spinner.setAttribute("hidden",true);
        alertMsg ("Email is not well formatted")
        return false;
   }
  
 if(!field.firstName)
   {
      //spinner.setAttribute("hidden",true);
      alertMsg("Name field is required")
      return false;
   }

   if (!field.mobile)
   {
    //spinner.setAttribute("hidden",true);
    alertMsg ("Mbile number is required");
    return false;
   }

   if (field.mobile.length != 10)
   {
      //spinner.setAttribute("hidden",true);
      alertMsg ("Mobile number is incorrect");
      return false;
   }

  /* 

  if (!field.postalAddress)
   {
      spinner.setAttribute("hidden",true);alertMsg ("Please enter a postal address.");
      return false;
   }
    if (field.zipCode.length != 6)
   {
      spinner.setAttribute("hidden",true);alertMsg ("Pin is incorrect");
      return false;
   }
   */
  

   //alert ("its okk");
   return true;
}

// check connection (online or offline)
function connectionStatus()
{

    if(navigator.onLine){
        return true ; //alert("online");
    }
    else{
         return false;//alert("offline");
    }
}

var allOrder = {};

// awake when admin click on Yes(radio button) in packed-column of order table in "pending order section"
//used to add product into order
// it means admin have that particuler product to deliver
function addProductIntoOrder(btnRadio)
{
 
  var pid=btnRadio.name;
  var oid=btnRadio.closest('tbody').id;

  if(allOrder[oid]){
      allOrder[oid][pid]=true;
  }else{
      allOrder[oid]={};
      allOrder[oid][pid]=true;
  }

}

// awake when admin click on No(radio button) in packed-column of order table in "pending order section"
//used to remove product into order
// it means admin have not that particuler product to deliver
function removeProductFromOrder(btnRadio)
{

  var pid=btnRadio.name;
  var oid=btnRadio.closest('tbody').id;

  if(allOrder[oid])
  {
      allOrder[oid][pid]=false;
  }
  else
  {
      allOrder[oid]={};
      allOrder[oid][pid]=false;
  }

}


//awake when click on "confirm Button" in pending order section
// 
function deliverProductToServer(order)
{
    
    var tableBody = document.getElementById(order.id).parentNode.querySelectorAll("table tbody tr").length;
    
    var date = document.getElementById("deliveryDate").value;
    if(allOrder[order.id])
    {

      var  totalSelectedProduct = Object.keys(allOrder[order.id]).length;
      if(totalSelectedProduct == tableBody )
      {
        if(date)
        {
          var order = {
            id : order.id,
            productList : allOrder[order.id],
            deliveryDate : date
          }
        
           adminDatabase.deliverProduct( order.id, order.productList, order.deliveryDate,  function(err, status)
           {

              if(err)
              {
                  console.log(err)
              }
              else
              {
                  alertMsg("order is placed") 
                  var table = document.getElementById(order.id).parentNode
                  table.parentNode.removeChild(table)                
                  order.innerHTML="Confirmed";
                  adminDatabase.getOrderById(order.id, function(odr)
                  {
                    var mailOptions = {
                        email: odr.userEMail,
                        name : "Coveda User"
                    };
              
                    mailOptions.body = makeEmail(odr.order,order.deliveryDate)   //"<pre>"+JSON.stringify(odr.order, true,"\n")+"</pre>"
                    
                    adminDatabase.sendMessage(order.id, mailOptions)
                    .then(()=>{
                      console.log("sdhsagdh")
                               var totalAmount = totalAmountAfterDeliver(odr.order);
                               return adminDatabase.setTotalAmountOfOrder(order.id, totalAmount);
                    })
                    .catch(error=>{
                      
                        console.log(error)
                    })
                  })
              }
          })
        }
        else
        {
          alertMsg("Please select a delivery date.")
        }
      }
      else
        alertMsg("Please check all product.<br>Select <b>Packed</b> coulmn with <b>Yes<b> if product is available else <b>No</b>.");
    }
    else
        alertMsg("Please check all product.<br>Select <b>Packed</b> coulmn with <b>Yes<b> if product is available else <b>No</b>.")
   
}

//awake when click "update" button in user details table
// used to update user info( name & mobile number)

function updateUserDetails(anchor) 
{
 var key = anchor.id;
  var tds = anchor.parentNode.parentNode.querySelectorAll("td");
 
  var userDetail = {
    name : tds[0].querySelector("input").value,
    mobile : tds[2].querySelector("input").value,
    uid : key
  }
  sendRequest("adminHome/updateUserDetails", "post", JSON.stringify(userDetail), function (err, status ) {
      if(err){
        alertMsg(err.error);
        console.log(err)
      }
      else{
        alertMsg("user details is updated");
      }
  } )
}

//awake when click "Delete" button in user details table
// used to delete user from DB

function deleteUserRecord(anchor) {
  var uid = anchor.id;
  var trs = anchor.parentNode.parentNode.childNodes;
  var name  = trs[1].childNodes[0].value

  var status = confirm("are you sure to delete "+ name)
  if(status)
  {
     sendRequest("adminHome/deleteUser", "post", JSON.stringify({uid : uid}), function(error, status)
      {
        if(error)
        {
          alertMsg("user not deleted , please try again")
        }
        else{
          alertMsg("user is sucessfully deleted")
          anchor.parentNode.parentNode.parentNode.removeChild(anchor.parentNode.parentNode)
        }
      })
  }
  else{
    alertMsg("no")
  }
}  

// used to reset addProduct Form
function resetAddProductForm(form){
  form.category.value="0";
  form.name.value="";
  form.fname.value="";
  form.quantity.value="";
  form.price.value="";
  form.measuredIn.value="";
  form.description.value="";
}

// used to validate product info in add product form
function  checkedproduct(form)
{
    var flag = false;
    var productInfo = {};
    if(form.category.value != 0)
    {
        productInfo.category = form.category.value;
    }
    else
    {
        alertMsg("Category field is required")
        return;
    }
    if(form.name.value)
    {
        productInfo.name = form.name.value
    }
    else{
        alertMsg("Nameb field is required")
        return
    }

    if(form.fname.value){
        productInfo["purchasedFrom"] = form["purchased-from"].value
    }
    else{
        alertMsg("PurcbhasedFrom field is required")
        return
    }

    if( parseFloat(form.quantity.value) ){
        productInfo.inStock = parseFloat(form.quantity.value)
        productInfo.total = parseFloat(form.quantity.value)
      }
    else{
        alertMsg("Quanbtity is required")
        return
    }
    if( parseFloat(form.price.value) ){
        productInfo.price = parseFloat(form.price.value)
    }
    else{
        alertMsg("Pricbe is required")
        return
    }

    if(form.measuredIn.value){
        productInfo.measuredIn = form.measuredIn.value;
    }
    else{
        alertMsg("Unit Field is required.")
        return
    }
   
    if(form.package.length){
        productInfo.packaging = []
        var k = 0
        for(var i = 0 ; i < form.package.length ; i++)
        {

            if(form.package[i].checked&&form.package[i].value)
            {
                productInfo.packaging[k++] = parseFloat(form.package[i].value);
            }
        }
    }
    else{
        alertMsg("Select atleast one packaging.")
        return
    }
    productInfo.description = form.description.value
   // productDetails.inQueue = 0;
    productInfo.active = 1;


    adminDatabase.addProduct(productInfo, (error, key)=>{
      if(error)
      {
        alertMsg("product adding is failed");

      }
      else{
        alertMsg("product is sucessfully added")
        productDetails[key] = productInfo;
        addProductIntoDoms(productInfo, key)
      }
        resetAddProductForm(form)
    })
}

// used to add product into Dom
// input : item-> a object containing product info
//         pid-> product ID
function addProductIntoDoms(item, pid)
{
  var catDiv=document.getElementById(item.category);
           if(catDiv.querySelector('.empty-cat')){
            catDiv.removeChild(catDiv.querySelector('.empty-cat'));
            catDiv.querySelector(".table-responsive").removeAttribute("hidden");
           }
            var tbody=catDiv.querySelector(".table-responsive table tbody");
            var cloneProductRow=productRow.cloneNode(true);
          
            cloneProductRow.setAttribute("id",pid+"-m"); 
            var tds=cloneProductRow.querySelectorAll('td');
            tds[0].setAttribute("id",pid);
            tds[0].querySelector("i").innerHTML=item.purchasedFrom;
            tds[0].innerHTML=item.name + tds[0].innerHTML;
            var pack=item.packaging;
            var packaging="";
            for(var i=0;i<pack.length;i++){

                packaging= packaging + pack[i] + ",&nbsp";
                        
            }
            tds[1].querySelector('i').innerHTML=packaging;
            tds[1].innerHTML+=item.measuredIn;
            tds[2].querySelector("input").setAttribute("id",pid+"-q");
            tds[2].querySelector("input").setAttribute("value",item.inStock);
            tds[2].innerHTML+=item.measuredIn;
            tds[3].querySelector("input").setAttribute("id",pid+"-p")
            tds[3].innerHTML+="/" + item.measuredIn;
            tds[3].querySelector("input").setAttribute("value",Math.ceil(item.price));
            tds[4].querySelector("a").setAttribute("id",pid);
            tbody.appendChild(cloneProductRow);
}

// used to convert timeStamp in time that is shown in pending order section
// 
function convertTimeStampIntoDate(date)
{
     date =new  Date(date)
   
     var m = date.getMinutes();
      if(m<10){
      m='0'+m;
      }
     var h=parseInt(date.getHours());
     var AMPM="AM";
      if(h>12){
        h=h-12;
        AMPM="PM";
        if(h<10){
        h='0'+h;
        }
      }
       if(parseInt(h)==0){
         h=12;
        }
      
      var d=date.getDate();
      if(d<10){
      d='0' + d;
      }
      var mon=date.getMonth()+1;
      if(mon<10){
      mon='0' + mon;
      }

     date =  h + ':'+ m + ' ' + AMPM +', '+ d+  '/'+ mon +'/'+ date.getFullYear() ;
     return (date);
}

// used to make email body
function makeEmail( products ,date)
{
  var total = 0;
  var table = "<b>Hi<b><br><br><p> Your Following products Has been Placed and will be delivered on "  + date + "</p><br><br>";
  table += "<table border = 1><tr><th>Product Name</th><th>price</th><th>Send</th></tr>"
  
  for(eachProduct in products)
  {
    if(products[eachProduct].productPendingStatus == false)
    {
          console.log("in false", products[eachProduct].price*products[eachProduct].quantity)
          total += products[eachProduct].price*products[eachProduct].quantity;
          table += "<tr><td>"+products[eachProduct].name+"</td><td>"+products[eachProduct].price+"</td><td>Yes </td></tr>";
    }
    else
     {
          table += "<tr><td>"+products[eachProduct].name+"</td><td>"+products[eachProduct].price+"</td><td>No </td></tr>";
      }
  }
  table += "<tr><td>Total amount is :</td><td>"+total+"</td><td></td></tr>";
  table += "</table>"
  return table;
}

function totalAmountAfterDeliver(products) 
{
        var total = 0;
      
        for(eachProduct in products)
        {
            if(products[eachProduct].productPendingStatus == false)
            {
                  total += products[eachProduct].price*products[eachProduct].quantity;
            }
        }
        return total;  
}