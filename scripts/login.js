loggedInPublicKey = ""
$.ajaxSetup({
  headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
  }
});

function getIP() {  
  $.getJSON('http://gd.geobytes.com/GetCityDetails?callback=?', function(data) {
  console.log(JSON.stringify(data, null, 2));
});
   } 

function getDeviceInfo(){

  var lang = navigator.language;
  var platform = navigator.platform;
  var URL = window.location.href;
  infoMap = {Language: lang, Platform: platform, Source: URL}
  return infoMap

}

function findHashtags(searchText) {
  var regexp = /\B\#\w\w+\b/g
  result = searchText.match(regexp);
  if (result) {
      return result
  } else {
      return false;
  }
}

/*responsible for user login*/
function login() {
  
  
 // getUserPosts("BC1YLhBLE1834FBJbQ9JU23JbPanNYMkUsdpJZrFVqNGsCe7YadYiUg", 50, "ItsAditya")
  identityWindow = window.open(
    "https://identity.bitclout.com/log-in?accessLevelRequest=2",
    null,
    "toolbar=no, width=800, height=1000, top=0, left=0"
  );
}
function handleInit(e) {
  if (!init) {
    init = true;
    iframe = document.getElementById("identity");

    for (const e of pendingRequests) {
      postMessage(e);
    }

    pendingRequests = [];
  }
  respond(e.source, e.data.id, {});
}

function handleLogin(payload) {
  console.log(payload);
  if (identityWindow) {
    identityWindow.close();
    identityWindow = null;
    loggedInPublicKey = payload.publicKeyAdded;

    isTxnSign = "signedTransactionHex" in JSON.parse(window.localStorage.getItem('identity')) //just a way to check if this is user login or post approval window
    if (!isTxnSign) {
      if (typeof loggedInPublicKey !== 'undefined') {
        localStorage.setItem("lastUser", JSON.stringify({ "publicKey": loggedInPublicKey }));
      }
      requestPayload = {"PublicKeyBase58Check":loggedInPublicKey,"Username":""}
      $.post(`https://tijn.club/api/v0/get-single-profile`, 
      JSON.stringify(requestPayload), // url
        function (data, textStatus, xhr) {  // success callback
          console.log("fetching posts...")
          username = data["Profile"]["Username"]
          numOfPostsToFetch = 50//fetching last 50 posts of user
          getUserPosts(loggedInPublicKey, numOfPostsToFetch, username)
        });
    }
    else if (JSON.parse(window.localStorage.getItem('identity'))["signedTransactionHex"]) {
      requestPayload = {TransactionHex: JSON.parse(window.localStorage.getItem('identity'))["signedTransactionHex"]}
      $.post(`https://tijn.club/api/v0/submit-transaction`,
      JSON.stringify(requestPayload),
        function (data, textStatus, xhr) {
          if(xhr.status == 200){
            alert("Post successful!")
          }

        })
    }
  }


}

function respond(e, t, n) {
  e.postMessage(
    {
      id: t,
      service: "identity",
      payload: n,
    },
    "*"
  );
}

function postMessage(e) {
  init
    ? this.iframe.contentWindow.postMessage(e, "*")
    : pendingRequests.push(e);
}

// const childWindow = document.getElementById('identity').contentWindow;
window.addEventListener("message", (message) => {
  console.log("message: ");
  // console.log(message);

  const {
    data: { id: id, method: method, payload: payload },
  } = message;

  console.log(id);
  console.log(method);
  console.log(payload);
  localStorage.setItem("identity", JSON.stringify(payload));

  if (method == "initialize") {
    handleInit(message);
  } else if (method == "login") {
    handleLogin(payload);
  }
});

var init = false;
var iframe = null;
var pendingRequests = [];
var identityWindow = null;


// code below is responsible for making post to bitclout
function makePost() {
  var txt = $("#postBodyForm").val();
  console.log(txt)
  if (txt == "") {
    window.alert("huh ? posting without any text ?")
  }
  else {
    loginData = JSON.parse(window.localStorage.getItem('lastUser'))
    console.log(loginData)
    publicKey = loginData["publicKey"]
    console.log(publicKey)
    postBody = txt
    tagList = findHashtags(postBody)
    hashtags = ""
    for(var i = 0; i< tagList.length; i++){
      hashtags += tagList[i] + " "
    }

    extraData = getDeviceInfo()
    extraData["HashTags"] = hashtags
    image = ""
    console.log(extraData)
    requestPayload = {UpdaterPublicKeyBase58Check:publicKey,PostHashHexToModify:"",ParentStakeID:"",Title:"",BodyObj:{Body:postBody,ImageURLs:[image]},RecloutedPostHashHex:"",PostExtraData:extraData,Sub:"",IsHidden:false,MinFeeRateNanosPerKB:1000}
    $.post(`https://tijn.club/api/v0/submit-post`, 
    JSON.stringify(requestPayload), 
      function (responseData, textStatus, xhr) {  // success callback
        console.log(responseData)
        txnHex = responseData.TransactionHex
        console.log(txnHex)
        identityWindow = window.open(`https://identity.bitclout.com/approve?tx=${txnHex}`, null,
          "toolbar=no, width=800, height=1000, top=0, left=0")
      });
  }

}