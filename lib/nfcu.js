var moment = require('moment');

/**
 * Represents a Navy Federal object.
 * @constructor
 * @param {string} cookie - Login cookie if you already have one
 */
function NFCU(cookie){
  var RestClient = require('node-rest-client').Client,
      rest = new RestClient(),
      API_BASE = "https://mservices.navyfcu.org/",
      DATE_FORMAT = "YYYY-MM-DD";

  var _cookie = cookie || undefined;


  /**
   * All request methods will return this style of callback
   * @callback navyFederalRequestCallback
   * @param {Object} data - Response from the server.
   * @param {string} res - Raw HTTP response if you need it.
   * @param {boolean} error - Will be true if an error happened.
   */

  var _getHeaders = function(extra){
    var headers = {
      "Accept": "application/json; charset=UTF-8",
      "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 6.0.1; Nexus 6P Build/MMB29M)", // imitate a Nexus 6P, praise DuARTe
      "Content-Type": "application/json",
      "Host": "mservices.navyfcu.org"
      // "Content-Encoding": "gzip"
    };

    if(_cookie !== undefined && _cookie.trim() !== "") headers["Cookie"] = _cookie;

    if(typeof(extra) === "object") for(var i in extra) headers[i] = extra[i];

    // console.log("[headers]".cyan, headers);

    return headers;
  }

  // Wrapper for GETting requests with authentication
  var _get = function(endpoint, params, callback){
    var _this = this;
    rest.get(API_BASE + endpoint, {
      headers: _getHeaders(),
      parameters: params || {}
    }, function(data, res){
      var endpointName = endpoint.split("/")[endpoint.split("/").length - 1];
      if(data[endpointName] && data[endpointName].status === "SUCCESS"){
        callback(data[endpointName].data, res, false);
      }else{
        callback(data, res, true);
      }
    });
  };

  // Wrapper for POSTing requests with authentication
  var _post = function(endpoint, postData, callback){
    var _this = this;
    rest.post(API_BASE + endpoint, {
      headers: _getHeaders(),
      data: JSON.stringify(postData)
    }, function(data, res){
      var endpointName = endpoint.split("/")[endpoint.split("/").length - 1];
      if(data[endpointName] && data[endpointName].status === "SUCCESS"){
        callback(data[endpointName].data, res, false);
      }else{
        callback(data, res, true);
      }
    });
  };

  /**
   * Logs into an account.
   * @param {string} accessNum - The user's access number, provided by Navy Federal to them.
   * @param {string} password - The user's password.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} A summary of the user if successful.
   */
  this.login = function(accessNum, password, callback){
    var _this = this;
    _post("Authenticator/services/loginv2", {
      appVersion: "6.0.1",
      deviceModel: "Nexus 6P", // praise DuARTe
      osPlatform: "AND",
      osVersion: "6.0.1",
      username: accessNum,
      password: password
    }, function(data, res){
      // store the user's cookie for later use
      if(res.headers["set-cookie"]) _cookie = res.headers["set-cookie"][0].split(";")[0];
      // multi-factor authentication
      // because banks are secure
      // but not really since it just accepts anything lol
      _post("MFA/services/riskCheck", {
        "areaCode": "14140",
        "cellTowerId": "22633985",
        "deviceId": "abcdefge8aca29a5", // not my actual device id
        "deviceModel": "Nexus 6P", // sure
        "deviceName": "angler",
        "devicePhoneNumber": "4204201337", // not my actual phone number
        "deviceSysName": "Android",
        "deviceSysVer": "6.0.1",
        "geoLocation": {
          "geoAlt": 0,
          "geoHead": 0,
          "geoHorAcc": 0,
          "geoLat": 0,
          "geoLong": 0,
          "geoSpeed": 0,
          "geoStatus": 2,
          "geoTimestamp": 0
        },
        "ipAddress": "192.0.0.4",
        "languages": "English",
        "macAddress": "02:00:00:00:00:00",
        "mcc": "310",
        "mnc": "260",
        "multitask": true,
        "osId": "397a78ee8aca29a5",
        "screenSize": "1440x2392",
        "simId": "66626097046666", // not my actual SIM id
        "transType": "LGN",
        "wifiNetworksData": {
          "bbsid": "00:00:00:00:00:00",
          "signalStrength": -127,
          "ssid": "0x",
          "stationName": "-1"
        }
      }, function(riskData, riskRes){
        callback(data, res);
      });
    });
  };

  /**
   * Gets a bunch of config info after authentication. Not really used.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} postAuthConfig object.
   */
  this.getPostAuthConfig = function(callback){
    _get("MobileConfig/services/postAuthConfig", { }, callback);
  };

  /**
   * Get a summary of the logged-in user.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} Information about the logged-in user.
   */
  this.getMemberSummary = function(callback){
    _get("ProfileService/services/memberSummary", { }, callback);
  };

  /**
   * Get a summary of all of the logged-in user's accounts.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} A summary of all of the user's accounts.
   */
  this.getAccountSummary = function(callback){
    _get("NativeBanking/services/accountSummary", { }, callback);
  };

  /**
   * Get specific details about an account ID.
   * @param {string} accountId - The account ID to get details for.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} A detailed object of the specified account ID.
   */
  this.getAccountDetails = function(accountId, callback){
    _post("NativeBanking/services/accountDetails", { accountId: accountId.toString() }, callback);
  };

  /**
   * Get scheduled transfers for a user.
   * @param {boolean} ach - Get internal ACH transfers? Default: false
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} Scheduled transfers for the logged-in user.
   */
  this.getScheduledTransfers = function(ach, callback){
    ach = ach || false;
    _get("NativeBanking/services/scheduledTransfers", { ach: (ach ? "y" : "n") }, callback);
  };

  /**
   * Get accounts for the logged-in user that are able to be transferred from or to.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} A summary of accounts that are transferrable.
   */
  this.getTransferAccounts = function(callback){
    _get("NativeBanking/services/transferAccountsList", { }, callback);
  };

  /**
   * Transfer money to an account from another right now.
   * @param {string} fromAccountId - The account ID to transfer money from.
   * @param {string} toAccountId - The account ID to transfer money to.
   * @param {Number} transferAmount - The amount to transfer.
   * @param {navyFederalRequestCallback} callback - Callback for the server response.
   * @returns {Object} Something, I actually haven't tested it (I get 6 transfers a month, I'll test it later!)
   */
  this.transferNow = function(fromAccountId, toAccountId, transferAmount, callback){
    _post("NativeBanking/services/transfer", {
      ach: false,
      fromAccountId: fromAccountId,
      toAccountId: toAccountId,
      transAmtType: "F",
      transFreq: "Manually",
      transferAmount: transferAmount,
      transferDate: moment().format(DATE_FORMAT),
      transferType: "INTERNAL"
    }, callback);
  };

  return this;
}

module.exports = NFCU;
