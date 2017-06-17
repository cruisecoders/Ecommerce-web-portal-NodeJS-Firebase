var config = {
    apiKey: "AIzaSyBmLqleCRdx2FryYwe7B0kCqihDxwv2W1I",
    authDomain: "coveda-coop.firebaseapp.com",
    databaseURL: "https://coveda-coop.firebaseio.com",
    storageBucket: "coveda-coop.appspot.com",
    messagingSenderId: "231200290278"
};

firebase.initializeApp(config);


var DELIMITER = "♥", delimiter = "♥";

var ENTER_KEY_CODE = 13;

var dataRef = firebase.database().ref();

var authRef = firebase.auth();

var productDetails={};

var clientAuth = function clientAuth(){};
/*
    Porpose :-  For checking and updating stock value of product, 
              when user click on the increase button,  It Decrease Product Quantity from stock and add into the Queue.

    Input : Product ID, Product Quantity To add the value into queue

    Output : return product after updating quatity.

    Dependencies : Dependent on Transaction function of firebase , which update the quantity of the product
*/

clientAuth.prototype.increment = function(info, quantity = 1) 
{

    return new Promise (function (resolve, reject)
    {
        var dbItemRef=dataRef.child('product/').child( info.productId);

        dbItemRef.transaction(function(item) {

            if(item != null)
            {
                    var currentStock = item.inStock;
                    console.log(quantity, item.inStock - item.packaging[parseInt(info.pkgId)]*quantity)
                    if(quantity > 0 &&(currentStock<=0 || currentStock == null))
                    {
                             reject ("error, stock is zero");
                    }
                    else if(quantity > 0 && item.inStock - item.packaging[parseInt(info.pkgId)]*quantity < 0 )
                    {
                        var qty = parseInt(item.inStock/item.packaging[parseInt(info.pkgId)]);
                        
                        if(qty == 0)
                            reject("out of stock")
     
                        else
                        {   
                            item.inStock = (item.inStock*1000 - (item.packaging[parseInt(info.pkgId)]*1000)*qty)/1000;
                            console.log(item.inStock)
                            resolve([item, qty])
                        }
                    }
                    else
                    {   
                        item.inStock = (item.inStock*1000 - (item.packaging[parseInt(info.pkgId)]*1000)*quantity)/1000                         
                         resolve([item]);
                    }
            }
            return item;    
        });

    })
};

clientAuth.prototype.checkStock = function(info, quantity = 1) 
{
    var item = productDetails[info.productId]
    console.log (item)
    var currentStock = item.inStock;
     if(currentStock <=0 || item.inStock - item.packaging[parseInt(info.pkgId)]*quantity < 0)
    {
        console.log("yes")
            return false
    }
    return [item];
};


/*
    Porpose :-  After updating Stock value from Product, User's Selected Product is add to queue (Cart).

    Input : User ID, Product ID, Quantity of added product in queue

    Output : return queue status  and confirmation

    Dependencies : Dependent on UPDATE function and queue value of user.  
*/

clientAuth.prototype.addInQueue = function (uid, info, item, done, quantity = 1)
{
    var queueRef = dataRef.child("queue/"+uid)
    var productId = info.productId+ DELIMITER+info.pkgId;
    
    var pkgId = info.pkgId;

    queueRef.once("value", function(userQueue)
    {
        var userQ = {}
        if(!userQueue.exists() )
        {
            userQ.lastRequestTime =  -Date.now();
            userQ.numberOfProduct = 1;
            userQ.active = true;
            userQ.order = {};
            var msr = item.packaging[pkgId];
            userQ.order[productId] =new Product(item.name, quantity, parseInt(item.price), msr, item.measuredIn);
            userQ.amount = userQ.order[productId].price*quantity;
        }
        else
        {
             userQ = userQueue.val();
            if(!userQ.active)
            {
                done("queue is removed")
                return;
            }
               
                
                userQ.lastRequestTime = -Date.now();

                if(!userQ.order){
                    userQ.order={};
                }
                
                if(userQ.order[productId])
                {   
                    userQ.order[productId].quantity += quantity
                    userQ.amount += userQ.order[productId].price*quantity
                }
                else
                {
                    userQ.order[productId] = {}
                    userQ.numberOfProduct++;
                    var msr = item.packaging[pkgId]
                    userQ.order[productId] = new Product(item.name, quantity, parseInt(item.price), msr, item.measuredIn  )   
                    userQ.amount += userQ.order[productId].price*quantity;           
                }
        }

        queueRef.update (userQ)
        .then(function(){
            var productObj = {};
            productObj.numberOfProduct = userQ.numberOfProduct;
            productObj.amount = userQ.amount;
            productObj.item = userQ.order[productId];
            done(null, productObj )
        
        })
        .catch(function(error){
            done(error)
        })
    })

}

/*
    Porpose :-  For checking and updating stock value of product, 
             when User click on decrease button ,  It Decrease Product Quantity from Queue and add into the Stock.

    Input : Product ID, Product Quantity To decrease the value From queue

    Output : return product after updating quatity.

    Dependencies : Dependent on Transaction function of firebase , which update the quantity of the product
*/

clientAuth.prototype.decrement = function(info, callback)
{
    return new Promise (function (resolve, reject){
        //console.log (info)
        var  dbItemRef=dataRef.child('product/').child( info.productId);

        dbItemRef.transaction(function(item) {
           
            if(item != null)
            {
                    item.inStock = (item.inStock*10 + item.packaging[info.pkgId]*10)/10  
                    resolve (item );
            }
            return item;
        });


    })
}

/*
    Porpose :-  When user Click on decrease button it decrease the quantity of cart's product, 
                if there is only single product remaining it delete all Queue;


    Input : User ID, Product ID, Quantity of added product in queue

    Output : return queue status  and confirmation

    Dependencies : Dependent on UPDATE function of firebase , which update the quantity of the product in queue
*/

clientAuth.prototype.deleteInQueue = function (uid, info, done)
{
    var queueRef = dataRef.child("queue/"+uid);
    var productId = info.productId+ DELIMITER+info.pkgId;
    var pkgId = info.pkgId, p = {};
    queueRef.once("value", function(userQueue)
    {
        if(userQueue.exists())
        {
            var userQ = {}
            userQ = userQueue.val();
            if(!userQ.active)
            {
                done("queue is removed")
                return;
            }
            userQ.lastRequestTime = -Date.now();
            
            if(userQ.order && userQ.order[productId])
            {   
                var orderProduct = userQ.order[productId];

                userQ.amount -= userQ.order[productId].price

                if(userQ.order[productId].quantity > 1)
                {
                    userQ.order[productId].quantity--;
                }       
                else
                {
                    userQ.numberOfProduct--;
                    p = userQ.order[productId];
                    delete userQ.order[productId]
                    console.log(userQ.numberOfProduct)
                    /*if(userQ.numberOfProduct == 0)
                    {
                        userQ = {};
                    }  */
                    p.quantity = 0;
                }
            }
            else {
                done("Already empty");
                return;
            }

            queueRef.update (userQ)
            .then(function(){
                var productObj = {};
                productObj.numberOfProduct =userQ.numberOfProduct;
                productObj.amount = userQ.amount;
                if(userQ.order[productId])
                    productObj.item = userQ.order[productId];
                else{
                    productObj.item = p;
                }

                done(null, productObj)
        
            })
            .catch(function(error){
            	console.log(error)
                done(error)
            
            })
        }
    })
}

/*
    Porpose : For getting in queue products for specific user

    input : uid of login user

    output : return queue product ; 

   dependency : dependent on once function of firebase for fetching data 

*/
clientAuth.prototype.getQueue = function(uid, done)
{   
     if(uid)
     {
        var queueRef = dataRef.child("queue").child(uid)

        queueRef.once("value", function(queueValue)
        {
        //console.log(queueValue.val())
        done(queueValue.val())
        })        
     }
     else
     {

        done({})
     }
}

/*
    Porpose : For getting in category Name

    input : none

    output : return all category with their name , and key ; 

   dependency : dependent on once function of firebase for fetching data
*/


clientAuth.prototype.getBriefCategories = function (callback)
{
    var catRef = dataRef.child("categories");
    catRef.once( "value", ss =>{
        callback(ss.val())
    })      
}

/*
    Porpose : this function store the queue product in order table (means request for product).

    input : none: it take input from the firebase Database Queue for prticular user, and store into table.

    output : return status 

     dependency : storeUserOrder:-- store order into order Table.
              SendMessage :-- send mail to client.
              ClearQueue : clear queue after storing user order.
*/

clientAuth.prototype.sendOrder = function(done)
{
    var self = this;
    var uid = authRef.currentUser.uid, detail ;
    this.getQueue(uid, function(info)
    {
        if(info.numberOfProduct > 0)
        {   
            delete info.lastRequestTime;

            info.userID = authRef.currentUser.uid;

            info.name  = authRef.currentUser.displayName
            
            info.deliveryDate = false;

            info.date = -(Date.now());

            info.pendingStatus = true;
    
            
            info.userEMail = authRef.currentUser.email;
 
            self.storeUserOrder ( info)

            .then ( function( res )
            {
                info.orderID = res.key
                info.userName = authRef.currentUser.displayName;
                done(null, info.order);
                return self.sendMessage(info);
            })         
            .then(function(){
                self.clearQueue(uid)
            })
            .catch(function(error){
                done ("error");
                console.log (error)

            })
        }
        else 
        {
            done("Zero product");
            alertMsg("Select some product to order.");
        }
    })
}

/*
    Porpose : after buying product recieve email, So this function store this message  into firebase, from there node pick this message and send to the user;

    input : it accept information about email of the user, product ordered by user, name of the user;

    output : return queue product ; 
   Dependency: makeEmail :-- make email body
*/

clientAuth.prototype.sendMessage = function(info)
{
    var msgBody= makeEmail(info)
    var msg = {};
    msg.email = info.userEMail;
    msg.name = info.userName;
    msg.body = msgBody;
   // console.log(msg)
    dataRef.child("pendingEmail/"+info.orderID).set(msg);
}

/*
    Porpose : Store the order into database.

    input : Products object 

    output : return Promise of success/fail ; 
 dependency : push function : add user into database.
*/


clientAuth.prototype.storeUserOrder = function (info)
{   
    return dataRef.child("orders").push (info)
}

/*
    Porpose : After sending order, removing all product from queue , this function is required

    input : UID of user

    output : Confirmation ; 

   dependency : remove() : remove data from firebase
*/

clientAuth.prototype.clearQueue = function(uid)
{

    dataRef.child("queue/"+uid).remove()
}

/*
    Porpose : For getting History Details, which may be pending or may be not

    input : uid of login user

    output : return History of user 
   dependency : once function fetching data. alertMsg :- on error show alert box
*/

clientAuth.prototype.getOrder = function (done)
{
    if(authRef.currentUser.uid)
    {

        var orderRef =  dataRef.child("orders/").orderByChild("userID").equalTo(authRef.currentUser.uid)

        orderRef.once("value", function (snap) {
        //console.log(snap.val())
            done(snap.val())
        })
    }
    else{
        alertMsg("Login first")
        done({})
    }
}

/*
    Porpose : It retrieve all product

    input : none

    output : return all product 

   dependency : once function fetching data. alertMsg :- on error show alert box
*/

clientAuth.prototype.getProductDetails  = function(done) 
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

clientAuth.prototype.getProductFromQueue = function(pid, done)
{
    if(authRef.currentUser.uid)
    {
        var queueProductRef = dataRef.child("queue/" + authRef.currentUser.uid).child("order/" + pid)
        queueProductRef.once("value", product=>{
            done(product.val())
        })
    }
    else
    {
        done({})
    }
}

clientAuth.prototype.setProductQuantityInQueue = function(pid, value,done)
{
    return new Promise (function(resolve, reject)
    {
        dataRef.child("queue/" + authRef.currentUser.uid).transaction(function(n) {
               
                if(n)
                {
                    if(n.active)
                    {
                        n.amount -= n.order[pid].quantity*(n.order[pid].price*100)/100;
                        
                        n.order[pid].quantity =  value;
                        
                        n.lastRequestTime = -Date.now();

                        n.amount += n.order[pid].quantity*(n.order[pid].price*100)/100;

                        if(value > 0)
                        {

                            var productObj = {}
                            
                            productObj.numberOfProduct =n.numberOfProduct;    
                            
                            productObj.amount = n.amount;    
                            
                            productObj.item = n.order[pid];
                            
                        }
                        else
                        {

                            --n.numberOfProduct;

                            var productObj = {}
                            
                            productObj.numberOfProduct =n.numberOfProduct;    
                            
                            productObj.amount = n.amount;    
                                     
                            productObj.item = n.order[pid];
                            
                            delete   n.order[pid];

                            if(n.numberOfProduct == 0)
                            {
                                n = {};
                            }
                        }
                        resolve  (productObj);
                    }
                    else{
                        reject("Queue is removed")
                    }
                }
                return n;
        });        
    })
}

clientAuth.prototype.setQueue = function (uid, info, productInfo, numberOfProduct, amount)
{
    var obj = {}
             var productId = info.productId+ DELIMITER+info.pkgId;
            var queueRef = dataRef.child("queue/"+uid)
            obj["numberOfProduct"] = numberOfProduct;
            obj["amount"] = amount;
            obj["order/"+productId ] = productInfo
            queueRef.update(obj)
            .catch(error=>{
                console.log(error)
                alertMsg("error is due to connection")
            })
}


var queueIsNotLoad = true;
clientAuth.prototype.changeDetect = function()
{
    var ref = dataRef.child("queue/"+authRef.currentUser.uid)
    ref.on("child_changed", function(snapshot) {
          var changedPost = snapshot.val();
          var key = snapshot.key
         // console.log(changedPost, key);
          if(key === "active" && !changedPost)
          {
            queueIsNotLoad = true
            loadDataFromServer(authRef.currentUser.uid)
          }  
      });
}


clientAuth.prototype.setProductDetailOnChange = function ()
{
        var ref = dataRef.child("product")
        ref.on("child_changed", function(snapshot) {
             productDetails[snapshot.key] = snapshot.val()  
        });
}
var clientDatabase = new clientAuth()

/*
    Porpose : It check that User is Autheticated or not, if not It redirect to login page.
                when user logout It destoy session from the node.

             dependency : SendRequest :- send request to node for destroy session. alertMsg :- on error show alert box
*/

firebase.auth().onAuthStateChanged(function(user) 
{
  if(user&& localStorage["firebaseAuth:"+firebase.auth().currentUser.uid] === "qazwsxedc")
  {
      firebase.auth().currentUser.t = localStorage["firebaseAuth:"+firebase.auth().currentUser.uid] 
       storeCurrentPage()
  }
  else
  { 
        location.href = "/"
  }
});



/*
    Porpose : For logout , and redirect to login page.
      dependency : signout 
*/


var logout = document.getElementById("logout")

logout.addEventListener("click", function ()
{
    if(connectionStatus())
    {
        localStorage["firebaseAuth:"+firebase.auth().currentUser.uid] 
        firebase.auth().signOut().then(function(s)
        {
           // console.log(s)
            localStorage.currentPage="";
            //console.log ("logout")
       
        }).catch (error=>{

            spinner.setAttribute("hidden",true);alertMsg ("Cant log out.")
        
        })
    }
    else{
        spinner.setAttribute("hidden",true);alertMsg("You are Offline.");
    }
})

var box=document.getElementById("box");

var orderTab = document.getElementById ("orderDiv");

var orderBody = document.getElementById ("orderBody");

var productsTab=document.getElementById("productsDiv");

var btnHistory = document.getElementById("orderHistory");

var orderHistoryDiv=document.getElementById("orderHistoryDiv");

var ttl=document.getElementById("ttl");

var spinner=document.getElementById("loader");

var isHistoryDataReceived= false;

var btnBuy=document.getElementById('btnBuy');

var totalNumberOfCatLi = 0;

var totalNumberOfCatDiv = 0;
var catHeading=document.querySelector(".cat-heading");
var catTable=document.querySelector("#cat-table");
var productRow=document.querySelector("#product-row table tbody tr");;
var emptyCat=document.querySelector("#empty-cat");
var orderTable=document.querySelector("#order-table");
var orderRow=document.querySelector("#order-row table tbody tr");


/*
    Porpose : It get All queue product from the queue, 

    input : uid of login user

    output : make dom of that queue.

   dependency  :- clientdatabase.getQueue.
        :- updateContentOfPage
*/
clientDatabase.setProductDetailOnChange();

function loadDataFromServer(uid)  //changed null to uid
{
    if(queueIsNotLoad)
    {
        queueIsNotLoad = false      
        if(connectionStatus())
        {
            clientDatabase.getQueue (uid ,function(ordr)
            {
                if(ordr)
                {
                    if(ordr.active)
                    {
                            for(key in ordr.order)
                            {
                                        var item = ordr.order[key];                    
                                        spinner.setAttribute('hidden',true);
                                        updateContentOfPage(key, item.quantity, item.price ,  ordr.numberOfProduct, ordr.amount);                
                            }
                    }
                    else
                    {
                          var  wantToLoadQueue  = confirm("Do You want to load previous queue");
                          if(wantToLoadQueue)
                          {
                                    for(key in ordr.order)
                                    {
                                                var item = ordr.order[key];
                                                console.log(item)

                                                var pid=key.split(DELIMITER);
                                                var info = {
                                                    pkgId : pid[1],
                                                    productId : pid[0]
                                                }
                                                clientDatabase.increment(info, item.quantity)
                                                .then(array=>{
                                                    if(array[1])
                                                    {
                                                            clientDatabase.setProductQuantityInQueue(key ,parseInt( array[1]))
                                                            updateContentOfPage(key, array[1], item.price ,  ordr.numberOfProduct, ordr.amount)
                                                    }
                                                })
                                                updateContentOfPage(key, item.quantity, item.price ,  ordr.numberOfProduct, ordr.amount); 
                                                spinner.setAttribute('hidden',true);
                                    }
                                    var updateObj ={};
                                    updateObj["queue/"+uid+"/lastRequestTime"]  = -Date.now();
                                    updateObj["queue/"+uid+"/active"]  = true;
                                    dataRef.update(updateObj).catch(error=>{alertMsg("server error"); console.log(error)})      
                          }
                          else
                          {
                          	for(key in ordr.order){
		                      updateContentOfPage(key,0,0,0,0);  
		              }
                                dataRef.child("queue/"+uid).remove()
                          }
                    }
                }
                  spinner.setAttribute("hidden",true);
            })
           
        }
        else
        {
            spinner.setAttribute("hidden",true);
            alertMsg("You are Offline.");
        }
       
    }
}

/*
 function invoke when click on Buy
 Porpose : for sending request to Adminfor deliver product
   dependency  :- clientdatabase.getQueue.
                       :- updateContentOfPage
*/

btnBuy.addEventListener('click',function(event)
{   
    //alert("sdhsagdhg")
    if(orderBody.querySelector("tr"))
    {
     if(connectionStatus())
        {
            btnBuy.disabled=true;
            clientDatabase.sendOrder(function(error, order)
            {
                if(error){
                    alertMsg(error)
                }
                else{
                    orderBody.innerHTML="";       
                    var head=orderHistoryDiv.querySelector("div");
                    orderHistoryDiv.innerHTML="";
                    orderHistoryDiv.appendChild(head);
                    $("#orderPopUp").modal('hide');
                    spinner.setAttribute("hidden",true);
                    alertMsg("Sucessfully ordered.");
                    isHistoryDataReceived=false;
                    showHistoryPage();
                    for(key in order){
                      updateContentOfPage(key,0,0,0,0);  
                    }
                }
            })
        }
          else
          {
	        $("#orderPopUp").modal('hide');
	        spinner.setAttribute("hidden",true);alertMsg("You are Offline.");
          }
    }else{
    	        $("#orderPopUp").modal('hide');
	        spinner.setAttribute("hidden",true);alertMsg("select Some product.");
    }
  
});

var catObj=[];
    // request for categories id and name

/*
    Porpose : It request to firebase for getting categories and after getting product these categories are added to the queue.

    dependency :-  GetBriefCategories
            :-  addProductIntoDom
*/

function addCategoriesIntoDom()
{
    spinner.setAttribute("hidden",true);
     if(connectionStatus()){

    document.querySelector(".container").removeAttribute("hidden")

    clientDatabase.getBriefCategories( function(obj)
    {
        if(obj)
        {
            var ul=document.getElementById('dropdown');
            var objLength=Object.keys(obj).length;
            var numberOfCat=0;

            for(key in obj)
            {

                var li=document.createElement('li');

                var anchor=document.createElement('a');

                anchor.setAttribute("href",'#');
                
                anchor.setAttribute("name",key);

                var name=obj[key].name.toUpperCase();

                anchor.innerHTML= name ;

                li.appendChild(anchor);

                ul.appendChild(li);

                   var cloneCatHeading=catHeading.cloneNode(true);
                    cloneCatHeading.querySelector('b').innerHTML=obj[key].name.toUpperCase();
                    cloneCatHeading.setAttribute('id',key);
                    productsTab.appendChild(cloneCatHeading);
                      
                     numberOfCat++;
                    if(objLength==numberOfCat)
                    {
                        addProductsIntoDom();
                    }
                   
            }
        }
    })

      }
    else{
        // when user is Offline it show alert box for not Disconnecting
        spinner.setAttribute("hidden",true);
        alertMsg("You are Offline.");
    }
}

/*
    Porpose : After  getting all Category from database, it request for products and add to dom according to there category
   dependency : GetPRoductDetails: return all product.
        loadDataFromServer : load queue from data

*/

function addProductsIntoDom()
{
    clientDatabase.getProductDetails(function(items)
    {
        if(items)
        {
            productDetails=items;
            for( key in items )
            {
                var item=items[key];
                var catDiv=document.getElementById(item.category);
                if(catDiv.querySelector('.empty-cat'))
                {
                        catDiv.removeChild(catDiv.querySelector('.empty-cat'));
                        catDiv.querySelector(".table-responsive").removeAttribute("hidden");
                }
                var tbody=catDiv.querySelector(".table-responsive table tbody");
                var pack=item.packaging;
                var numOfItems=Object.keys(items).length;
                var n=0;
                for(var i=0;i<pack.length;i++)
                {
                        n++;
                        var cloneProductRow=productRow.cloneNode(true);
                        var pid=key + delimiter + i ;
                        cloneProductRow.setAttribute("id",pid+"-m");                

                        var unit="";

                        if(pack[i]<1)
                        {
                                unit=1000 * pack[i];
                                if(item.measuredIn=="kg")
                                {
                                    unit = " - "+ unit+ "gms";
                                }
                                if(item.measuredIn=='L')
                                {
                                      unit = " - "+ unit+ "mL";
                                }   
                        }
                        else
                        {
                            unit=" - " + pack[i] + item.measuredIn; 
                        }

                        var tds=cloneProductRow.querySelectorAll('td');
                        anchors=tds[0].querySelectorAll("a");
                        // console.log("anchors",anchors);
                        anchors[0].setAttribute('id',pid);
                        anchors[1].setAttribute('id',pid);

                        tds[0].querySelector(".quantity").setAttribute("id",pid+'-q');
                        tds[1].setAttribute('id',pid);
                        tds[0].querySelector("input").style.width="26px";

                        tds[1].querySelector("i").innerHTML=item.purchasedFrom;

                        tds[1].innerHTML=item.name + unit + tds[1].innerHTML;
                        tds[2].innerHTML=Math.ceil(item.price * pack[i])+ ".00";
                        if(tds[3])
                        {
                            tds[3].setAttribute('id',pid+"-a");
                        }
                        tbody.appendChild(cloneProductRow);
                    }
                     if(n === numOfItems)
                     {
                            loadDataFromServer(authRef.currentUser.uid);
                           clientDatabase.changeDetect(authRef.currentUser.uid);
                     } 
                }

            }       

        });
}

/*
    This function used to update content of DOM
    Porpose : When LoadDataFromServer Function is Called, It Retrieve the queue from the Database, then according to That value it update the DOM.
    input : id of Product, Quantity Of the Product, Price, Total Number of selected Product 

    output : Build or update the DOM
*/

function updateContentOfPage(id, quantity,productAmount,numberOfProduct,totalAmount,isLoadData=false)
{

        spinner.setAttribute("hidden",true);
        var idq = productsTab.querySelector("#" +id + "-q");
        var orderAmount=document.getElementById("orderAmount");
        idq.value=parseInt(quantity);
        idq.style.width = (14+ (quantity.toString().length * 12)) + 'px';

        if(productsTab.querySelector("#" +id + "-a"))
        {

            var ida=productsTab.querySelector("#" +id + "-a");
            
            productAmount=parseInt(productAmount) * parseInt(quantity);

            ida.innerHTML=productAmount+".00";
         }

        orderAmount.innerHTML= "<i class='fa fa-shopping-bag' aria-hidden='true'></i> "+totalAmount+".00 Rs." + "<span class='badge'>"+numberOfProduct +"</span>";
        
        ttl.innerHTML=totalAmount + ".00 Rs";

        var row=productsTab.querySelector('#'+ id + "-m");

        var cloneProductRow=row.cloneNode(true);

         if(orderTab.querySelector("#" +id +'-m')) 
         {

            if(parseInt(quantity))
            {
                //console.log(orderTab.querySelector("#" +id +"-m").innerHTML);
                orderTab.querySelector("#" +id +"-m").innerHTML=productsTab.querySelector("#" +id +"-m").innerHTML;
                orderTab.querySelector("#" +id +"-q").value=productsTab.querySelector("#" +id +"-q").value;
            }  
            else
            {
                orderBody.removeChild(orderTab.querySelector("#" +id +"-m" ));
            }
        }
        else
        {
            if(parseInt(quantity))
            {
                orderBody.appendChild(cloneProductRow); 
            }
        }
}

/*
    Porpose : When User Clicck on Increase Button , this Function is called. it decrease the Product quantity from
    Stock, and add into the Queue of the Product, after It add this product  into the user Queue. (This function call
    Two function clientAuth.increment and clientAuth.addInQueue).

    Input : Id Of the Product with Quantity to be added.

    Output : increment the Quantity of product and also total amout of the product 

    dependency : clientDatabase.increment, 
            clientDatabase.addIntoQueue.
            update contentOfPage 
*/

function increaseInQuantity( id )
{
       if(connectionStatus())
       {
            spinner.removeAttribute('hidden');
            var ide=document.getElementById(id);
            var pid=id.split(DELIMITER);
            var info = {
                pkgId : pid[1],
                productId : pid[0]
            }
            var isQueueUpdate = false;
            var queueIsNotUpdateOnTime = false

            setTimeout(function(){
                spinner.setAttribute('hidden',true);
                if(isQueueUpdate === false)
                {
                        alertMsg("You are not connected to internet")
                        queueIsNotUpdateOnTime = true;
                    
                }}, 5000);

                var array =  clientDatabase.checkStock(info)
                
                if(array)
                {
                    var object = array[0];
                    clientDatabase.addInQueue(authRef.currentUser.uid, info, object,function(error, obj)
                    {
                        isQueueUpdate = true;
                        if(error)
                        {
                                 console.log(error)
                                 alertMsg("server error")
                                 clientDatabase. decrement(info);
                                spinner.setAttribute('hidden',true);
                                return;
                        }
                        if(queueIsNotUpdateOnTime)
                        {
                                clientDatabase.deleteInQueue(authRef.currentUser.uid, info)
                                clientDatabase. decrement(info);
                        }
                        else
                        {
                            var item=obj.item;
                            updateContentOfPage(id, item.quantity, item.price, obj.numberOfProduct,obj.amount);
                            clientDatabase. increment(info)
                            .catch(error=>{
                                console.log(error)

                            })
                        }
                    })
                }
                else
                {
                    alertMsg("")
                     spinner.setAttribute("hidden",true)
                }
            
        }
        else{
            spinner.setAttribute("hidden",true);alertMsg("You are Offline.");
        }
}

/*
    This function request to server to decrease a product having id=id from queue and decrease in stock by 1
    dependency : decrement,
                   deleteInQueue
*/

function decreaseInQuantity(id)
{
    if(connectionStatus())
    {
        spinner.removeAttribute('hidden');
        var ide=document.getElementById(id);
        var pid=id.split(delimiter);
        var info = {
            pkgId : pid[1],
           productId : pid[0]
       }
       var queueUpdate = false;
       var queueIsNotUpdateOnTime = false;
        setTimeout(function()
        {
                spinner.setAttribute('hidden',true);
                if(queueUpdate === false)
                {
                    queueIsNotUpdateOnTime = true
                    alertMsg("You are not connected to internet")
                }
        }, 5000);
        clientDatabase.deleteInQueue(authRef.currentUser.uid, info, function(error, obj)
        {
               queueUpdate = true;
                if(error)
                {
                    spinner.setAttribute("hidden",true);
                    alertMsg(' Already 0 product!'); 
                    spinner.setAttribute('hidden',true);      
                    return;
                }
          
                var item = obj.item;
                if(queueIsNotUpdateOnTime)
                {
                        var numberOfProduct = obj.numberOfProduct;
                        var amount = obj.amount + item.price;
                        console.log("product is not increment on time");
                        if(!item.quantity)
                        {
                                ++numberOfProduct;
                        }
                        ++item.quantity;
                        clientDatabase.setQueue(authRef.currentUser.uid, info, item, numberOfProduct, amount);
                        return;
                }

                updateContentOfPage( id, item.quantity, item.price, obj.numberOfProduct,obj.amount); 
       
                clientDatabase.decrement(info).then (function(object)
                {
                       //console.log (obj);
                 })
                .catch (function (reject)
                {
                    console.log (reject)
                    spinner.setAttribute("hidden",true);alertMsg("server error"); 
                    spinner.setAttribute('hidden',true);      
                })
        })
        
    }
    else 
    {
        alertMsg("You are Offline.")
    }
}

var btnHome=document.getElementById("btnHome");

btnHome.addEventListener('click',function(event)
{
      showHomePage();  
});

btnHistory.addEventListener("click",function(event)
{
        showHistoryPage();   
});
     
/*
    Porpose : Show Home page of Client , and hide every other page.
*/

function showHomePage()
{
        localStorage.currentPage=0;
        btnHome.parentNode.setAttribute("class","active");
        btnHistory.parentNode.removeAttribute('class','active'); 
        orderHistoryDiv.setAttribute("hidden", true);
        productsTab.removeAttribute("hidden");
        
        if(!isProductsReceived)
        {
             addCategoriesIntoDom();
            isProductsReceived=true;
        }
}

/*
    Porpose : Show History of the  user.
*/

var isProductsReceived=false;
function showHistoryPage()
{
    btnHistory.parentNode.setAttribute("class","active");
    btnHome.parentNode.removeAttribute('class','active');
    localStorage.currentPage=1;
    productsTab.setAttribute("hidden", true);    
    orderHistoryDiv.removeAttribute("hidden");

    if(isHistoryDataReceived==false)
    {
        if(connectionStatus())
        {
            isHistoryDataReceived=true;
            var head=orderHistoryDiv.querySelector("div");
            orderHistoryDiv.innerHTML="";
            orderHistoryDiv.appendChild(head);
        
            clientDatabase.getOrder(function(obj)
            {
                for(key in obj)
                {
                    var order=obj[key];
                    var cloneOrderTable=orderTable.cloneNode(true);
                    orderHistoryDiv.insertBefore(cloneOrderTable, orderHistoryDiv.childNodes[1]);
                    //orderHistoryDiv.appendChild(cloneOrderTable);
                    var date=convertTimeStampIntoDate(-order.date);
                    cloneOrderTable.querySelector(".col-md-10").innerHTML+=date;
                    if(order.pendingStatus==true)
                    {
                        cloneOrderTable.querySelector(".col-md-2").setAttribute("style","color:red;");
                        cloneOrderTable.querySelector(".col-md-2 i").removeAttribute("class");
                        cloneOrderTable.querySelector(".col-md-2 i").setAttribute("class","fa fa-clock-o");
                    }
                    cloneOrderTable.querySelector(".total-amount").innerHTML=order.amount+".00";
                    for(key in order.order)
                    {

                        var item=order.order[key];
                 

                        var tableTbody = cloneOrderTable.querySelector("tbody");
                        var cloneOrderRow=orderRow.cloneNode(true);
                        tableTbody.appendChild(cloneOrderRow);
                        var tds = cloneOrderRow.querySelectorAll("td");
                        tds[0].setAttribute("id",key);

                        var unit="";
                        if(item.packaging<1)
                        {
                            unit=1000 * item.packaging;
                            if(item.measuredIn=="kg")
                            {
                                unit = " - "+ unit+ "gms";
                            }
                            if(item.measuredIn=='L')
                            {
                                unit = " - "+ unit+ "ml";
                            }
                        }
                        else
                        {
                            unit=" - " + item.packaging + item.measuredIn; 
                        }
                        tds[0].innerHTML=item.name + unit;
                        tds[1].innerHTML=item.quantity;
                        tds[2].innerHTML=item.price+ ".00";
                        if(tds[3])
                        {
                            if(order.pendingStatus == false)
                             {
                                    if(item.productPendingStatus == false)
                                    {
                                        tds[4].querySelector("i").removeAttribute("class")
                                        tds[4].querySelector("i").setAttribute("class", "fa fa-check")
                                        tds[3].innerHTML=(item.price*item.quantity) + ".00";
                                    }
                                    else
                                    {
                                        tds[4].querySelector("i").removeAttribute("class")
                                        tds[4].querySelector("i").setAttribute("class", "fa fa-times")
                                        tds[3].innerHTML = "_._"      
                                      
                                    }
                             }
                             else
                             {
                                    tds[3].innerHTML=(item.price*item.quantity) + ".00";
                             }
                            
                        }

                  }
                }
            })
        } 
        else
        {
            spinner.setAttribute("hidden",true);alertMsg("You are Offline.");
        }
    }
    else
    {
        productsTab.setAttribute("hidden", true);  
        orderHistoryDiv.removeAttribute("hidden");
    }
}

/*
    Show Product Details if It has description.
*/

function showProductDetails(id)
{
    var pid=id.split(delimiter);
    var item=productDetails[pid[0]];
    var modal=document.getElementById("productPopUp");    
    if(item.description){
         modal.querySelector("#desc").innerHTML="<b>Description</b> : " +item.description;
        $("#productPopUp").modal('show');
    }
}

var pastQuatity = 0

function updateQuantity(event)
{
       // event.target.style.width = (10+((event.target.value).length * 12)) + 'px';
       if(parseInt(event.target.value)<0){
        event.target.value=0;
        alertMsg("Quantity can not be <b>negative</>.");
        return;
       }
        if(event.target.value==""){
            event.target.value=0;
          }

        var target = event.target;
        var value = parseInt(target.value);
        var id = getId(target.id);

       clientDatabase.getProductFromQueue(id, function(result)
        {

            if(result)
            {
                var inQueueQuantity = result.quantity;
                if(!value){
                    event.target.value=0;
                    value=0;
                }
                var updatingValue = value - inQueueQuantity;

                var pid=id.split(DELIMITER);
                var info = {
                    pkgId : pid[1],
                    productId : pid[0]
                }
                if(updatingValue)
                {
                    clientDatabase. increment(info, updatingValue).then (function(array)
                    {
                        var object = array[0]
                        if(array[1])
                        	value =inQueueQuantity + array[1]

                            return clientDatabase.setProductQuantityInQueue(id, value)
                        
                    })
                    .then(obj => {
                                var item=obj.item;
                                updateContentOfPage( id, item.quantity, item.price, obj.numberOfProduct,obj.amount); 
                    })
                    .catch(error=>{
                        console.log(error)
                        alertMsg("Out of Stock");
    
                    })
                }
            }
            else
            {   
                if(value)
                {
                    var pid=id.split(DELIMITER);
                    var info = {
                        pkgId : pid[1],
                        productId : pid[0]
                    }
                    
                    clientDatabase. increment(info, value).then (function(array)
                    {
                        var object = array[0]
                        if(array[1])
                        {
                        	value =  array[1]
                        }
                        
                        clientDatabase.addInQueue(authRef.currentUser.uid, info, object, function(error, obj){
                            if(!error)
                            {
                                var item=obj.item;
                                updateContentOfPage( id, item.quantity, item.price, obj.numberOfProduct,obj.amount); 
                            }
                        }, value)
                    })
                    .catch(error=>{
                        console.log(error)
                        alertMsg("Out of Stock");
                       

                    })
                }
            }

        })
}

function resize(event){
 
  var charSize=12;
  if(event.target.keyCode== 8){
    charSize=-12;
  }
  var length=(event.target.value).length;
  if(length>4){
    length=4;
  }
  event.target.style.width = (14 +(length * 12 + charSize)) + 'px';
}

function getId(id)
{
    var l = id.length

    var Pid = id.slice( 0, l-2)
    
    return Pid
}

/*
    service worker for caching data
*/

if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');

  navigator.serviceWorker.register('/sw-client.js')
  .then(function(swReg) {
    console.log('Service Worker is registered', swReg);

  })
  .catch(function(error) {
    console.error('Service Worker Error', error);
  });
} else {
  console.warn('Push messaging is not supported');
}

function connectionStatus(){

    if(navigator.onLine){
        return true ; //alert("online");
    }
    else{
         return false;//alert("offline");
    }
}


/*
    product Object
*/
function Product( name , quantity, price, msr, measuredIn )
{
    msr = parseFloat(msr);
    this.name = name;
    this.quantity = quantity;
    this.price = Math.ceil(price*msr);
    this.packaging = msr;
    this.measuredIn = measuredIn;
}

/*

    convert the time stamp in basic date
*/

function convertTimeStampIntoDate(date){
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

/*
    when user buy Product , the mail is send to the user, this function is user to make the message body , according to information , and return the email body.

*/


function makeEmail( info )
{   
    var order=info.order;
    var table = "<h3>Thankyou for using our service<br>Products ordered by you:</h3><br>";
    table += "<table border = 1><tr> <th>Product Name</th> <th>Quantity</th> <th>Price</th> </tr>";
    for(key in order)
    {
        
        var item=order[key];
            
        table += "<tr><td>"+item.name+"</td> <td>"+item.quantity+"</td> <td>" + item.price+ "/"+item.packaging+item.measuredIn+"</td></tr>";
            
        
    }
    table += "<tr> <th></th> <th>Total</th> <th>"+info.amount+".00 Rs</th></tr></table>";
    return table;
}

$("body").on("click", "a",function(e){

    var fromTop = 80;
    var href= e.target.href;
    var route=window.location.origin+"/home"
    if(screen.width < 600)
        route+="-m"
    if(e.target.tagName!='a'){
       href= e.target.closest("a").href;
    }
    if(href.indexOf("#") > -1 ) {
        if(href.indexOf("#0")>-1){
            route += "#our-products"
        }
        else if(href.indexOf("#1")>-1){
            route += "#order-history";
        }
        else if(e.target.parentNode.parentNode.id=="dropdown"){
            
            route+="#category-" + e.target.innerHTML.toLowerCase();
            var ele=document.getElementById(e.target.name);
            var scroll_to=ele.offsetTop-80;
            //localStorage.currentPagePosition=scroll_to;

            $('html, body').animate({ scrollTop: scroll_to },{ duration: 'slow', easing: 'swing'});
        
            //window.scrollTo(0,scroll_to);
        }
        else{
            return;
        }

            if(history && "pushState" in history) {
                history.pushState({}, document.title, route );//
                return false;
            }
    }
});    

function storeCurrentPage(){
     spinner.setAttribute("hidden",true);
        if(localStorage.currentPage==1){
            showHistoryPage();
        }
        else{
            showHomePage();
            if(history && "pushState" in history) {
                if(window.location.href.indexOf("catrgory")>-1){
                history.pushState({}, document.title, window.location.origin +"/home" );
                return false;
                }
            } 
        }
}

//scroll_if_anchor(window.location.hash);


  $(document).ready(function(){
        $("#orderAmount").click(function(){
        $("#orderPopUp").modal('show');
        });
        
  });

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip({
        placement : 'top'
    });
});
function alertMsg(msg){
    var alertBox=document.getElementById("alertMsg");
        alertBox.querySelector('h4').innerHTML=msg;
        $("#alertMsg").modal('show');

}


 /*
    var package=parseFloat(item.packaging[pid[1]]);
    if(package<1){
        package=package * 1000;
        var unit="";
        if(item.measuredIn=="kg"){
            unit="gms";
        }
        else{
            unit="ml";
        }
    }
    var itemPrice= Math.ceil(parseInt(item.price)*parseFloat(item.packaging[pid[1]]));
    itemPrice = itemPrice + ".00 Rs "+'/' +package + " " + unit;
    modal.querySelector('#title').innerHTML="<b>Name</b> : " + item.name;
    modal.querySelector('#price').innerHTML="<b>Price</b> : " +itemPrice ;
    modal.querySelector('#fName').innerHTML="<b>Farmer</b> : " + item.purchasedFrom;
   
    if(item.picture){
    modal.querySelector(".thumbnail").removeAttribute("hidden");
    modal.querySelector("img").setAttribute("src",item.picture);
     }
     else{
       modal.querySelector(".thumbnail").setAttribute("hidden",true);
     }*/
