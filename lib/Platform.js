"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*eslint valid-jsdoc: off, require-jsdoc: off*/

var _BungieNet = require("./BungieNet.js");

var _BungieNet2 = _interopRequireDefault(_BungieNet);

var _Frame = require("./Frame.js");

var _Frame2 = _interopRequireDefault(_Frame);

var _FrameSet = require("./FrameSet.js");

var _FrameSet2 = _interopRequireDefault(_FrameSet);

var _FrameManager = require("./FrameManager.js");

var _FrameManager2 = _interopRequireDefault(_FrameManager);

var _PlatformRequest = require("./PlatformRequest.js");

var _PlatformRequest2 = _interopRequireDefault(_PlatformRequest);

var _Plugin = require("./Plugin.js");

var _Plugin2 = _interopRequireDefault(_Plugin);

var _Request = require("./Request.js");

var _Request2 = _interopRequireDefault(_Request);

var _urijs = require("urijs");

var _urijs2 = _interopRequireDefault(_urijs);

var _URITemplate = require("urijs/src/URITemplate");

var _URITemplate2 = _interopRequireDefault(_URITemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Platform
 */
var Platform = function () {
  _createClass(Platform, [{
    key: "_init",


    /**
     * Initialise objects
     * @return {undefined}
     */
    value: function _init() {

      /**
       * @type {Object}
       */
      this._options = Platform.defaultOptions;

      /**
       * @type {FrameSet}
       */
      this._frames = new _FrameSet2.default();

      /**
       * @type {FrameManager}
       */
      this._frameManager = new _FrameManager2.default(this._frames);

      /**
       * @type {Set<Plugin>}
       */
      this._plugins = new Set();

      //set default plugins
      this._plugins.add(new _Plugin2.default.CookieJarMemoryPlugin());
    }

    /**
    * @param {Object} opts = {}
    * @param {String} [opts.apiKey = ""] bungie.net API key
    * @param {Number} [opts.maxConcurrent = -1] - maximum concurrent requests, default is no limit
    * @param {Number} [opts.timeout = 5000] - network timeout in milliseconds
     */

  }]);

  function Platform() {
    var _this = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Platform);

    this._init();

    //copy any value in opts to this._options
    //only copy matching keys
    //DON'T use hasOwnProperty - opts could be any object and that's OK
    Object.keys(this._options).filter(function (x) {
      return x in opts;
    }).forEach(function (x) {
      _this._options[x] = opts[x];
    });
  }

  /**
   * Prepares the request and queues it
   * @param {Frame} frame - frame to prepare
   * @return {undefined}
   */


  _createClass(Platform, [{
    key: "_prepareRequest",
    value: function _prepareRequest(frame) {
      var _this2 = this,
          _listeners;

      frame.platformRequest = new _PlatformRequest2.default(frame);

      //set up a beforeSend handler to add other details
      frame.platformRequest.once(_PlatformRequest2.default.events.beforeSend, function () {

        var opts = frame.platformRequest.options;

        opts.timeout = _this2._options.timeout;
        opts.forever = true;
        opts.gzip = true;
        opts.headers[Platform.headers.contentType] = Platform.contentType;
        opts.headers[Platform.headers.apiKey] = _this2._options.apiKey;
      });

      //listen for frame info
      var listeners = (_listeners = {}, _defineProperty(_listeners, _PlatformRequest2.default.events.beforeSend, this._frameBeforeSend), _defineProperty(_listeners, _PlatformRequest2.default.events.httpSuccess, this._frameHttpSuccess), _defineProperty(_listeners, _PlatformRequest2.default.events.httpFail, this._frameHttpError), _defineProperty(_listeners, _PlatformRequest2.default.events.httpDone, this._frameHttpDone), _defineProperty(_listeners, _PlatformRequest2.default.events.responseParsed, this._frameResponseParsed), _defineProperty(_listeners, _PlatformRequest2.default.events.responseCorrupt, this._frameResponseCorrupt), _defineProperty(_listeners, _PlatformRequest2.default.events.error, this._frameError), _defineProperty(_listeners, _PlatformRequest2.default.events.success, this._frameSuccess), _defineProperty(_listeners, _PlatformRequest2.default.events.done, this._frameDone), _listeners);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var _step$value = _slicedToArray(_step.value, 2),
              eventName = _step$value[0],
              handler = _step$value[1];

          frame.platformRequest.on(eventName, function (p) {
            return handler.call(_this2, p);
          });
        };

        for (var _iterator = Object.entries(listeners)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }

        //queue it, then try the queue
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._queueFrame(frame);
      this._tryFrame();
    }

    /**
     * API-level request method
     * @param  {Request} req
     * @return {Promise.<Response>}
     */

  }, {
    key: "_serviceRequest",
    value: function _serviceRequest(req) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {

        var frame = new _Frame2.default();

        _BungieNet2.default.logger.log("info", "Received service request", {
          endpoint: req.uri.toString(),
          frameId: frame.id
        });

        frame.platform = _this3;
        frame.request = req;
        frame.serviceResolve = resolve;
        frame.serviceReject = reject;

        //construct the full path
        //copy any query string params
        //add the locale
        frame.request.uri = _BungieNet2.default.platformPath.segment(req.uri.path()).setSearch(req.uri.search(true));

        //urijs is smart enough to remove the trailing forward-slash
        //so add it back in manually
        if (!frame.request.uri.path().endsWith("/")) {
          frame.request.uri.path(frame.request.uri.path() + "/");
        }

        _this3._prepareRequest(frame);
      });
    }

    /**
     * @param {Frame} frame - frame to set as active
     */

  }, {
    key: "_queueFrame",


    /**
     * @param {Frame} frame - frame to queue
     */
    value: function _queueFrame(frame) {

      _BungieNet2.default.logger.log("verbose", "Frame queued", {
        frameId: frame.id
      });

      frame.state = _Frame2.default.state.waiting;
      this._frameManager.addFrame(frame);
    }

    /**
     * Attempts to begin a request, taking any conditiions into account
     * @return {Bool} true if frame was obtained and set active
     */

  }, {
    key: "_tryFrame",
    value: function _tryFrame() {

      _BungieNet2.default.logger.log("verbose", "Trying for a frame...");

      //check if too many ongoing requests
      if (this._options.maxConcurrent >= 0) {
        if (this._frameManager.getActive().size >= this._options.maxConcurrent) {
          _BungieNet2.default.logger.log("warn", "Cannot get a frame - too many active requests");
          return false;
        }
      }

      var frame = this._frameManager.getFrame();

      if (frame === null) {
        return false;
      }

      Platform._activeFrame(frame);

      return true;
    }

    /**
     * Updates plugins with the given event name and any data
     * @param {String} eventName
     * @param {*} args - arguments to be passed to plugin function
     * @return {Promise}
     */

  }, {
    key: "_notifyPlugins",
    value: function _notifyPlugins(eventName) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this._plugins[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var p = _step2.value;

          p.update.apply(p, [eventName].concat(args));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: "_frameBeforeSend",
    value: function _frameBeforeSend(e) {
      this._notifyPlugins(Platform.events.frameBeforeSend, e);
    }
  }, {
    key: "_frameHttpError",
    value: function _frameHttpError(e) {
      this._notifyPlugins(Platform.events.frameHttpError, e);
    }
  }, {
    key: "_frameHttpSuccess",
    value: function _frameHttpSuccess(e) {
      this._notifyPlugins(Platform.events.frameHttpSuccess, e);
    }
  }, {
    key: "_frameHttpDone",
    value: function _frameHttpDone(e) {
      e.target.frame.state = _Frame2.default.state.done;
      this._notifyPlugins(Platform.events.frameHttpDone, e);
    }
  }, {
    key: "_frameResponseParsed",
    value: function _frameResponseParsed(e) {
      this._notifyPlugins(Platform.events.frameResponseParsed, e);
    }
  }, {
    key: "_frameResponseCorrupt",
    value: function _frameResponseCorrupt(e) {
      this._notifyPlugins(Platform.events.frameResponseCorrupt, e);
    }
  }, {
    key: "_frameError",
    value: function _frameError(e) {
      this._notifyPlugins(Platform.events.frameError, e);
      e.target.frame.serviceReject();
    }
  }, {
    key: "_frameSuccess",
    value: function _frameSuccess(e) {
      this._notifyPlugins(Platform.events.frameSuccess, e);
      e.target.frame.serviceResolve(e.target.frame.response);
    }
  }, {
    key: "_frameDone",
    value: function _frameDone(e) {
      this._notifyPlugins(Platform.events.frameDone, e);
      this._frameManager.removeFrame(e.target.frame);
    }

    /// Platform Info/Options

    /**
     * Number of active requests
     * @return {Number}
     */

  }, {
    key: "applicationSearch",


    /// Application Service

    /**
     * @param {Number} ownerMembershipId - member id to search apps for
     * @param {Number} currentPage - result page
     * @return {Promise.<Response>}
     */
    value: function applicationSearch(ownerMembershipId) {
      var currentPage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      return this._serviceRequest(new _Request2.default(new _urijs2.default("/App/Search/"), "POST", {
        ownerMembershipId: ownerMembershipId,
        currentPage: currentPage
      }));
    }

    /**
     * @param {String} keyId - API key id
     * @param {BungieNet.enums.apiKeyStatus} state - new key state
     * @return {Promise.<Response>}
     */

  }, {
    key: "changeApiKeyStatus",
    value: function changeApiKeyStatus(keyId, state) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/ChangeApiKeyState/{keyId}/{state}/", {
        keyId: keyId,
        state: state
      }), "POST", null));
    }

    /**
     * Response: {
     *  apiKey: "-new-api-key",
     *  apiKeyId: 783639,
     *  authorizationUrl: "https://www.bungie.net/en/Application/Authorize/783639",
     *  creationDate: "2016-12-19T11:05:41.603Z",
     *  status: 1
     * }
     * @param {Number} appId - application id number
     * @return {Promise.<Response>}
     */

  }, {
    key: "createApiKey",
    value: function createApiKey(appId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/CreateApiKey/{appId}/", {
        appId: appId
      }), "POST", null));
    }

    /**
     * @param {Object} details
     * @param {Boolean} details.agreedToCurrentEula - true to agree
     * @param {String} details.link - website link for appId
     * @param {String} details.name - name of app
     * @param {String} details.origin - origin header
     * @param {String} details.redirectUrl - oauth redirect url
     * @param {BigNumber} details.scope - scope of app access
     * @return {Promise.<Response>}
     */

  }, {
    key: "createApplication",
    value: function createApplication(details) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/App/CreateApplication/"), "POST", details));
    }

    /**
     * @param {Object} details
     * @param {String} details.link - website link for app
     * @param {String} details.name - name of app
     * @param {String} details.origin - origin header
     * @param {String} details.redirectUrl - oauth redirect url
     * @param {BigNumber} details.scope - scope of app access
     * @param {BigNumber} details.status - app status
     * @return {Promise.<Response>}
     */

  }, {
    key: "editApplication",
    value: function editApplication(appId, details) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/EditApplication/{appId}/", {
        appId: appId
      }), "POST", details));
    }

    /**
     * @param {String} code - obtained from user
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAccessTokensFromCode",
    value: function getAccessTokensFromCode(code) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/App/GetAccessTokensFromCode/"), "POST", {
        code: code
      }));
    }

    /**
     * @param {String} refreshToken
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAccessTokensFromRefreshToken",
    value: function getAccessTokensFromRefreshToken(refreshToken) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/App/GetAccessTokensFromRefreshToken/"), "POST", {
        refreshToken: refreshToken
      }));
    }

    /**
     * @param {Number} appId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getApplication",
    value: function getApplication(appId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/Application/{appId}/", {
        appId: appId
      })));
    }

    /**
     * Response: [
     *  {
     *    "apiKeyId": 999,
     *    "apiKey": "-hex-str-",
     *    "authorizationUrl": "https://www.bungie.net/en/Application/Authorize/1",
     *    "creationDate": "2015-10-22T07:45:42.941Z",
     *    "status": 1
     *  },
     *  ...
     * ]
     * @param {Number} appId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getApplicationApiKeys",
    value: function getApplicationApiKeys(appId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/ApplicationApiKeys/{appId}/", {
        appId: appId
      })));
    }

    /**
     * Response: {
     *  "applicationId": 1,
     *  "name": "name of app",
     *  "redirectUrl": "https://example.com/app",
     *  "link": "",
     *  "scope": "129",
     *  "origin": "*",
     *  "applicationStatus": 1,
     *  "membershipId": "68974",
     *  "authorizationStatus": 1,
     *  "authExpirationDate": "2017-12-25T14:18:08.459Z",
     *  "authorizationDate": "2016-12-25T14:18:08.092Z",
     *  "sessionId": "4223682639057300080"
     * }
     * @param {BigNumber} membershipId
     * @param {Number} appId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAuthorizationForUserAndApplication",
    value: function getAuthorizationForUserAndApplication(membershipId, appId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/Authorization/{mId}/{appId}/", {
        mId: membershipId.toString(),
        appId: appId
      })));
    }

    /**
     * Response: {
     *  "results": [
     *    {
     *      "applicationId": 1,
     *      "name": "name of app",
     *      "redirectUrl": "https://example.com/app",
     *      "link": "",
     *      "scope": "129",
     *      "origin": "*",
     *      "applicationStatus": 1,
     *      "membershipId": "68974",
     *      "authorizationStatus": 1,
     *      "authExpirationDate": "2017-12-25T14:18:08.459Z",
     *      "authorizationDate": "2016-12-25T14:18:08.092Z",
     *      "sessionId": "4223682639057300080"
     *    },
     *    ...
     *  ]
     * }
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAuthorizations",
    value: function getAuthorizations(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/Authorizations/{mId}/", {
        mId: membershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "privateApplicationSearch",
    value: function privateApplicationSearch() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/App/PrivateSearch/"), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId - membershipId of user who is revoking access
     * @param {Number} appId - id of the app user is revoking
     * @return {Promise.<Response>}
     */

  }, {
    key: "revokeAuthorization",
    value: function revokeAuthorization(membershipId, appId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/App/RevokeAuthorization/{mId}/{appId}/", {
        mId: membershipId.toString(),
        appId: appId
      }), "POST", null));
    }

    /// User Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "createUser",
    value: function createUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/CreateUser/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "editSuccessMessageFlags",
    value: function editSuccessMessageFlags(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/MessageFlags/Success/Update/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAvailableAvatars",
    value: function getAvailableAvatars() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetAvailableAvatars/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAvailableAvatarsAdmin",
    value: function getAvailableAvatarsAdmin(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/GetAvailableAvatarsAdmin/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAvailableThemes",
    value: function getAvailableThemes() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetAvailableThemes/")));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {BungieNet.enums.bungieMembershipType} membershipType
     */

  }, {
    key: "getBungieAccount",
    value: function getBungieAccount(membershipId, membershipType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/GetBungieAccount/{membershipId}/{membershipType}/", {
        membershipId: membershipId.toString(),
        membershipType: membershipType
      })));
    }

    /**
     * @param {BigNumber} membershipId - bungie.net memberId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getBungieNetUserById",
    value: function getBungieNetUserById(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/GetBungieNetUserById/{membershipId}/", {
        membershipId: membershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCountsForCurrentUser",
    value: function getCountsForCurrentUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetCounts/")));
    }

    /**
     * @return {Promise.<Response>}
     * Response: [
     *  {
     *    credentialType: 2,
     *    credentialDisplayName: "Psnid",
     *    isPublic: false
     *  },
     *  ...
     * ]
     */

  }, {
    key: "getCredentialTypesForAccount",
    value: function getCredentialTypesForAccount() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetCredentialTypesForAccount/")));
    }

    /**
     * @return {Promise.<Response>}
     * Response: {
     *  destinyAccounts: [],
     *  bungieNetUser: {},
     *  clans: [],
     *  relatedGroups: {},
     *  destinyAccountErrors: []
     * }
     */

  }, {
    key: "getCurrentBungieAccount",
    value: function getCurrentBungieAccount() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetCurrentBungieAccount/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCurrentUser",
    value: function getCurrentUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetBungieNetUser/")));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: [
     *  {
     *    AppInstallationId: "-guid-",
     *    AppType: "BnetMobile",
     *    DeviceName: "Nexus",
     *    DeviceType: 3,
     *    MembershipId: "-bungie.net membership id-",
     *    MembershipType: "-bnext enum-",
     *    PairId: "-BigNumber-",
     *    PairingDate: "iso date string"
     *  }
     *  ...
     * ]
     */

  }, {
    key: "getMobileAppPairings",
    value: function getMobileAppPairings() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetMobileAppPairings/")));
    }

    /**
     * @return {Promise.<Response>}
     * @example {@see getMobileAppPairings}
     */

  }, {
    key: "getMobileAppPairingsUncached",
    value: function getMobileAppPairingsUncached() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetMobileAppPairingsUncached/")));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: [
     *  {
     *    notificationSettingId: "-BigNumber-",
     *    membershipId: "-BigNumber-",
     *    optInFlags: "",
     *    scheduleFlags: 0,
     *    notificationMethod: "-BigNumber-",
     *    notificationType: "-BigNumber-",
     *    displayName: "New Messages",
     *    settingDescription: "Tell me if I have a new Bungie.net Private Message",
     *    possibleMethods: 7
     *  },
     *  ...
     * ]
     */

  }, {
    key: "getNotificationSettings",
    value: function getNotificationSettings() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetNotificationSettings/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPartnerships",
    value: function getPartnerships(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/{p1}/Partnerships/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: [
     *  {
     *    apiKey: "hex",
     *    ownerMembershipId: "0",
     *    creationDate: "iso date string",
     *    expirationDate: "iso date string",
     *    apiEulaVersion: 1
     *  }
     * ]
     */

  }, {
    key: "getPlatformApiKeysForUser",
    value: function getPlatformApiKeysForUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetPlatformApiKeysForUser/")));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: "/ExpireWebAuth.ashx?..."
     */

  }, {
    key: "getSignOutUrl",
    value: function getSignOutUrl() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/GetSignOutUrl/")));
    }

    /**
     * @param {BigNumber} membershipId - bungie.net membership id
     * @return {Promise.<Response>}
     * @example
     * Response: [
     *  {
     *    userAliasId: "-BigNumber-",
     *    membershipId: "-BigNumber-",
     *    akaDisplayName: "-the-alias-",
     *    akaUniqueName: "-the-unique-name-",
     *    changedDate: "-date-string-"
     *  },
     *  ...
     * ]
     */

  }, {
    key: "getUserAliases",
    value: function getUserAliases(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/GetUserAliases/{membershipId}/", {
        membershipId: membershipId.toString()
      })));
    }

    /**
     * @param {Boolean} [excludeBungieNet = false] - exclude bungie.net member id
     * @return {Promise.<Response>}
     * @example
     * Response: {
     *  -id-as-key-: -membership-type-as-value-,
     *  "68974": 254,
     *  ...
     * }
     */

  }, {
    key: "getUserMembershipIds",
    value: function getUserMembershipIds() {
      var excludeBungieNet = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/GetMembershipIds/{?excludebungienet}", {
        excludebungienet: excludeBungieNet
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "linkOverride",
    value: function linkOverride() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/LinkOverride/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "registerMobileAppPair",
    value: function registerMobileAppPair() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/RegisterMobileAppPair/"), "POST", {}));
    }

    /**
     * @param {*} p1
     * @return {Promise.<Response>}
     */

  }, {
    key: "removePartnership",
    value: function removePartnership(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/Partnerships/{p1}/Remove/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @param {String} username - query to search for
     * @return {Promise.<Response>}
     * @example
     * Response: [
     *  { user information },
     *  ...
     * ]
     */

  }, {
    key: "searchUsers",
    value: function searchUsers(username) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/SearchUsers/{?q}", {
        q: username
      })));
    }

    /**
     * @param {String} username - search query
     * @param {Number} [page = 1] - 1-based page number
     * @return {Promise.<Response>}
     * @example {@see searchUsers}
     */

  }, {
    key: "searchUsersPaged",
    value: function searchUsersPaged(username) {
      var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/SearchUsersPaged/{searchTerm}/{page}/", {
        searchTerm: username,
        page: page
      })));
    }

    /**
     * @param {String} username - search query
     * @param {Number} [page = 1] 1-based page number
     * @param {*} [p3 = null] UNKNOWN
     * @return {Promise.<Response>}
     * @example {@see SearchUsersPaged}
     */

  }, {
    key: "searchUsersPagedV2",
    value: function searchUsersPagedV2(username) {
      var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var p3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/SearchUsersPaged/{searchTerm}/{page}/{p3}/", {
        searchTerm: username,
        page: page,
        p3: p3
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "setAcknowledged",
    value: function setAcknowledged(ackId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/Acknowledged/{ackId}/", {
        ackId: ackId
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "unregisterMobileAppPair",
    value: function unregisterMobileAppPair(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/UnregisterMobileAppPair/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "updateDestinyEmblemAvatar",
    value: function updateDestinyEmblemAvatar() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/UpdateDestinyEmblemAvatar/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "updateNotificationSetting",
    value: function updateNotificationSetting() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/Notification/Update/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "updateStateInfoForMobileAppPair",
    value: function updateStateInfoForMobileAppPair() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/UpdateStateInfoForMobileAppPair/"), "POST", {}));
    }

    /**
     * Updates the user with the given options
     * @link https://destinydevs.github.io/BungieNetPlatform/docs/UserService/UpdateUser#/JSON-POST-Parameters
     * @param  {Object} opts
     * @return {Promise.<Response>}
     */

  }, {
    key: "updateUser",
    value: function updateUser(opts) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/User/UpdateUser/"), "POST", opts));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "updateUserAdmin",
    value: function updateUserAdmin(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/User/UpdateUserAdmin/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /// Message Service

    /**
     * @param {BigNumber[]} membersTo - array of memberIDs
     * @param {String} body - body of the message
     * @return {Promise.<Response>}
     */

  }, {
    key: "createConversation",
    value: function createConversation(membersTo, body) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/CreateConversation/"), "POST", {
        membersToId: membersTo.map(function (bn) {
          return bn.toString();
        }),
        body: body
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "createConversationV2",
    value: function createConversationV2() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/CreateConversationV2/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllianceInvitedToJoinInvitations",
    value: function getAllianceInvitedToJoinInvitations(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/AllianceInvitations/InvitationsToJoinAnotherGroup/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllianceJoinInvitations",
    value: function getAllianceJoinInvitations(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/AllianceInvitations/RequestsToJoinYourGroup/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })));
    }

    /**
     * @param {BigNumber} conversationId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationById",
    value: function getConversationById(conversationId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationById/{conversationId}/", {
        conversationId: conversationId.toString()
      })));
    }

    /**
     * @param  {BigNumber} conversationId - conversation id
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationByIdV2",
    value: function getConversationByIdV2(conversationId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationByIdV2/{id}/", {
        id: conversationId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationsV2",
    value: function getConversationsV2(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationsV2/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationsV3",
    value: function getConversationsV3(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationsV3/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationsV4",
    value: function getConversationsV4(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationsV4/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @param {Number} [page = 1]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationsV5",
    value: function getConversationsV5() {
      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationsV5/{page}/", {
        page: page
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationThreadV2",
    value: function getConversationThreadV2(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationThreadV2/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * Get a page of a conversation
     * params.before can be set using BigNumber like so:
     * (new BigNumber(2)).pow(63).minus(1)
     * @param {Object} params
     * @param {BigNumber} params.id - conversation id
     * @param {Number} params.page - page to return
     * @param {BigNumber} params.before - message id filter
     * @param {BigNumber} params.after - message id filter
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationThreadV3",
    value: function getConversationThreadV3(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationThreadV3/{id}/{page}/{?after,before}", {
        id: params.id.toString(),
        page: params.page,
        after: params.after.toString(),
        before: params.before.toString()
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationWithMemberId",
    value: function getConversationWithMemberId(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationWithMember/{id}/", {
        id: membershipId.toString()
      })));
    }

    /**
     * @param  {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getConversationWithMemberIdV2",
    value: function getConversationWithMemberIdV2(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetConversationWithMemberV2/{id}/", {
        id: membershipId.toString()
      })));
    }

    /**
     * @param  {Number} [page = 1] - 1-based
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupConversations",
    value: function getGroupConversations() {
      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/GetGroupConversations/{page}/", {
        page: page
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getInvitationDetails",
    value: function getInvitationDetails(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/Invitations/{p1}/Details/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getTotalConversationCount",
    value: function getTotalConversationCount() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/GetTotalConversationCount/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUnreadConversationCountV2",
    value: function getUnreadConversationCountV2() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/GetUnreadPrivateConversationCount/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUnreadConversationCountV3",
    value: function getUnreadConversationCountV3() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/GetTotalConversationCountV3/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUnreadConversationCountV4",
    value: function getUnreadConversationCountV4() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/GetUnreadConversationCountV4/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUnreadGroupConversationCount",
    value: function getUnreadGroupConversationCount() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/GetUnreadGroupConversationCount/")));
    }

    /**
     * Leave a given conversation by id
     * @param  {BigNumber} conversationId
     * @return {Promise.<Response>}
     */

  }, {
    key: "leaveConversation",
    value: function leaveConversation(conversationId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/LeaveConversation/{id}/", {
        id: conversationId.toString()
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} messageId
     * @return {Promise.<Response>}
     */

  }, {
    key: "moderateGroupWall",
    value: function moderateGroupWall(groupId, messageId) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/ModerateGroupWall/{groupId}/{messageId}/"), "POST", {
        groupId: groupId.toString(),
        messageId: messageId.toString()
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "reviewAllInvitations",
    value: function reviewAllInvitations(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/Invitations/ReviewAllDirect/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "reviewInvitation",
    value: function reviewInvitation(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/Invitations/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "reviewInvitationDirect",
    value: function reviewInvitationDirect(invitationId, invitationResponseState) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/Invitations/ReviewDirect/{id}/{state}/", {
        id: invitationId,
        state: invitationResponseState
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "reviewInvitations",
    value: function reviewInvitations(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Message/Invitations/ReviewListDirect/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "saveMessageV2",
    value: function saveMessageV2() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/SaveMessageV2/"), "POST", {}));
    }

    /**
     * Add a message to a conversation
     * @param  {String} body
     * @param  {BigNumber} conversationId
     * @return {Promise.<Response>}
     */

  }, {
    key: "saveMessageV3",
    value: function saveMessageV3(body, conversationId) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/SaveMessageV3/"), "POST", {
        body: body,
        conversationId: conversationId.toString()
      }));
    }

    /**
     * Currently used by bungie.net to save a message to a group wall
     * @param {String} body
     * @param {BigNumber} conversationId
     * @param {String} [subject = ""]
     * @return {Promise.<Response>}
     */

  }, {
    key: "saveMessageV4",
    value: function saveMessageV4(conversationId, body) {
      var subject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";

      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/SaveMessageV4/"), "POST", {
        conversationId: conversationId.toString(),
        body: body,
        subject: subject
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "updateConversationLastViewedTimestamp",
    value: function updateConversationLastViewedTimestamp() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/Conversation/UpdateLastViewedTimestamp/"), "POST", {}));
    }

    /**
     * Signal that the current user is typing a message
     *
     * Bungie.net sends a number as the conversationId rather than as a string,
     * but both appear to work
     *
     * @param  {BigNumber} conversationId
     * @return {Promise.<Response>}
     */

  }, {
    key: "userIsTyping",
    value: function userIsTyping(conversationId) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Message/UserIsTyping/"), "POST", {
        conversationId: conversationId.toString()
      }));
    }

    /// Notification Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRealTimeEvents",
    value: function getRealTimeEvents(p1, p2, timeout) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Notification/Events/{p1}/{p2}/{?timeout}", {
        timeout: timeout
      })));
    }

    /**
     * @deprecated
     */

  }, {
    key: "getRecentNotificationCount",
    value: function getRecentNotificationCount() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Notification/GetCount/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRecentNotifications",
    value: function getRecentNotifications() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Notification/GetRecent/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "resetNotification",
    value: function resetNotification() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Notification/Reset/")));
    }

    /// Content Service

    /**
     * @param {BigNumber} careerId
     * @return {Promise.<Response>}
     * @example
     * Response: {
     *  careerId: "44767",
     *  title: "Lead Weapons and Vehicles Artist",
     *  category: "Art",
     *  categoryTag: "art",
     *  tags: [],
     *  detail: "-html-string-"
     * }
     */

  }, {
    key: "getCareer",
    value: function getCareer(careerId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Careers/{id}/", {
        id: careerId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: {
     *  categories: [
     *    {
     *      categoryName: "Art",
     *      tag: "art",
     *      careers: [
     *        {
     *          careerId: "44767",
     *          title: "Lead Weapons and Vehicle Artist "
     *        }
     *        ...
     *      ]
     *    }
     *    ...
     *  ]
     * }
     */

  }, {
    key: "getCareers",
    value: function getCareers() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Content/Careers/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getContentById",
    value: function getContentById(p1, p2, head) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/GetContentById/{p1}/{p2}/{?head}", {
        p1: p1,
        p2: p2,
        head: head
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getContentByTagAndType",
    value: function getContentByTagAndType(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/GetContentByTagAndType/{p1}/{p2}/{p3}/{?,head}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        head: params.head
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getContentType",
    value: function getContentType(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/GetContentType/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyContent",
    value: function getDestinyContent(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Destiny/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyContentV2",
    value: function getDestinyContentV2(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Destiny/V2/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFeaturedArticle",
    value: function getFeaturedArticle() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Content/Site/Featured/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getHomepageContent",
    value: function getHomepageContent(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Homepage/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getHomepageContentV2",
    value: function getHomepageContentV2() {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Homepage/V2/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getJobs",
    value: function getJobs(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Jobs/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     * @param {Number} currentPage = 1
     */

  }, {
    key: "getNews",
    value: function getNews(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/News/{p1}/{p2}/{?itemsperpage,currentpage}", {
        p1: params.p1,
        p2: params.p2,
        itemsperpage: params.itemsPerPage,
        currentpage: params.currentPage
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPromoWidget",
    value: function getPromoWidget() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Content/Site/Destiny/Promo/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPublications",
    value: function getPublications(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Publications/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @param {String} query - search query
     * @return {Promise.<Response>}
     */

  }, {
    key: "searchCareers",
    value: function searchCareers(query) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Careers/Search/{?searchtext}", {
        searchtext: query
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "searchContentByTagAndType",
    value: function searchContentByTagAndType(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/SearchContentByTagAndType/{p1}/{p2}/{p3}/{?head,currentpage,itemsperpage}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        head: params.head,
        currentpage: params.currentPage,
        itemsperpage: params.itemsPerPage
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "searchContentEx",
    value: function searchContentEx(p1, head) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/SearchEx/{p1}/{?,head}", {
        p1: p1,
        head: head
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "searchContentWithText",
    value: function searchContentWithText(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Content/Site/Homepage/{p1}/{?head,ctype,tag,currentpage,searchtext}/", {
        p1: params.p1,
        head: params.head,
        ctype: params.cType,
        tag: params.tag,
        currentpage: params.currentPage,
        searchtext: params.searchText
      }), "POST", {}));
    }

    /// ExternalSocial Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAggregatedSocialFeed",
    value: function getAggregatedSocialFeed(p1, types) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/ExternalSocial/GetAggregatedSocialFeed/{p1}/{?,types}", {
        p1: p1,
        types: types
      })));
    }

    /// Survey Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getSurvey",
    value: function getSurvey() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Survey/GetSurvey/")));
    }

    /// Forum Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "approveFireteamThread",
    value: function approveFireteamThread(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Recruit/Approve/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "changeLockState",
    value: function changeLockState(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/ChangeLockState/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "changePinState",
    value: function changePinState(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/ChangePinState/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "createContentComment",
    value: function createContentComment() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Forum/CreateContentComment/"), "POST", {}));
    }

    /**
     *
     * When creating a poll, set post.metadata to a JSON-encoded string array of
     * options. For example, if the options are Yes, No, and Maybe, post.metadata
     * would be set to "["Yes","No","Maybe"]". The square brackets are included.
     *
     * @param {Object} post
     * @param {String} post.body
     * @param {Number} post.category - which enum for this? flags?
     * @param {Number} post.groupId
     * @param {Boolean} post.isGroupPrivate
     * @param {String|null} post.metadata - null
     * @param {BigNumber} post.parentPostId - postId being replied to
     * @param {Number} post.playerSupportFlags
     * @param {null} post.playerSupportMetadata
     * @param {BigNumber} post.recruitIntensity
     * @param {Boolean} post.recruitMicrophoneRequired - null?
     * @param {BigNumber} post.recruitSlots
     * @param {BigNumber} post.recruitTone
     * @param {Boolean} post.subTopicOverride
     * @param {String} post.subject
     * @param {String} post.tagCategory
     * @param {String} post.tagInput - comma separated
     * @param {String} post.urlLinkOrImage
     * @return {Promise.<Response>}
     */

  }, {
    key: "createPost",
    value: function createPost(post) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Forum/CreatePost/"), "POST", post));
    }

    /**
     * @param {BigNumber} postId
     * @return {Promise.<Response>}
     */

  }, {
    key: "deletePost",
    value: function deletePost(postId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/DeletePost/{id}/", {
        id: postId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} postId
     * @param {Object} post
     * @param {String} [post.body = ""]
     * @param {Number} [post.category = 0] - enum?
     * @param {Number} [post.disableBits = 64] - enum for this?
     * @param {Boolean} [post.isGroupPostPrivate = false]
     * @param {String|null} [post.metadata = null]
     * @param {String} [post.subject = ""]
     * @param {String} [post.tagCategory = ""]
     * @param {String} [post.tagInput = ""]
     * @param {String} [post.urlLinkOrImage = ""]
     * @return {Promise.<Response>}
     */

  }, {
    key: "editPost",
    value: function editPost(postId, post) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/EditPost/{id}/", {
        id: postId.toString()
      }), "POST", {
        body: post.body,
        category: post.category,
        disableBits: post.disableBits,
        isGroupPostPrivate: post.isGroupPostPrivate,
        metata: post.metadata,
        subject: post.subject,
        tagCategory: post.tagCategory,
        tagInput: post.tagInput,
        urlLinkOrImage: post.urlLinkOrImage
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCoreTopicsPaged",
    value: function getCoreTopicsPaged(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetCoreTopicsPaged/{p1}/{p2}/{p3}/{p4}/", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        p4: params.p4
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getForumTagCountEstimate",
    value: function getForumTagCountEstimate(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetForumTagCountEstimate/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getForumTagSuggestions",
    value: function getForumTagSuggestions(partialTag) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetForumTagSuggestions/{p1}/{?,partialtag}", {
        partialtag: partialTag
      })));
    }

    /**
     * @param {BigNumber} postId - postId of the post containing the poll
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPoll",
    value: function getPoll(postId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Poll/{postId}/", {
        postId: postId.toString()
      })));
    }

    /**
     * @param {Number} quantity
     * @param {*} tagsSinceDate
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPopularTags",
    value: function getPopularTags(quantity, tagsSinceDate) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetPopularTags/{?quantity,tagsSinceDate}", {
        quantity: quantity,
        tagsSinceDate: tagsSinceDate
      })));
    }

    /**
     * @param {BigNumber} childPostId
     * @param {Boolean} [showBanned = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPostAndParent",
    value: function getPostAndParent(childPostId) {
      var showBanned = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetPostAndParent/{childPostId}/{?showbanned}", {
        childPostId: childPostId.toString(),
        showbanned: showBanned
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPostAndParentAwaitingApproval",
    value: function getPostAndParentAwaitingApproval(childPostId, showBanned) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetPostAndParentAwaitingApproval/{childPostId}/{?,showbanned}", {
        childPostId: childPostId,
        showBanned: showBanned
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPostsThreadedPaged",
    value: function getPostsThreadedPaged(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetPostsThreadedPaged/{parentPostId}/{page}/{pageSize}/{replySize}/{getParentPost}/{rootThreadMode}/{sortMode}/{?showbanned}", {
        parentPostId: params.parentPostId,
        page: params.page,
        pageSize: params.pageSize,
        replySize: params.replySize,
        getParentPost: params.getParentPost,
        rootThreadMode: params.rootThreadMode,
        sortMode: params.sortMode,
        showbanned: params.showBanned
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPostsThreadedPagedFromChild",
    value: function getPostsThreadedPagedFromChild(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetPostsThreadedPagedFromChild/{childPostId}/{page}/{pageSize}/{replySize}/{rootThreadMode}/{sortMode}/{?showbanned}", {
        childPostId: params.childPostId,
        page: params.page,
        pageSize: params.pageSize,
        replySize: params.replySize,
        rootThreadMode: params.rootThreadMode,
        sortMode: params.sortMode,
        showbanned: params.showBanned
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRecruitmentThreadSummaries",
    value: function getRecruitmentThreadSummaries() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Forum/Recruit/Summaries/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getTopicForContent",
    value: function getTopicForContent(contentId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetTopicForContent/{contentId}/", {
        contentId: contentId
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getTopicsPaged",
    value: function getTopicsPaged(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/GetTopicsPaged/{page}/{pageSize}/{group}/{sort}/{quickDate}/{categoryFilter}/{?tagstring}", {
        page: params.page,
        pageSize: params.pageSize,
        group: params.group,
        sort: params.sort,
        quickDate: params.quickDate,
        categoryFilter: params.categoryFilter,
        tagstring: params.tagString
      })));
    }

    /**
     * @param {BigNumber} postId
     * @return {Promise.<Response>}
     */

  }, {
    key: "joinFireteamThread",
    value: function joinFireteamThread(postId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Recruit/Join/{id}/", {
        id: postId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} postId
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "kickBanFireteamApplicant",
    value: function kickBanFireteamApplicant(postId, membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Recruit/{postId}/{membershipId}/", {
        postId: postId.toString(),
        membershipId: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} postId
     * @return {Promise.<Response>}
     */

  }, {
    key: "leaveFireteamThread",
    value: function leaveFireteamThread(postId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Recruit/Leave/{id}/", {
        id: postId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} answerPostId
     * @param {BigNumber} questionTopicId
     * @return {Promise.<Response>}
     */

  }, {
    key: "markReplyAsAnswer",
    value: function markReplyAsAnswer(answerPostId, questionTopicId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/MarkReplyAsAnswer/{answer}/{question}/", {
        answer: answerPostId.toString(),
        question: questionTopicId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} postId
     * @param {BigNumber} moderatedItemId
     * @param {Number} reason
     * @param {String} [comments = "group post ban"]
     * @param {BungieNet.enums.affectedItemType} [moderatedItemType = BungieNet.enums.affectedItemType.post]
     * @param {BungieNet.enums.requestedPunishment} [requestedPunishment = BungieNet.enums.requestedPunishment.ban]
     * @return {Promise.<Response>}
     */

  }, {
    key: "moderateGroupPost",
    value: function moderateGroupPost(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Post/{postId}/GroupModerate/", {
        postId: params.postId.toString()
      }), "POST", {
        comments: params.comments,
        moderatedItemId: params.moderatedItemId.toString(),
        moderatedItemType: params.moderatedItemType,
        reason: params.reason,
        requestedPunishment: params.requestedPunishment
      }));
    }

    /**
     *
     * @return {Promise.<Response>}
     */

  }, {
    key: "moderatePost",
    value: function moderatePost(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Post/{p1}/Moderate/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "moderateTag",
    value: function moderateTag(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Tags/{p1}/Moderate/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     *
     * - payload is set to null, this may result in a bug
     * @param {BigNumber} pollId
     * @param {Number} optionIndex - 0-based index of the option being voted for
     * @return {Promise.<Response>}
     */

  }, {
    key: "pollVote",
    value: function pollVote(pollId, optionIndex) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/Poll/Vote/{pollId}/{index}/", {
        pollId: pollId.toString(),
        optionIndex: optionIndex
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} postId
     * @param {Number} rating - 0 to 100, currently only 0 OR 100
     * @return {Promise.<Response>}
     */

  }, {
    key: "ratePost",
    value: function ratePost(postId, rating) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/RatePost/{postId}/{rating}/", {
        postId: postId.toString(),
        rating: rating
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} topicId
     * @return {Promise.<Response>}
     */

  }, {
    key: "unmarkReplyAsAnswer",
    value: function unmarkReplyAsAnswer(topicId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Forum/UnmarkReplyAsAnswer/{topicId}/", {
        topicId: topicId.toString()
      })));
    }

    /// Activity Service

    /**
     * @param {String} tag - ie. #destiny, hash included
     * @return {Promise.<Response>}
     */

  }, {
    key: "followTag",
    value: function followTag(tag) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Tag/Follow/{?tag}", {
        tag: tag
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "followUser",
    value: function followUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{id}/Follow/", {
        id: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @param {*} p1
     * @param {*} p2
     * @param {Number} [currentPage = 1]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getApplicationActivityForUser",
    value: function getApplicationActivityForUser(p1, p2) {
      var currentPage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Activities/Application/{p2}/{?page}", {
        p1: p1,
        p2: p2,
        page: currentPage
      })));
    }

    /**
     * @return {Promise.<Response>}
     * @deprecated 2016-09-10
     */

  }, {
    key: "getAggregatedActivitiesForCurrentUser",
    value: function getAggregatedActivitiesForCurrentUser(typeFilter, format) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Aggregation/{?typefilter,format}", {
        typefilter: typeFilter,
        format: format
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getEntitiesFollowedByCurrentUser",
    value: function getEntitiesFollowedByCurrentUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Activity/Following/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getEntitiesFollowedByCurrentUserV2",
    value: function getEntitiesFollowedByCurrentUserV2(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Following/V2/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getEntitiesFollowedByUser",
    value: function getEntitiesFollowedByUser(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Following/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getEntitiesFollowedByUserV2",
    value: function getEntitiesFollowedByUserV2(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Following/V2/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFollowersOfTag",
    value: function getFollowersOfTag(tag, itemsPerPage, currentPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Tag/Followers/{?tag,itemsperpage,currentpage}", {
        tag: tag,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFollowersOfUser",
    value: function getFollowersOfUser(membershipId, itemsPerPage, currentPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{membershipId}/Followers/{?itemsperpage,currentpage}", {
        membershipId: membershipId,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getForumActivitiesForUser",
    value: function getForumActivitiesForUser(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/{?itemsperpage,currentpage,format}", {
        p1: params.p1,
        itemsperpage: params.itemsPerPage,
        currentpage: params.currentPage,
        format: params.format
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getForumActivitiesForUserV2",
    value: function getForumActivitiesForUserV2(p1, currentPage, format) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Activities/ForumsV2/{?currentpage,format}", {
        p1: p1,
        currentpage: currentPage,
        format: format
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFriends",
    value: function getFriends() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Activity/Friends/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFriendsAllNoPresence",
    value: function getFriendsAllNoPresence(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Friends/AllNoPresence/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFriendsPaged",
    value: function getFriendsPaged(membershipType, page) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Friends/{membershipType}/{page}/", {
        membershipType: membershipType,
        page: page
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupsFollowedByCurrentUser",
    value: function getGroupsFollowedByCurrentUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Activity/Following/Groups/")));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupsFollowedByUser",
    value: function getGroupsFollowedByUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{id}/Following/Groups/", {
        id: membershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupsFollowedPagedByCurrentUser",
    value: function getGroupsFollowedPagedByCurrentUser(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Following/Groups/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupsFollowedPagedByUser",
    value: function getGroupsFollowedPagedByUser(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Following/Groups/Paged/{p2}/", {
        p1: p1,
        p2: p2
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getLikeAndShareActivityForUser",
    value: function getLikeAndShareActivityForUser(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Activities/LikesAndShares/{?itemsperpage,currentpage,format}", {
        p1: params.p1,
        itemsperpage: params.itemsPerPage,
        currentpage: params.currentPage,
        format: params.format
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getLikeAndShareActivityForUserV2",
    value: function getLikeAndShareActivityForUserV2(p1, currentPage, format) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Activities/LikesAndSharesV2/{?currentpage,format}", {
        p1: p1,
        currentpage: currentPage,
        format: format
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getLikeShareAndForumActivityForUser",
    value: function getLikeShareAndForumActivityForUser(p1, currentPage, format) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{p1}/Activities/LikeShareAndForum/{?currentpage,format}", {
        p1: p1,
        currentpage: currentPage,
        format: format
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUsersFollowedByCurrentUser",
    value: function getUsersFollowedByCurrentUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Activity/Following/Users/")));
    }

    /**
     * @param {String} tag - ie. #destiny, with hash
     * @return {Promise.<Response>}
     */

  }, {
    key: "unfollowTag",
    value: function unfollowTag(tag) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/Tag/Unfollow/{?tag}", {
        tag: tag
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "unfollowUser",
    value: function unfollowUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Activity/User/{id}/Unfollow/", {
        id: membershipId.toString()
      }), "POST", {}));
    }

    /// Group Service

    /**
     * @param {BigNumber} groupId
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "approveAllPending",
    value: function approveAllPending(groupId, message) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/ApproveAll/", {
        groupId: groupId.toString()
      }), "POST", {
        message: message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "approveGroupMembership",
    value: function approveGroupMembership(groupId, membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/Approve/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "approveGroupMembershipV2",
    value: function approveGroupMembershipV2(groupId, membershipId, message) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/ApproveV2/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }), "POST", {
        message: message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {String} message
     * @param {BigNumber[]} membershipIds
     * @return {Promise.<Response>}
     */

  }, {
    key: "approvePendingForList",
    value: function approvePendingForList(groupId, message, membershipIds) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/ApproveList/", {
        groupId: groupId.toString()
      }), "POST", {
        membershipIds: membershipIds.map(function (bn) {
          return bn.toString();
        }),
        message: message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {String} comment
     * @param {BungieNet.enums.moderatorRequestedPunishment} - might not be right enum
     * @return {Promise.<Response>}
     */

  }, {
    key: "banMember",
    value: function banMember(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/Ban/", {
        groupId: params.groupId.toString(),
        membershipId: params.membershipId.toString()
      }), "POST", {
        comment: params.comment,
        length: params.length
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} allyGroupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "breakAlliance",
    value: function breakAlliance(groupId, allyGroupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Relationship/{allyGroupId}/BreakAlliance/", {
        groupId: groupId.toString(),
        allyGroupId: allyGroupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "breakAlliances",
    value: function breakAlliances(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/BreakAlliances/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "createGroup",
    value: function createGroup() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/Create/"), "POST", {}));
    }

    /**
     * @param {Object} details
     * @param {String} details.about
     * @param {Boolean} details.allowChat
     * @param {*[]} details.attributes
     * @param {String} details.avatarImageIndex
     * @param {*[]} details.clanMembershipTypes
     * @param {Boolean} details.isDefaultPostPublic
     * @param {Boolean} details.isPublic
     * @param {Boolean} details.isPublicTopicAdminOnly
     * @param {String} details.locale
     * @param {BigNumber} details.membershipOption
     * @param {String} details.motto
     * @param {String} detail.name
     * @param {String} detail.tags - "#tag1,#tag2,#tag3"
     * @param {String} detail.theme
     * @return {Promise.<Response>}
     */

  }, {
    key: "createGroupV2",
    value: function createGroupV2(details) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/Create/V2/"), "POST", details));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "createMinimalGroup",
    value: function createMinimalGroup(name, about) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/Create/Minimal/"), "POST", {
        groupName: name,
        groupAbout: about
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "denyAllPending",
    value: function denyAllPending(groupId, message) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/DenyAll/", {
        groupId: groupId.toString()
      }), "POST", {
        message: message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "denyGroupMembership",
    value: function denyGroupMembership(groupId, membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/Deny/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "denyGroupMembershipV2",
    value: function denyGroupMembershipV2(groupId, membershipId, message) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/DenyV2/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }), "POST", {
        message: message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {String} message
     * @param {BigNumber[]} membershipIds
     * @return {Promise.<Response>}
     */

  }, {
    key: "denyPendingForList",
    value: function denyPendingForList(groupId, message, membershipIds) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/DenyList/", {
        groupId: groupId.toString()
      }), "POST", {
        message: message,
        membershipIds: membershipIds.map(function (bn) {
          return bn.toString();
        })
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BungieNet.enums.bungieMembershipType}
     * @return {Promise.<Response>}
     */

  }, {
    key: "diableClanForGroup",
    value: function diableClanForGroup(groupId, clanMembershipType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Clans/Disable/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "disbandAlliance",
    value: function disbandAlliance(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/BreakAllAlliances/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "editGroup",
    value: function editGroup(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Edit/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {BungieNet.enums.groupMemberType} groupMembershipType
     * @param {*} [clanPlatformType = 0]
     * @return {Promise.<Response>}
     */

  }, {
    key: "editGroupMembership",
    value: function editGroupMembership(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/SetMembershipType/{groupMembershipType}/{?clanPlatformType}", {
        groupId: params.groupId.toString(),
        membershipId: params.membershipId.toString(),
        groupMembershipType: params.groupMembershipType,
        clanPlatformType: params.clanPlatformType
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Object} details
     * @param {Boolean} details.allowChat
     * @param {BungieNet.enums.chatSecuritySetting} details.chatSecurity
     * @param {BungieNet.enums.groupPostPublicity} details.defaultPublicity
     * @param {Boolean} details.enableInvitationMessagingForAdmins
     * @param {BungieNet.enums.groupHomepage} details.homepage
     * @param {Boolean} details.isPublic
     * @param {Boolean} details.isPublicTopicAdminOnly
     * @param {String} details.locale
     * @param {BungieNet.enums.membershipOption} details.membershipOption
     * @param {String} details.about
     * @param {String} details.clanCallSign
     * @param {String} details.motto
     * @param {String} details.name
     * @param {String} details.tags - "#tag1,#tag2,#tag3"
     * @return {Promise.<Response>}
     */

  }, {
    key: "editGroupV2",
    value: function editGroupV2(groupId, details) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/EditV2/", {
        groupId: groupId.toString()
      }), "POST", details));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
     * @param {String} clanName
     * @return {Promise.<Response>}
     */

  }, {
    key: "enableClanForGroup",
    value: function enableClanForGroup(groupId, clanMembershipType, clanName) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Clans/Enable/{clanMembershipType}/{?clanName}", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType,
        clanName: clanName
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "followGroupsWithGroup",
    value: function followGroupsWithGroup(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/FollowList/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} followGroupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "followGroupWithGroup",
    value: function followGroupWithGroup(groupId, followGroupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Follow/{followGroupId}/", {
        groupId: groupId.toString(),
        followGroupId: followGroupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} itemsPerPage
     * @param {Number} currentPage
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdminsOfGroup",
    value: function getAdminsOfGroup(groupId, itemsPerPage, currentPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Admins/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} itemsPerPage
     * @param {Number} currentPage
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdminsOfGroupV2",
    value: function getAdminsOfGroupV2(groupId, itemsPerPage, currentPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/AdminsV2/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllFoundedGroupsForMember",
    value: function getAllFoundedGroupsForMember(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{id}/Founded/All/", {
        id: membershipId.toString()
      })));
    }

    /**
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllGroupsForCurrentMember",
    value: function getAllGroupsForCurrentMember() {
      var clanOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyGroups/All/{?clanonly,populatefriends}", {
        clanonly: clanOnly,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllGroupsForMember",
    value: function getAllGroupsForMember(membershipId) {
      var clanOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{membershipId}/All/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        clanonly: clanOnly,
        populateFriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAlliedGroups",
    value: function getAlliedGroups(groupId, currentPage) {
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Allies/{?currentPage,populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAvailableGroupAvatars",
    value: function getAvailableGroupAvatars() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/GetAvailableAvatars/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAvailableGroupThemes",
    value: function getAvailableGroupThemes() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/GetAvailableThemes/")));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Number} itemsPerPage
     * @return {Promise.<Response>}
     */

  }, {
    key: "getBannedMembersOfGroup",
    value: function getBannedMembersOfGroup(groupId, currentPage, itemsPerPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Banned/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Number} itemsPerPage
     * @return {Promise.<Response>}
     */

  }, {
    key: "getBannedMembersOfGroupV2",
    value: function getBannedMembersOfGroupV2(groupId, currentPage, itemsPerPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/BannedV2/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getClanAttributeDefinitions",
    value: function getClanAttributeDefinitions() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/GetClanAttributeDefinitions/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDeletedGroupsForCurrentMember",
    value: function getDeletedGroupsForCurrentMember() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/MyGroups/Deleted/")));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Number} currentPage
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFoundedGroupsForMember",
    value: function getFoundedGroupsForMember(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{membershipId}/Founded/{currentPage}/{?clanonly,populatefriends}", {
        membershipId: params.membershipId.toString(),
        currentPage: params.currentPage,
        clanonly: params.clanOnly,
        populatefriends: params.populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroup",
    value: function getGroup(groupId) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {String} groupName
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupByName",
    value: function getGroupByName(groupName) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/Name/{groupName}/{?populatefriends}", {
        groupName: groupName,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupsFollowedByGroup",
    value: function getGroupsFollowedByGroup(groupId, currentPage) {
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Following/{currentPage}/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupsFollowingGroup",
    value: function getGroupsFollowingGroup(groupId, currentPage) {
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/FollowedBy/{currentPage}/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {String} partialTag
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGroupTagSuggestions",
    value: function getGroupTagSuggestions(partialTag) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/GetGroupTagSuggestions/{?partialtag}", {
        partialtag: partialTag
      })));
    }

    /**
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getJoinedGroupsForCurrentMember",
    value: function getJoinedGroupsForCurrentMember() {
      var clanOnly = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyGroups/{?clanonly,populatefriends}", {
        clanonly: clanOnly,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {Number} currentPage
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getJoinedGroupsForCurrentMemberV2",
    value: function getJoinedGroupsForCurrentMemberV2(currentPage) {
      var clanOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyGroups/V2/{currentPage}/{?clanonly,populatefriends}", {
        currentPage: currentPage,
        clanonly: clanOnly,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getJoinedGroupsForMember",
    value: function getJoinedGroupsForMember(membershipId) {
      var clanOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{membershipId}/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        clanonly: clanOnly,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Number} currentPage
     * @param {Boolean} [clanOnly = false]
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getJoinedGroupsForMemberV2",
    value: function getJoinedGroupsForMemberV2(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{membershipId}/Joined/{currentPage}/{?clanonly,populatefriends}", {
        membershipId: params.membershipId.toString(),
        currentPage: params.currentPage,
        clanonly: params.clanOnly,
        populatefriends: params.populateFriends
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Number} currentPage
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getJoinedGroupsForMemberV3",
    value: function getJoinedGroupsForMemberV3(membershipId, currentPage) {
      var populateFriends = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{membershipId}/JoinedV3/{currentPage}/{?populatefriends}", {
        membershipId: membershipId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {BungieNet.enums.groupMemberType}
     * @param {*} [sort = 0]
     * @param {BungieNet.enums.bungieMembershipType} platformType
     * @return {Promise.<Response>}
     */

  }, {
    key: "getMembersOfClan",
    value: function getMembersOfClan(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/ClanMembers/{?currentPage,memberType,sort,platformType}", {
        groupId: params.groupId.toString(),
        currentPage: params.currentPage,
        memberType: params.memberType,
        sort: params.sort,
        platformType: params.platformType
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Number} itemsPerPage
     * @param {BungieNet.enums.groupMemberType} memberType
     * @param {BungieNet.enums.bungieMembershipType} platformType
     * @param {*} sort
     * @return {Promise.<Response>}
     */

  }, {
    key: "getMembersOfGroup",
    value: function getMembersOfGroup(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{?itemsPerPage,currentPage,memberType,platformType,sort}", {
        groupId: params.groupId.toString(),
        itemsPerPage: params.itemsPerPage,
        currentPage: params.currentPage,
        memberType: params.memberType,
        platformType: params.platformType,
        sort: params.sort
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Number} itemsPerPage
     * @param {BungieNet.enums.groupMemberType} memberType
     * @param {BungieNet.enums.bungieMembershipType} platformType
     * @param {*} sort
     * @return {Promise.<Response>}
     */

  }, {
    key: "getMembersOfGroupV2",
    value: function getMembersOfGroupV2(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/MembersV2/{?itemsPerPage,currentPage,memberType,platformType,sort}", {
        groupId: params.groupId.toString(),
        itemsPerPage: params.itemsPerPage,
        currentPage: params.currentPage,
        memberType: params.memberType,
        platformType: params.platformType,
        sort: params.sort
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @param {Number} itemsPerPage
     * @param {BungieNet.enums.groupMemberType} memberType
     * @param {BungieNet.enums.bungieMembershipType} platformType
     * @param {*} sort
     * @param {String} nameSearch
     * @return {Promise.<Response>}
     */

  }, {
    key: "getMembersOfGroupV3",
    value: function getMembersOfGroupV3(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/MembersV3/{?itemsPerPage,currentPage,memberType,platformType,sort,nameSearch}", {
        groupId: params.groupId.toString(),
        itemsPerPage: params.itemsPerPage,
        currentPage: params.currentPage,
        memberType: params.memberType,
        platformType: params.platformType,
        sort: params.sort,
        nameSearch: params.nameSearch
      })));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: [
     *  {
     *    groupdId: "-BigNumber-",
     *    membershipType: 2,
     *    membershipId: "-BigNumber-"
     *  }
     * ]
     */

  }, {
    key: "getMyClanMemberships",
    value: function getMyClanMemberships() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Group/MyClans/")));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
     * @param {Number} currentPage
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingClanMemberships",
    value: function getPendingClanMemberships(groupId, clanMembershipType, currentPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Clan/{clanMembershipType}/Pending/{currentPage}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType,
        currentPage: currentPage
      })));
    }

    /**
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingGroupsForCurrentMember",
    value: function getPendingGroupsForCurrentMember() {
      var populateFriends = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyPendingGroups/{?populatefriends}", {
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {Number} currentPage
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingGroupsForCurrentMemberV2",
    value: function getPendingGroupsForCurrentMemberV2(currentPage) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyPendingGroupsV2/{currentPage}/{?populatefriends}", {
        currentPage: currentPage,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingGroupsForMember",
    value: function getPendingGroupsForMember(membershipId) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/User/{membershipId}/Pending/{?populatefriends}", {
        membershipId: membershipId.toString(),
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {Number} currentPage
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingGroupsForMemberV2",
    value: function getPendingGroupsForMemberV2(currentPage, populateFriends) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyPendingGroups/V2/{currentPage}/{?populatefriends}", {
        currentPage: currentPage,
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingMemberships",
    value: function getPendingMemberships(groupId) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/Pending/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      })));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Number} currentPage
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPendingMembershipsV2",
    value: function getPendingMembershipsV2(groupId, currentPage) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/PendingV2/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage
      })));
    }

    /**
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRecommendedGroups",
    value: function getRecommendedGroups() {
      var populateFriends = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/Recommended/{?populatefriends}", {
        populatefriends: populateFriends
      }), "POST", {}));
    }

    /**
     * @param {Object} params
     * @param {Object} params.contents
     * @param {String} params.contents.searchValue
     * @param {BungieNet.enums.groupTypeSearchFilter} params.contents.searchType
     * @param {*} params.creationDate
     * @param {Number} params.currentPage
     * @param {BungieNet.enums.groupMemberCountFilter} params.groupMemberCountFilter
     * @param {Number} params.itemsPerPage
     * @param {String} params.localeFilter
     * @param {BungieNet.enums.bungieMembershipType} params.membershipType
     * @param {*} params.sortBy
     * @param {String} params.tagText
     * @param {Boolean} [populatefriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "groupSearch",
    value: function groupSearch(params) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/Search/{?populatefriends}", {
        populatefriends: populateFriends
      }), "POST", params));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
     * @param {String} title
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "inviteClanMember",
    value: function inviteClanMember(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/InviteToClan/{membershipId}/{clanMembershipType}/", {
        groupId: params.groupId,
        membershipId: params.membershipId.toString(),
        clanMembershipType: params.clanMembershipType
      }), "POST", {
        title: params.title,
        message: params.message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {String} title
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "inviteGroupMember",
    value: function inviteGroupMember(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Invite/{membershipId}/", {
        groupId: params.groupId.toString(),
        membershipId: params.membershipId.toString()
      }), "POST", {
        title: params.title,
        message: params.message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber[]} targetIds
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "inviteManyToJoin",
    value: function inviteManyToJoin(groupId, targetIds, message) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Allies/InviteMany/", {
        groupId: groupId.toString()
      }), "POST", {
        targetIds: targetIds.map(function (bn) {
          return bn.toString();
        }),
        messageContent: {
          message: message
        }
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} allyGroupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "inviteToJoinAlliance",
    value: function inviteToJoinAlliance(groupId, allyGroupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Allies/Invite/{allyGroupId}/", {
        groupId: groupId.toString(),
        allyGroupId: allyGroupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
     * @param {String} message
     * @return {Promise.<Response>}
     */

  }, {
    key: "joinClanForGroup",
    value: function joinClanForGroup(groupId, clanMembershipType, message) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType
      }), "POST", {
        message: message
      }));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @param {BungieNet.enums.bungieMembershipType} clanPlatformType
     * @return {Promise.<Response>}
     */

  }, {
    key: "kickMember",
    value: function kickMember(groupId, membershipId, clanPlatformType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/Kick/{?clanPlatformType}", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString(),
        clanPlatformType: clanPlatformType
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
     * @return {Promise.<Response>}
     */

  }, {
    key: "leaveClanForGroup",
    value: function leaveClanForGroup(groupId, clanMembershipType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Clans/Leave/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "migrate",
    value: function migrate(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{p1}/Migrate/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BungieNet.enums.bungieMembershipType} membershipType
     * @return {Promise.<Response>}
     */

  }, {
    key: "overrideFounderAdmin",
    value: function overrideFounderAdmin(groupId, membershipType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Admin/FounderOverride/{membershipType}/", {
        groupId: groupId.toString(),
        membershipType: membershipType
      }), "POST", {}));
    }

    /**
     * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
     * @return {Promise.<Response>}
     */

  }, {
    key: "refreshClanSettingsInDestiny",
    value: function refreshClanSettingsInDestiny(clanMembershipType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/MyClans/Refresh/{clanMembershipType}/", {
        clanMembershipType: clanMembershipType
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "requestGroupMembership",
    value: function requestGroupMembership(groupId) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/Apply/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "requestGroupMembershipV2",
    value: function requestGroupMembershipV2(groupId) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/ApplyV2/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} allyGroupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "requestToJoinAlliance",
    value: function requestToJoinAlliance(groupId, allyGroupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Allies/RequestToJoin/{allyGroupId}/", {
        groupId: groupId.toString(),
        allyGroupId: allyGroupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {Boolean} [populateFriends = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "rescindGroupMembership",
    value: function rescindGroupMembership(groupId) {
      var populateFriends = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/Rescind/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "setGroupAsAlliance",
    value: function setGroupAsAlliance(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/SetAsAlliance/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {*} p2
     * @return {Promise.<Response>}
     */

  }, {
    key: "setPrivacy",
    value: function setPrivacy(groupId, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Privacy/{p2}/", {
        groupId: groupId.toString(),
        p2: p2
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "unbanMember",
    value: function unbanMember(groupId, membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Members/{membershipId}/Unban/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "undeleteGroup",
    value: function undeleteGroup(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Undelete/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "unfollowAllGroupsWithGroup",
    value: function unfollowAllGroupsWithGroup(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/UnfollowAll/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "unfollowGroupsWithGroup",
    value: function unfollowGroupsWithGroup(groupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/UnfollowList/", {
        groupId: groupId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} groupId
     * @param {BigNumber} followGroupId
     * @return {Promise.<Response>}
     */

  }, {
    key: "unfollowGroupWithGroup",
    value: function unfollowGroupWithGroup(groupId, followGroupId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Group/{groupId}/Unfollow/{followGroupId}/", {
        groupId: groupId.toString(),
        followGroupId: followGroupId.toString()
      }), "POST", {}));
    }

    /// Ignore Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "flagItem",
    value: function flagItem() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Ignore/Flag/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getIgnoresForUser",
    value: function getIgnoresForUser() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Ignore/MyIgnores/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getIgnoreStatusForPost",
    value: function getIgnoreStatusForPost(postId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Ignore/MyIgnores/Posts/{postId}/", {
        postId: postId.toString()
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getIgnoreStatusForUser",
    value: function getIgnoreStatusForUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Ignore/MyIgnores/Users/{membershipId}/", {
        membershipId: membershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getReportContext",
    value: function getReportContext(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Ignore/ReportContext/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "ignoreItem",
    value: function ignoreItem(params) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Ignore/Ignore/"), "POST", {
        ignoredItemId: params.ignoredItemId,
        ignoredItemType: params.ignoredItemType,
        comment: params.comment,
        reason: params.reason,
        itemContextId: params.itemContextId,
        itemContextType: params.itemContextType,
        ModeratorRequest: params.moderatorRequest
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "myLastReport",
    value: function myLastReport() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Ignore/MyLastReport/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "unignoreItem",
    value: function unignoreItem() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Ignore/Unignore/"), "POST", {}));
    }

    /// Game Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPlayerGamesById",
    value: function getPlayerGamesById(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Game/GetPlayerGamesById/{p1}/", {
        p1: p1
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "reachModelSneakerNet",
    value: function reachModelSneakerNet(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Game/ReachModelSneakerNet/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /// Admin Service

    /**
     * @param {String} username - search term
     * @return {Promise.<Response>}
     */

  }, {
    key: "adminUserSearch",
    value: function adminUserSearch(username) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/Search/{?username}", {
        username: username
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "bulkEditPost",
    value: function bulkEditPost() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/BulkEditPost/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdminHistory",
    value: function getAdminHistory(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/GlobalHistory/{p1}/{p2}/{?membershipFilter,startdate,enddate}", {
        p1: params.p1,
        p2: params.p2,
        membershipFilter: params.membershipFilter,
        startdate: params.startDate,
        enddate: params.endDate
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAssignedReports",
    value: function getAssignedReports() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/Assigned/"), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Number} [currentPage = 1]
     * @param {Number} [itemsPerPage = 1]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDisciplinedReportsForMember",
    value: function getDisciplinedReportsForMember(membershipId) {
      var currentPage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var itemsPerPage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/Reports/", {
        id: membershipId.toString()
      }), "POST", {
        currentPage: currentPage,
        itemsPerPage: itemsPerPage
      }));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {*} p2
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRecentDisciplineAndFlagHistoryForMember",
    value: function getRecentDisciplineAndFlagHistoryForMember(membershipId, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/RecentIncludingFlags/{p2}/", {
        id: membershipId.toString(),
        p2: p2
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getResolvedReports",
    value: function getResolvedReports() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/Reports/"), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     * @example
     * Response: {
     *  membershipId: "-id-",
     *  isProfileBanned: bool
     *  isForumBanned: bool
     *  isMsgBanned: bool,
     *  isGroupWallBanned: bool
     * }
     */

  }, {
    key: "getUserBanState",
    value: function getUserBanState(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/GetBanState/", {
        id: membershipId.toString()
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @param {Number} currentPage - 0-based
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUserPostHistory",
    value: function getUserPostHistory(membershipId) {
      var currentPage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/PostHistory/{page}/", {
        id: membershipId.toString(),
        page: currentPage
      })));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUserWebHistoryClientIpHistory",
    value: function getUserWebHistoryClientIpHistory(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/GetWebClientIpHistory/", {
        id: membershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "globallyIgnoreItem",
    value: function globallyIgnoreItem() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/Ignores/GloballyIgnore/"), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "overrideBanOnUser",
    value: function overrideBanOnUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/SetBan/", {
        id: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "overrideGlobalIgnore",
    value: function overrideGlobalIgnore() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/Ignores/OverrideGlobalIgnore/"), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "overrideGroupWallBanOnUser",
    value: function overrideGroupWallBanOnUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/SetGroupWallBan/", {
        id: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "overrideMsgBanOnUser",
    value: function overrideMsgBanOnUser(membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Admin/Member/{id}/SetMsgBan/", {
        id: membershipId.toString()
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "overturnReport",
    value: function overturnReport() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/Reports/Overturn/"), "POST", {}));
    }

    /**
     * @param {BigNumber} reportId
     * @param {BigNumber} reason
     * @param {BigNumber} banLength
     * @param {Number} result
     * @param {BigNumber} reportId
     * @return {Promise.<Response>}
     */

  }, {
    key: "resolveReport",
    value: function resolveReport(params) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Admin/Assigned/Resolve/"), "POST", {
        banLength: params.banLength.toString(),
        comments: params.comments,
        reason: params.reason.toString(),
        reportId: params.reportId.toString(),
        result: params.result
      }));
    }

    /// Token Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "applyOfferToCurrentDestinyMembership",
    value: function applyOfferToCurrentDestinyMembership(p1, p2) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Tokens/ApplyOfferToCurrentDestinyMembership/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "breakBond",
    value: function breakBond() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/RAF/BreakBond/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "claimAndApplyOnToken",
    value: function claimAndApplyOnToken(tokenType, redeemCode) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Tokens/ClaimAndApplyToken/{tokenType}/", {
        tokenType: tokenType
      }), "POST", {
        redeemCode: redeemCode
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "claimToken",
    value: function claimToken(redeemCode) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/Claim/"), "POST", {
        redeemCode: redeemCode
      }));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "consumeMarketplacePlatformCodeOffer",
    value: function consumeMarketplacePlatformCodeOffer(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Tokens/ConsumeMarketplacePlatformCodeOffer/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCurrentUserOfferHistory",
    value: function getCurrentUserOfferHistory() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/OfferHistory/")));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: {
     *  IsThrottled: false,
     *  ThrottleExpires: "-iso-date-string",
     *  NumberOfFailedAttemptsToday: 0,
     *  MaximumFailedAttemptsPerDay: 3,
     *  AgeVerificationState: true
     * }
     */

  }, {
    key: "getCurrentUserThrottleState",
    value: function getCurrentUserThrottleState() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/ThrottleState/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRAFEligibility",
    value: function getRAFEligibility() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/RAF/GetEligibility/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "marketplacePlatformCodeOfferHistory",
    value: function marketplacePlatformCodeOfferHistory() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/MarketplacePlatformCodeOfferHistory/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "rafClaim",
    value: function rafClaim() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/RAF/Claim/"), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "rafGenerateReferralCode",
    value: function rafGenerateReferralCode(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Tokens/RAF/GenerateReferralCode/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "rafGetNewPlayerBondDetails",
    value: function rafGetNewPlayerBondDetails() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/RAF/GetNewPlayerBondDetails/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "rafGetVeteranBondDetails",
    value: function rafGetVeteranBondDetails() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/RAF/GetVeteranBondDetails/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "verifyAge",
    value: function verifyAge() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Tokens/VerifyAge/"), "POST", {}));
    }

    /// Destiny Service

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} itemId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "equipItem",
    value: function equipItem(membershipType, itemId, characterId) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/EquipItem/"), "POST", {
        membershipType: membershipType,
        itemId: itemId.toString(),
        characterId: characterId.toString()
      }));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @param {BigNumber[]} itemIds
     * @return {Promise.<Response>}
     */

  }, {
    key: "equipItems",
    value: function equipItems(membershipType, characterId, itemIds) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/EquipItems/"), "POST", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        itemIds: itemIds.map(function (bn) {
          return bn.toString();
        })
      }));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAccount",
    value: function getAccount(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAccountSummary",
    value: function getAccountSummary(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Summary/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getActivityBlob",
    value: function getActivityBlob(e) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/GetActivityBlob/{e}/", {
        e: e
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @param {BungieNet.enums.destinyActivityModeType} [mode = BungieNet.enums.destinyActivityModeType.none]
     * @param {Number} [count = 25] number of results to return
     * @param {Number} [page = 1] 1-based
     * @return {Promise.<Response>}
     */

  }, {
    key: "getActivityHistory",
    value: function getActivityHistory(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/ActivityHistory/{membershipType}/{destinyMembershipId}/{characterId}/{?mode,count,page}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        characterId: params.characterId.toString(),
        mode: params.mode,
        count: params.count,
        page: params.page
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdvisorsForAccount",
    value: function getAdvisorsForAccount(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Advisors/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdvisorsForCharacter",
    value: function getAdvisorsForCharacter(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdvisorsForCharacterV2",
    value: function getAdvisorsForCharacterV2(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/V2/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdvisorsForCurrentCharacter",
    value: function getAdvisorsForCurrentCharacter(membershipType, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Advisors/", {
        membershipType: membershipType,
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllItemsSummary",
    value: function getAllItemsSummary(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Items/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAllVendorsForCurrentCharacter",
    value: function getAllVendorsForCurrentCharacter(membershipType, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendors/", {
        membershipType: membershipType,
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType}
     * @return {Promise.<Response>}
     */

  }, {
    key: "getBondAdvisors",
    value: function getBondAdvisors(membershipType) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Advisors/Bonds/", {
        membershipType: membershipType
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCharacter",
    value: function getCharacter(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Complete/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCharacterActivities",
    value: function getCharacterActivities(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Activities/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCharacterInventory",
    value: function getCharacterInventory(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCharacterInventorySummary",
    value: function getCharacterInventorySummary(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/Summary/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCharacterProgression",
    value: function getCharacterProgression(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Progression/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCharacterSummary",
    value: function getCharacterSummary(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getClanLeaderboards",
    value: function getClanLeaderboards(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/ClanLeaderboards/{p1}/{?modes,statid,maxtop}", {
        p1: params.p1,
        modes: params.modes,
        statid: params.statid,
        maxtop: params.maxtop
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyAggregateActivityStats",
    value: function getDestinyAggregateActivityStats(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/AggregateActivityStats/{membershipType}/{destinyMembershipId}/{characterId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyExplorerItems",
    value: function getDestinyExplorerItems(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Explorer/Items/{?params*}", {
        params: params
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyExplorerTalentNodeSteps",
    value: function getDestinyExplorerTalentNodeSteps(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Explorer/TalentNodeSteps/{?params*}", {
        params: params
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyLiveTileContentItems",
    value: function getDestinyLiveTileContentItems() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/LiveTiles/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinyManifest",
    value: function getDestinyManifest() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Manifest/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getDestinySingleDefinition",
    value: function getDestinySingleDefinition(definitionType, definitionId, version) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Manifest/{definitionType}/{definitionId}/{?version}", {
        definitionType: definitionType,
        definitionId: definitionId,
        version: version
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getExcellenceBadges",
    value: function getExcellenceBadges(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/GetExcellenceBadges/{membershipType}/{destinyMembershipId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGrimoireByMembership",
    value: function getGrimoireByMembership(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Vanguard/Grimoire/{membershipType}/{destinyMembershipId}/{?flavour,single}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId,
        flavour: params.flavour,
        single: params.single
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGrimoireDefinition",
    value: function getGrimoireDefinition() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Vanguard/Grimoire/Definition/")));
    }

    /**
     * @param {Object} options
     * @param {BungieNet.enums.bungieMembershipType} options.membershipType
     * @param {BigNumber} options.destinyMembershipId
     * @param {BigNumber} options.characterId
     * @param {BungieNet.enums.periodType} options.periodType
     * @param {BungieNet.enums.destinyActivityModeType[]} options.modes
     * @param {BungieNet.enums.destinyStatsGroupType[]} options.groups
     * @param {String} options.monthStart
     * @param {String} options.monthEnd
     * @param {String} options.dayStart
     * @param {String} options.dayEnd
     * @return {Promise.<Response>}
     */

  }, {
    key: "getHistoricalStats",
    value: function getHistoricalStats(options) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/{mType}/{dMID}/{cId}/{?pType,mds,grps,mstart,mend,dstart,dend}", {
        mType: options.membershipType,
        dMID: options.destinyMembershipId,
        cId: options.characterId,
        pType: options.periodType,
        mds: options.modes.join(","),
        grps: options.groups.join(","),
        mstart: options.monthStart,
        mend: options.monthEnd,
        dstart: options.dayStart,
        dend: options.dayEnd
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getHistoricalStatsDefinition",
    value: function getHistoricalStatsDefinition() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Stats/Definition/")));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BungieNet.enums.destinyStatsGroupType[]} groups
     * @return {Promise.<Response>}
     */

  }, {
    key: "getHistoricalStatsForAccount",
    value: function getHistoricalStatsForAccount(membershipType, destinyMembershipId, groups) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/Account/{membershipType}/{destinyMembershipId}/{?groups}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        groups: groups
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @param {BigNumber} itemInstanceId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getItemDetail",
    value: function getItemDetail(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/{itemInstanceId}/", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        characterId: params.characterId.toString(),
        itemInstanceId: params.itemInstanceId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getItemReferenceDetail",
    value: function getItemReferenceDetail(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{p1}/Account/{p2}/Character/{p3}/ItemReference/{p4}/", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        p4: params.p4
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BungieNet.enums.destinyActivityModeType[]} modes
     * @param {*} statid
     * @param {*} maxtop
     * @return {Promise.<Response>}
     */

  }, {
    key: "getLeaderboards",
    value: function getLeaderboards(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/Leaderboards/{membershipType}/{destinyMembershipId}/{?modes,statid,maxtop}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        modes: params.modes.join(","),
        statid: params.statid,
        maxtop: params.maxtop
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @param {BungieNet.enums.destinyActivityModeType[]} modes
     * @param {*} statid
     * @param {*} maxtop
     * @return {Promise.<Response>}
     */

  }, {
    key: "getLeaderboardsForCharacter",
    value: function getLeaderboardsForCharacter(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/Leaderboards/{membershipType}/{destinyMembershipId}/{characterId}/{?modes,statid,maxtop}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        characterId: params.characterId.toString(),
        modes: params.modes.join(","),
        statid: params.statid,
        maxtop: params.maxtop
      })));
    }

    /**
     * @param {BungieNet.enums.destinyActivityModeType[]} modes
     * @param {*} code
     * @return {Promise.<Response>}
     */

  }, {
    key: "getLeaderboardsForPsn",
    value: function getLeaderboardsForPsn(modes, code) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/LeaderboardsForPsn/{?modes,code}", {
        modes: modes.join(","),
        code: code
      })));
    }

    /**
     * @param {BungieNet.eums.membershipType} membershipType
     * @param {String} displayName
     * @param {Boolean} [ignoreCase = false]
     * @return {Promise.<Response>}
     */

  }, {
    key: "getMembershipIdByDisplayName",
    value: function getMembershipIdByDisplayName(membershipType, displayName, ignoreCase) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Stats/GetMembershipIdByDisplayName/{displayName}/{?ignorecase}", {
        membershipType: membershipType,
        displayName: displayName,
        ignorecase: ignoreCase
      })));
    }

    /**
     * @param {BungieNet.enums.bungieMembershipType} membershipType
     * @param {Boolean} flavour
     * @param {BigNumber} single
     * @return {Promise.<Response>}
     */

  }, {
    key: "getMyGrimoire",
    value: function getMyGrimoire(membershipType, flavour, single) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Vanguard/Grimoire/{membershipType}/{?flavour,single}", {
        membershipType: membershipType,
        flavour: flavour,
        single: single
      })));
    }

    /**
     * @param {BigNumber} activityInstanceId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPostGameCarnageReport",
    value: function getPostGameCarnageReport(activityInstanceId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/PostGameCarnageReport/{activityInstanceId}/", {
        activityInstanceId: activityInstanceId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPublicAdvisors",
    value: function getPublicAdvisors() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Advisors/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPublicAdvisorsV2",
    value: function getPublicAdvisorsV2() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Advisors/V2/")));
    }

    /**
     * @param {BigNumber} vendorId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPublicVendor",
    value: function getPublicVendor(vendorId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Vendors/{vendorId}/", {
        vendorId: vendorId.toString()
      })));
    }

    /**
     * @param {BigNumber} vendorId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPublicVendorWithMetadata",
    value: function getPublicVendorWithMetadata(vendorId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Vendors/{vendorId}/Metadata/", {
        vendorId: vendorId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getPublicXurVendor",
    value: function getPublicXurVendor() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Advisors/Xur/")));
    }

    /**
     * @param {BungieNet.enums.bungieMembershipType} membershipType
     * @param {BigNumber} recordBookHash
     * @return {Promise.<Response>}
     */

  }, {
    key: "getRecordBookCompletionStatus",
    value: function getRecordBookCompletionStatus(membershipType, recordBookHash) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/RecordBooks/{recordBookHash}/Completition/", {
        membershipType: membershipType,
        recordBookHash: recordBookHash.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getSpecialEventAdvisors",
    value: function getSpecialEventAdvisors() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/Events/")));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getTriumphs",
    value: function getTriumphs(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Triumphs/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getUniqueWeaponHistory",
    value: function getUniqueWeaponHistory(membershipType, destinyMembershipId, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/Stats/UniqueWeapons/{membershipType}/{destinyMembershipId}/{characterId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVault",
    value: function getVault(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Vault/{?accountId}", {
        membershipType: membershipType,
        accountId: destinyMembershipId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} destinyMembershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVaultSummary",
    value: function getVaultSummary(membershipType, destinyMembershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Vault/Summary/{?accountId}", {
        membershipType: membershipType,
        accountId: destinyMembershipId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @param {BigNumber} vendorId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVendorForCurrentCharacter",
    value: function getVendorForCurrentCharacter(membershipType, characterId, vendorId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @param {BigNumber} vendorId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVendorForCurrentCharacterWithMetadata",
    value: function getVendorForCurrentCharacterWithMetadata(membershipType, characterId, vendorId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Metadata/", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @param {BigNumber} vendorId
     * @param {BigNumber} itemId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVendorItemDetailForCurrentUser",
    value: function getVendorItemDetailForCurrentUser(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Item/{itemId}/", {
        membershipType: params.membershipType,
        characterId: params.characterId.toString(),
        vendorId: params.vendorId.toString(),
        itemId: params.itemId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @param {BigNumber} vendorId
     * @param {BigNumber} itemId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVendorItemDetailForCurrentUserWithMetadata",
    value: function getVendorItemDetailForCurrentUserWithMetadata(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Item/{itemId}/Metadata/", {
        membershipType: params.membershipType,
        characterId: params.characterId.toString(),
        vendorId: params.vendorId.toString(),
        itemId: params.itemId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} characterId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getVendorSummariesForCurrentCharacter",
    value: function getVendorSummariesForCurrentCharacter(membershipType, characterId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendors/Summaries/", {
        membershipType: membershipType,
        characterId: characterId.toString()
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {String} displayName
     * @return {Promise.<Response>}
     */

  }, {
    key: "searchDestinyPlayer",
    value: function searchDestinyPlayer(membershipType, displayName) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/Destiny/SearchDestinyPlayer/{membershipType}/{displayName}/", {
        membershipType: membershipType,
        displayName: displayName
      })));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} itemId
     * @param {BigNumber} characterId
     * @param {Boolean} state - true to lock, false to unlock
     * @return {Promise.<Response>}
     */

  }, {
    key: "setItemLockState",
    value: function setItemLockState(params) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/SetLockState/"), "POST", {
        membershipType: params.membershipType,
        itemId: params.itemId.toString(),
        characterId: params.characterId.toString(),
        state: params.state
      }));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {BigNumber} membershipId
     * @param {BigNumber} characterId
     * @param {BigNumber} itemId
     * @param {Boolean} state - true to track, false to not track
     * @return {Promise.<Response>}
     */

  }, {
    key: "setQuestTrackedState",
    value: function setQuestTrackedState(params) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/SetQuestTrackedState/"), "POST", {
        membershipType: params.membershipType,
        membershipId: params.membershipId.toString(),
        characterId: params.characterId.toString(),
        itemId: params.itemId.toString(),
        state: params.state
      }));
    }

    /**
     * @param {BungieNet.enums.membershipType} membershipType
     * @param {Number} itemReferenceHash
     * @param {BigNumber} itemId
     * @param {Number} stackSize
     * @param {BigNumber} characterId
     * @param {Boolean} transferToVault
     * @return {Promise.<Response>}
     */

  }, {
    key: "transferItem",
    value: function transferItem(params) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/Destiny/TransferItem/"), "POST", {
        membershipType: params.membershipType.toString(),
        itemReferenceHash: params.itemReferenceHash,
        itemId: params.itemId.toString(),
        stackSize: params.stackSize,
        characterId: params.characterId.toString(),
        transferToVault: params.transferToVault
      }));
    }

    /// Community Content Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "adminSetCommunityLiveMemberBanStatus",
    value: function adminSetCommunityLiveMemberBanStatus(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Partnerships/{p1}/{p2}/Ban/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "adminSetCommunityLiveMemberFeatureStatus",
    value: function adminSetCommunityLiveMemberFeatureStatus(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Partnerships/{p1}/{p2}/Feature/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "alterApprovalState",
    value: function alterApprovalState(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/AlterApprovalState/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "editContent",
    value: function editContent(p1) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Edit/{p1}/", {
        p1: p1
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAdminCommunityLiveStatuses",
    value: function getAdminCommunityLiveStatuses(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Admin/{p1}/{p2}/{p3}/{?name}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        name: params.name
      }), "POST", {}));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getApprovalQueue",
    value: function getApprovalQueue(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Queue/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCommunityContent",
    value: function getCommunityContent(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Get/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCommunityFeaturedActivityModes",
    value: function getCommunityFeaturedActivityModes() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/CommunityContent/Live/ActivityModes/Featured/")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCommunityLiveStatuses",
    value: function getCommunityLiveStatuses(params) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/All/{p1}/{p2}/{p3}/{?modeHash}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        modeHash: params.modeHash
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCommunityLiveStatusesForClanmates",
    value: function getCommunityLiveStatusesForClanmates(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Clan/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCommunityLiveStatusesForFriends",
    value: function getCommunityLiveStatusesForFriends(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Friends/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getFeaturedCommunityLiveStatuses",
    value: function getFeaturedCommunityLiveStatuses(p1, p2, p3) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Features/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })));
    }

    /**
     * @param {BungieNet.enums.partnershipType} partnershipType
     * @param {BungieNet.enums.bungieMembershipType} membershipType
     * @param {BigNumber} membershipId
     * @return {Promise.<Response>}
     */

  }, {
    key: "getStreamingStatusForMember",
    value: function getStreamingStatusForMember(partnershipType, membershipType, membershipId) {
      return this._serviceRequest(new _Request2.default(_urijs2.default.expand("/CommunityContent/Live/Users/{pType}/{mType}/{mId}/", {
        pType: partnershipType,
        mType: membershipType,
        mId: membershipId.toString()
      })));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "submitContent",
    value: function submitContent() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("/CommunityContent/Submit/"), "POST", {}));
    }

    /// Core Service

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getAvailableLocales",
    value: function getAvailableLocales() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("").path("//GetAvailableLocales")));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getCommonSettings",
    value: function getCommonSettings() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("").path("//Settings/")));
    }

    /**
     * @param {Boolean} includeStreaming
     * @return {Promise.<Response>}
     */

  }, {
    key: "getGlobalAlerts",
    value: function getGlobalAlerts() {
      var includeStreaming = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      return this._serviceRequest(new _Request2.default(new _urijs2.default("").path(_URITemplate2.default.expand("//GlobalAlerts/{?includestreaming}", {
        includestreaming: includeStreaming
      }))));
    }

    /**
     * @return {Promise.<Response>}
     */

  }, {
    key: "getSystemStatus",
    value: function getSystemStatus(p1) {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("").path(_URITemplate2.default.expand("//Status/{p1}/", {
        p1: p1
      }))));
    }

    /**
     * @return {Promise.<Response>}
     * @example
     * Response: "Hello World"
     */

  }, {
    key: "helloWorld",
    value: function helloWorld() {
      return this._serviceRequest(new _Request2.default(new _urijs2.default("").path("//HelloWorld/")));
    }
  }, {
    key: "activeRequestCount",
    get: function get() {
      return this._frameManager.getActive().size;
    }

    /**
     * Plugins to the platform
     * @type {Set}
     */

  }, {
    key: "plugins",
    get: function get() {
      return this._plugins;
    }

    /**
     * @type {Number}
     */

  }, {
    key: "maxConcurrent",
    get: function get() {
      return this._options.maxConcurrent;
    }

    /**
     * @param {Number} mc
     * @type {Number}
     */
    ,
    set: function set(mc) {
      this._options.maxConcurrent = mc;
      this._tryFrame();
    }

    /**
     * Number of queued requests
     * @return {Number}
     */

  }, {
    key: "queuedCount",
    get: function get() {
      return this._frameManager.getWaiting().size;
    }

    /**
     * Timeout for requests to the platform in milliseconds
     * @return {Number}
     */

  }, {
    key: "timeout",
    get: function get() {
      return this._options.timeout;
    }

    /**
     * @param {Number} timeout
     */
    ,
    set: function set(timeout) {
      this._options.timeout = timeout;
    }
  }], [{
    key: "_activeFrame",
    value: function _activeFrame(frame) {

      _BungieNet2.default.logger.log("verbose", "Frame is active", {
        frameId: frame.id
      });

      frame.state = _Frame2.default.state.active;
      frame.platformRequest.execute();
    }
  }]);

  return Platform;
}();

/**
 * Header key-name pairs
 * @type {Object}
 */


exports.default = Platform;
Platform.headers = {
  apiKey: "X-API-Key",
  contentType: "Content-Type"
};

/**
 * API content type
 * @type {String}
 */
Platform.contentType = "application/json";

/**
 * Platform event key-name pairs
 * @type {Object}
 */
Platform.events = {

  activeFrame: "platformActiveRequest",
  queuedFrame: "queuedFrame",

  frameBeforeSend: "frameBeforeSend",

  frameHttpError: "frameHttpError",
  frameHttpSuccess: "frameHttpSuccess",
  frameHttpDone: "frameHttpDone",

  frameResponseParsed: "frameResponseParsed",
  frameResponseCorrupt: "frameResponseCorrupt",

  frameError: "frameError",
  frameSuccess: "frameSuccess",
  frameDone: "frameDone"

};

/**
 * Default platform options
 * @type {Object}
 */
Platform.defaultOptions = {
  apiKey: "",
  maxConcurrent: -1,
  timeout: 5000
};