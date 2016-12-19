/*eslint valid-jsdoc: off, require-jsdoc: off*/

import BungieNet from "./BungieNet.js";
import Frame from "./Frame.js";
import FrameSet from "./FrameSet.js";
import FrameManager from "./FrameManager";
import PlatformRequest from "./PlatformRequest";
import request from "request";
import Request from "./Request.js";
import URI from "urijs";
import URITemplate from "urijs/src/URITemplate";

/**
 * Platform
 *
 * Notes:
 *
 * ===== Plugins =====
 * Plugins extend and dictate the operation of the platform. A platform instance
 * can have 0 or more plugins.
 *
 *
 *
 *
 *
 *
 * @example
 * let p = new Platform({
 *  apiKey: "api-key-here"
 * });
 *
 * p.timeout = 10000; //10 seconds
 *
 * p.getPublicAdvisorsV2().then(r => {
 * 	//Platform.Response
 * }, frame => {
 * 	//Platform.Frame
 * });
 *
 */
export default class Platform {

  /**
   * Initialise objects
   * @return {undefined}
   */
  _init() {

    /**
     * @type {Object}
     */
    this._options = Platform.defaultOptions;

    /**
     * @type {Platform.FrameSet}
     */
    this._frames = new FrameSet();

    /**
     * @type {Platform.FrameManager}
     */
    this._frameManager = new FrameManager(this._frames);

    /**
     * @type {Set<Platform.Plugin>}
     */
    this._plugins = new Set();

    /**
     * Instance-specific cookie store
     * @type {Object}
     */
    this._internalCookieJar = request.jar();

  }

  /**
  * @param {Object} opts = {}
  * @param {String} [opts.apiKey = ""] bungie.net API key
  * @param {Number} [opts.maxConcurrent = -1] - maximum concurrent requests, default is no limit
  * @param {Number} [opts.timeout = 5000] - network timeout in milliseconds
   */
  constructor(opts = {}) {

    this._init();

    //copy any value in opts to this._options
    //only copy matching keys
    //DON'T use hasOwnProperty - opts could be any object and that's OK
    //
    //NOTE: Object.assign is shallow; defaults are primitives anyway so it's OK
    Object.keys(this._options)
      .filter(x => x in opts)
      .forEach(x => {
        this._options[x] = opts[x];
      });

  }

  /**
   * Prepares the request and queues it
   * @param {Platform.Frame} frame - frame to prepare
   * @return {undefined}
   */
  _prepareRequest(frame) {

    frame.platformRequest = new PlatformRequest(frame);

    //set up a beforeSend handler to add other details
    frame.platformRequest.once(PlatformRequest.events.beforeSend, () => {

      const opts = frame.platformRequest.options;

      opts.timeout = this._options.timeout;
      opts.forever = true;
      opts.gzip = true;
      opts.headers[Platform.headers.contentType] = Platform.contentType;
      opts.headers[Platform.headers.apiKey] = this._options.apiKey;

    });

    //listen for frame info
    const listeners = {
      [PlatformRequest.events.beforeSend]: this._frameBeforeSend,
      [PlatformRequest.events.httpSuccess]: this._frameHttpSuccess,
      [PlatformRequest.events.httpError]: this._frameHttpError,
      [PlatformRequest.events.httpDone]: this._frameHttpDone,
      [PlatformRequest.events.responseParsed]: this._frameResponseParsed,
      [PlatformRequest.events.error]: this._frameError,
      [PlatformRequest.events.success]: this._frameSuccess,
      [PlatformRequest.events.done]: this._frameDone
    };

    for(const [eventName, handler] of Object.entries(listeners)) {
      frame.platformRequest.on(eventName, p => handler.call(this, p));
    }

    //queue it, then try the queue
    this._queueFrame(frame);
    this._tryFrame();

  }

  /**
   * API-level request method
   * @param  {Platform.Request} req
   * @return {Promise.<Platform.Response>}
   */
  _serviceRequest(req) {
    return new Promise((resolve, reject) => {

      const frame = new Frame();

      BungieNet.logger.log("info", "Received service request", {
        endpoint: req.uri.toString(),
        frameId: frame.id
      });

      frame.platform = this;
      frame.request = req;
      frame.serviceResolve = resolve;
      frame.serviceReject = reject;

      //construct the full path
      //copy any query string params
      //add the locale
      frame.request.uri =
        BungieNet.platformPath
        .segment(req.uri.path())
        .setSearch(req.uri.search(true));

      //urijs is smart enough to remove the trailing forwards-slash
      //so add it back in manually
      if(!frame.request.uri.path().endsWith("/")) {
        frame.request.uri.path(`${ frame.request.uri.path() }/`);
      }

      this._prepareRequest(frame);

    });
  }

  /**
   * @param {Frame} frame - frame to set as active
   */
  static _activeFrame(frame) {

    BungieNet.logger.log("verbose", "Frame is active", {
      frameId: frame.id
    });

    frame.state = Frame.state.active;
    frame.platformRequest.execute();

  }

  /**
   * @param {Frame} frame - frame to queue
   */
  _queueFrame(frame) {

    BungieNet.logger.log("verbose", "Frame queued", {
      frameId: frame.id
    });

    frame.state = Frame.state.waiting;
    this._frameManager.addFrame(frame);

  }

  /**
   * Attempts to begin a request, taking any conditiions into account
   * @return {Promise}
   */
  _tryFrame() {
    return new Promise((resolve, reject) => {

      BungieNet.logger.log("verbose", "Trying for a frame...");

      //check if too many ongoing requests
      if(this._options.maxConcurrent >= 0) {
        if(this._frameManager.getActive().size >= this._options.maxConcurrent) {
          BungieNet.logger.log("warn", "Cannot get a frame - too many active requests");
          return reject();
        }
      }

      const frame = this._frameManager.getFrame();

      if(frame === null) {
        return reject();
      }

      return Promise.resolve(Platform._activeFrame(frame));

    });
  }

  /**
   * Updates plugins with the given event name and any data
   * @param {String} eventName
   * @param {*[]} args - array of arguments to be passed to plugin function
   * @return {Promise}
   */
  _notifyPlugins(eventName, ...args) {
    for(const p of this._plugins) {
      p.update(eventName, ...args);
    }
  }


  _frameBeforeSend(e) {
    this._notifyPlugins(Platform.events.frameBeforeSend, e);
  }

  _frameHttpError(e) {
    this._notifyPlugins(Platform.events.frameHttpError, e);
  }

  _frameHttpSuccess(e) {
    this._notifyPlugins(Platform.events.frameHttpSuccess, e);
  }

  _frameHttpDone(e) {
    e.target.frame.state = Frame.state.done;
    this._notifyPlugins(Platform.events.frameHttpDone, e);
  }

  _frameResponseParsed(e) {
    this._notifyPlugins(Platform.events.frameResponseParsed, e);
  }

  _frameError(e) {
    this._notifyPlugins(Platform.events.frameError, e);
    e.target.frame.serviceReject();
    this._frameDone(e);
  }

  _frameSuccess(e) {
    this._notifyPlugins(Platform.events.frameSuccess, e);
    e.target.frame.serviceResolve(e.target.frame.response);
    this._frameDone(e);
  }

  _frameDone(e) {
    this._notifyPlugins(Platform.events.frameDone, e);
    this._frameManager.removeFrame(e.target.frame);
  }


  /// Platform Options

  /**
   * Number of active requests
   * @return {Number}
   */
  get activeRequestCount() {
    return this._frameManager.getActive().size;
  }

  addPlugin(p) {
    this._plugins.add(p);
  }

  removePlugin(p) {
    this._plugins.delete(p);
  }

  get cookieJar() {
    return this._options.cookieJar;
  }

  set cookieJar(ok) {
    this._options.cookieJar = ok;
  }

  get internalCookieJar() {
    return this._internalCookieJar;
  }

  /**
   * @type {Number}
   */
  get maxConcurrent() {
    return this._options.maxConcurrent;
  }

  /**
   * @param {Number} mc
   * @type {Number}
   */
  set maxConcurrent(mc) {
    this._options.maxConcurrent = mc;
    this._tryFrame();
  }

  /**
   * Number of queued requests
   * @return {Number}
   */
  get queuedCount() {
    return this._frameManager.getWaiting().size;
  }

  /**
   * Timeout for requests to the platform in milliseconds
   * @return {[type]} [description]
   */
  get timeout() {
    return this._options.timeout;
  }

  /**
   * @param  {Number} timeout
   */
  set timeout(timeout) {
    this._options.timeout = timeout;
  }



  /// Application Service

  /**
   * @param {Number} ownerMembershipId - member id to search apps for
   * @param {Number} currentPage - result page
   * @return {Promise.<Platform.Response>}
   */
  applicationSearch(ownerMembershipId, currentPage = 0) {
    return this._serviceRequest(new Request(
      new URI("/App/Search/"),
      "POST",
      {
        ownerMembershipId,
        currentPage
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  changeApiKeyStatus(keyId, state) {
    return this._serviceRequest(new Request(
      URI.expand("/App/ChangeApiKeyState/{keyId}/{state}/", {
        keyId,
        state
      }),
      "POST",
      null
    ));
  }

  /**
   * Response: {
   *  apiKey: "-new-api-key",
   *  apiKeyId: 783639,
   *  authorizationUrl: "https://www.bungie.net/en/Application/Authorize/783639",
   *  creationDate: "2016-12-19T11:05:41.603Z",
   *  status: 1
   * }
   * @return {Promise.<Platform.Response>}
   */
  createApiKey(appId) {
    return this._serviceRequest(new Request(
      URI.expand("/App/CreateApiKey/{appId}/", {
        appId
      }),
      "POST",
      null
    ));
  }

  /**
   * @param {Object} details
   * @param {Boolean} details.agreedToCurrentEula - true to agree
   * @param {String} details.link - website link for appId
   * @param {String} details.name - name of app
   * @param {String} details.origin - origin header
   * @param {String} details.redirectUrl - oauth redirect url
   * @param {BigNumber} details.scope - scope of app access
   * @return {Promise.<Platform.Response>}
   */
  createApplication(details) {
    return this._serviceRequest(new Request(
      new URI("/App/CreateApplication/"),
      "POST",
      details
    ));
  }

  /**
   * @param {Object} details
   * @param {String} details.link - website link for app
   * @param {String} details.name - name of app
   * @param {String} details.origin - origin header
   * @param {String} details.redirectUrl - oauth redirect url
   * @param {BigNumber} details.scope - scope of app access
   * @param {BigNumber} details.status - app status
   * @return {Promise.<Platform.Response>}
   */
  editApplication(appId, details) {
    return this._serviceRequest(new Request(
      URI.expand("/App/EditApplication/{appId}/", {
        appId
      }),
      "POST",
      details
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAccessTokensFromCode() {
    return this._serviceRequest(new Request(
      new URI("/App/GetAccessTokensFromCode/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAccessTokensFromRefreshToken() {
    return this._serviceRequest(new Request(
      new URI("/App/GetAccessTokensFromRefreshToken/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {Number} appId
   * @return {Promise.<Platform.Response>}
   */
  getApplication(appId) {
    return this._serviceRequest(new Request(
      URI.expand("/App/Application/{appId}/", {
        appId
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getApplicationApiKeys(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/App/ApplicationApiKeys/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAuthorizationForUserAndApplication(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/App/Authorization/{p1}/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAuthorizations(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/App/Authorizations/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  privateApplicationSearch() {
    return this._serviceRequest(new Request(
      new URI("/App/PrivateSearch/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  revokeAuthorization(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/App/RevokeAuthorization/{p1}/{p2}/", {
        p1,
        p2
      }),
      "POST",
      {

      }
    ));
  }



  /// User Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  createUser() {
    return this._serviceRequest(new Request(
      new URI("/User/CreateUser/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  editSuccessMessageFlags(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/MessageFlags/Success/Update/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAvailableAvatars() {
    return this._serviceRequest(new Request(
      new URI("/User/GetAvailableAvatars/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAvailableAvatarsAdmin(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/GetAvailableAvatarsAdmin/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAvailableThemes() {
    return this._serviceRequest(new Request(
      new URI("/User/GetAvailableThemes/")
    ));
  }

  /**
   * @param  {BigNumber} membershipId
   * @param  {BungieNet.enums.bungieMembershipType} membershipType
   */
  getBungieAccount(membershipId, membershipType) {
    return this._serviceRequest(new Request(
      URI.expand("/User/GetBungieAccount/{membershipId}/{membershipType}/", {
        membershipId: membershipId.toString(),
        membershipType
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId - bungie.net memberId
   * @return {Promise.<Platform.Response>}
   */
  getBungieNetUserById(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/User/GetBungieNetUserById/{membershipId}/", {
        membershipId: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCountsForCurrentUser() {
    return this._serviceRequest(new Request(
      new URI("/User/GetCounts/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: [
   *  {
   *    credentialType: 2,
   *    credentialDisplayName: "Psnid",
   *    isPublic: false
   *  },
   *  {
   *    ...
   *  }
   * ]
   */
  getCredentialTypesForAccount() {
    return this._serviceRequest(new Request(
      new URI("/User/GetCredentialTypesForAccount/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: {
   *  destinyAccounts: [],
   *  bungieNetUser: {},
   *  clans: [],
   *  relatedGroups: {},
   *  destinyAccountErrors: []
   * }
   */
  getCurrentBungieAccount() {
    return this._serviceRequest(new Request(
      new URI("/User/GetCurrentBungieAccount/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCurrentUser() {
    return this._serviceRequest(new Request(
      new URI("/User/GetBungieNetUser/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
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
   * ]
   */
  getMobileAppPairings() {
    return this._serviceRequest(new Request(
      new URI("/User/GetMobileAppPairings/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example {@see getMobileAppPairings}
   */
  getMobileAppPairingsUncached() {
    return this._serviceRequest(new Request(
      new URI("/User/GetMobileAppPairingsUncached/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
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
  getNotificationSettings() {
    return this._serviceRequest(new Request(
      new URI("/User/GetNotificationSettings/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPartnerships(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/{p1}/Partnerships/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
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
  getPlatformApiKeysForUser() {
    return this._serviceRequest(new Request(
      new URI("/User/GetPlatformApiKeysForUser/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: "/ExpireWebAuth.ashx?..."
   */
  getSignOutUrl() {
    return this._serviceRequest(new Request(
      new URI("/User/GetSignOutUrl/")
    ));
  }

  /**
   * @param {BigNumber} membershipId - bungie.net membership id
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: []
   */
  getUserAliases(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/User/GetUserAliases/{membershipId}/", {
        membershipId: membershipId.toString()
      })
    ));
  }

  /**
   * @param {Boolean} [excludeBungieNet = false] - exclude bungie.net member id
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: {
   *  -id-as-key-: -membership-type-as-value-,
   *  ...
   * }
   */
  getUserMembershipIds(excludeBungieNet = false) {
    return this._serviceRequest(new Request(
      URI.expand("/User/GetMembershipIds/{?excludebungienet}", {
        excludeBungieNet
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  linkOverride() {
    return this._serviceRequest(new Request(
      new URI("/User/LinkOverride/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  registerMobileAppPair() {
    return this._serviceRequest(new Request(
      new URI("/User/RegisterMobileAppPair/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {*} p1
   * @return {Promise.<Platform.Response>}
   */
  removePartnership(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/Partnerships/{p1}/Remove/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {String} username - query to search for
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: [
   *  { user information },
   *  ...
   * ]
   */
  searchUsers(username) {
    return this._serviceRequest(new Request(
      URI.expand("/User/SearchUsers/{?q}", {
        q: username
      })
    ));
  }

  /**
   * @param {String} username - search query
   * @param {Number} [page = 1] - 1-based page number
   * @return {Promise.<Platform.Response>}
   * @example {@see searchUsers}
   */
  searchUsersPaged(username, page = 1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/SearchUsersPaged/{searchTerm}/{page}/", {
        searchTerm: username,
        page
      })
    ));
  }

  /**
   * @param {String} username - search query
   * @param {Number} [page = 1] 1-based page number
   * @param {*} [p3 = null] UNKNOWN
   * @return {Promise.<Platform.Response>}
   * @example {@see SearchUsersPaged}
   */
  searchUsersPagedV2(username, page = 1, p3 = null) {
    return this._serviceRequest(new Request(
      URI.expand("/User/SearchUsersPaged/{searchTerm}/{page}/{p3}/", {
        searchTerm: username,
        page,
        p3
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  setAcknowledged(ackId) {
    return this._serviceRequest(new Request(
      URI.expand("/User/Acknowledged/{ackId}/", {
        ackId
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  unregisterMobileAppPair(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/UnregisterMobileAppPair/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  updateDestinyEmblemAvatar() {
    return this._serviceRequest(new Request(
      new URI("/User/UpdateDestinyEmblemAvatar/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  updateNotificationSetting() {
    return this._serviceRequest(new Request(
      new URI("/User/Notification/Update/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  updateStateInfoForMobileAppPair() {
    return this._serviceRequest(new Request(
      new URI("/User/UpdateStateInfoForMobileAppPair/"),
      "POST",
      {

      }
    ));
  }

  /**
   * Updates the user with the given options
   * @link https://destinydevs.github.io/BungieNetPlatform/docs/UserService/UpdateUser#/JSON-POST-Parameters
   * @param  {Object} opts
   * @return {Promise.<Platform.Response>}
   */
  updateUser(opts) {
    return this._serviceRequest(new Request(
      new URI("/User/UpdateUser/"),
      "POST",
      opts
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  updateUserAdmin(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/User/UpdateUserAdmin/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }



  /// Message Service

  /**
   * @param {BigNumber[]} membersTo - array of memberIDs
   * @param {String} body - body of the message
   * @return {Promise.<Platform.Response>}
   */
  createConversation(membersTo, body) {
    return this._serviceRequest(new Request(
      new URI("/Message/CreateConversation/"),
      "POST",
      {
        membersToId: membersTo.map(bn => bn.toString()),
        body
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  createConversationV2() {
    return this._serviceRequest(new Request(
      new URI("/Message/CreateConversationV2/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAllianceInvitedToJoinInvitations(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/AllianceInvitations/InvitationsToJoinAnotherGroup/{p1}/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAllianceJoinInvitations(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/AllianceInvitations/RequestsToJoinYourGroup/{p1}/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @param {BigNumber} conversationId
   * @return {Promise.<Platform.Response>}
   */
  getConversationById(conversationId) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationById/{conversationId}/", {
        conversationId: conversationId.toString()
      })
    ));
  }

  /**
   * @param  {BigNumber} conversationId - conversation id
   * @return {Promise.<Platform.Response>}
   */
  getConversationByIdV2(conversationId) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationByIdV2/{id}/", {
        id: conversationId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getConversationsV2(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationsV2/{p1}/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getConversationsV3(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationsV3/{p1}/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getConversationsV4(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationsV4/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @param  {Number} [page = 1]
   * @return {Promise.<Platform.Response>}
   */
  getConversationsV5(page = 1) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationsV5/{page}/", {
        page
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getConversationThreadV2(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationThreadV2/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  getConversationThreadV3(params) {
    return this._serviceRequest(new Request(
      URI.expand(
        "/Message/GetConversationThreadV3/{id}/{page}/{?after,before}", {
          id: params.id.toString(),
          page: params.page,
          after: params.after.toString(),
          before: params.before.toString()
        })
      ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getConversationWithMemberId(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationWithMember/{id}/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param  {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getConversationWithMemberIdV2(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetConversationWithMemberV2/{id}/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param  {Number} [page = 1] - 1-based
   * @return {Promise.<Platform.Response>}
   */
  getGroupConversations(page = 1) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/GetGroupConversations/{page}/", {
        page
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getInvitationDetails(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/Invitations/{p1}/Details/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getTotalConversationCount() {
    return this._serviceRequest(new Request(
      new URI("/Message/GetTotalConversationCount/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getUnreadConversationCountV2() {
    return this._serviceRequest(new Request(
      new URI("/Message/GetUnreadPrivateConversationCount/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getUnreadConversationCountV3() {
    return this._serviceRequest(new Request(
      new URI("/Message/GetTotalConversationCountV3/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getUnreadConversationCountV4() {
    return this._serviceRequest(new Request(
      new URI("/Message/GetUnreadConversationCountV4/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getUnreadGroupConversationCount() {
    return this._serviceRequest(new Request(
      new URI("/Message/GetUnreadGroupConversationCount/")
    ));
  }

  /**
   * Leave a given conversation by id
   * @param  {BigNumber} conversationId
   * @return {Promise.<Platform.Response>}
   */
  leaveConversation(conversationId) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/LeaveConversation/{id}/", {
        id: conversationId.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} messageId
   * @return {Promise.<Platform.Response>}
   */
  moderateGroupWall(groupId, messageId) {
    return this._serviceRequest(new Request(
      new URI("/Message/ModerateGroupWall/{groupId}/{messageId}/"),
      "POST",
      {
        groupId: groupId.toString(),
        messageId: messageId.toString()
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  reviewAllInvitations(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/Invitations/ReviewAllDirect/{p1}/{p2}/", {
        p1,
        p2
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  reviewInvitation(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/Invitations/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  reviewInvitationDirect(invitationId, invitationResponseState) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/Invitations/ReviewDirect/{id}/{state}/", {
        id: invitationId,
        state: invitationResponseState
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  reviewInvitations(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Message/Invitations/ReviewListDirect/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  saveMessageV2() {
    return this._serviceRequest(new Request(
      new URI("/Message/SaveMessageV2/"),
      "POST",
      {

      }
    ));
  }

  /**
   * Add a message to a conversation
   * @param  {String} body
   * @param  {BigNumber} conversationId
   * @return {Promise.<Platform.Response>}
   */
  saveMessageV3(body, conversationId) {
    return this._serviceRequest(new Request(
      new URI("/Message/SaveMessageV3/"),
      "POST",
      {
        body,
        conversationId: conversationId.toString()
      }
    ));
  }

  /**
   * Currently used by bungie.net to save a message to a group wall
   * @param {String} body
   * @param {BigNumber} conversationId
   * @param {String} [subject = ""]
   * @return {Promise.<Platform.Response>}
   */
  saveMessageV4(conversationId, body, subject = "") {
    return this._serviceRequest(new Request(
      new URI("/Message/SaveMessageV4/"),
      "POST",
      {
        conversationId: conversationId.toString(),
        body,
        subject
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  updateConversationLastViewedTimestamp() {
    return this._serviceRequest(new Request(
      new URI("/Message/Conversation/UpdateLastViewedTimestamp/"),
      "POST",
      {

      }
    ));
  }

  /**
   * Signal that the current user is typing a message
   *
   * Bungie.net sends a number as the conversationId rather than as a string,
   * but both appear to work
   *
   * @param  {BigNumber} conversationId
   * @return {Promise.<Platform.Response>}
   */
  userIsTyping(conversationId) {
    return this._serviceRequest(new Request(
      new URI("/Message/UserIsTyping/"),
      "POST",
      {
        conversationId: conversationId.toString()
      }
    ));
  }



  /// Notification Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  getRealTimeEvents(p1, p2, timeout) {
    return this._serviceRequest(new Request(
      URI.expand("/Notification/Events/{p1}/{p2}/{?timeout}", {
        timeout
      })
    ));
  }

  /**
   * @deprecated
   */
  getRecentNotificationCount() {
    return this._serviceRequest(new Request(
      new URI("/Notification/GetCount/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getRecentNotifications() {
    return this._serviceRequest(new Request(
      new URI("/Notification/GetRecent/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  resetNotification() {
    return this._serviceRequest(new Request(
      new URI("/Notification/Reset/")
    ));
  }



  /// Content Service

  /**
   * @param {BigNumber} careerId
   * @return {Promise.<Platform.Response>}
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
  getCareer(careerId) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Careers/{id}/", {
        id: careerId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
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
  getCareers() {
    return this._serviceRequest(new Request(
      new URI("/Content/Careers/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getContentById(p1, p2, head) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/GetContentById/{p1}/{p2}/{?head}", {
        p1,
        p2,
        head
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getContentByTagAndType(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/GetContentByTagAndType/{p1}/{p2}/{p3}/{?,head}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        head: params.head
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getContentType(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/GetContentType/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinyContent(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Destiny/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinyContentV2(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Destiny/V2/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFeaturedArticle() {
    return this._serviceRequest(new Request(
      new URI("/Content/Site/Featured/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getHomepageContent(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Homepage/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getHomepageContentV2() {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Homepage/V2/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getJobs(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Jobs/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @param {Number} currentPage = 1
   */
  getNews(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/News/{p1}/{p2}/{?itemsperpage,currentpage}", {
        p1: params.p1,
        p2: params.p2,
        itemsperpage: params.itemsPerPage,
        currentpage: params.currentPage
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPromoWidget() {
    return this._serviceRequest(new Request(
      new URI("/Content/Site/Destiny/Promo/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPublications(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Publications/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @param {String} query - search query
   * @return {Promise.<Platform.Response>}
   */
  searchCareers(query) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Careers/Search/{?searchtext}", {
        searchtext: query
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  searchContentByTagAndType(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/SearchContentByTagAndType/{p1}/{p2}/{p3}/{?head,currentpage,itemsperpage}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        head: params.head,
        currentpage: params.currentPage,
        itemsperpage: params.itemsPerPage
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  searchContentEx(p1, head) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/SearchEx/{p1}/{?,head}", {
        p1,
        head
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  searchContentWithText(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Content/Site/Homepage/{p1}/{?head,ctype,tag,currentpage,searchtext}/", {
        p1: params.p1,
        head: params.head,
        ctype: params.cType,
        tag: params.tag,
        currentpage: params.currentPage,
        searchtext: params.searchText
      }),
      "POST",
      {

      }
    ));
  }



  /// ExternalSocial Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAggregatedSocialFeed(p1, types) {
    return this._serviceRequest(new Request(
      URI.expand("/ExternalSocial/GetAggregatedSocialFeed/{p1}/{?,types}", {
        p1,
        types
      })
    ));
  }



  /// Survey Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  getSurvey() {
    return this._serviceRequest(new Request(
      new URI("/Survey/GetSurvey/")
    ));
  }



  /// Forum Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  approveFireteamThread(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Recruit/Approve/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  changeLockState(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/ChangeLockState/{p1}/{p2}/", {
        p1,
        p2
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  changePinState(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/ChangePinState/{p1}/{p2}/", {
        p1,
        p2
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  createContentComment() {
    return this._serviceRequest(new Request(
      new URI("/Forum/CreateContentComment/"),
      "POST",
      {

      }
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  createPost(post) {
    return this._serviceRequest(new Request(
      new URI("/Forum/CreatePost/"),
      "POST",
      post
    ));
  }

  /**
   * @param {BigNumber} postId
   * @return {Promise.<Platform.Response>}
   */
  deletePost(postId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/DeletePost/{id}/", {
        id: postId.toString()
      }),
      "POST",
      {

      }
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  editPost(postId, post) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/EditPost/{id}/", {
        id: postId.toString()
      }),
      "POST",
      {
        body: post.body,
        category: post.category,
        disableBits: post.disableBits,
        isGroupPostPrivate: post.isGroupPostPrivate,
        metata: post.metadata,
        subject: post.subject,
        tagCategory: post.tagCategory,
        tagInput: post.tagInput,
        urlLinkOrImage: post.urlLinkOrImage
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCoreTopicsPaged(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetCoreTopicsPaged/{p1}/{p2}/{p3}/{p4}/", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        p4: params.p4
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getForumTagCountEstimate(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetForumTagCountEstimate/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getForumTagSuggestions(partialTag) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetForumTagSuggestions/{p1}/{?,partialtag}", {
        partialtag: partialTag
      })
    ));
  }

  /**
   * @param {BigNumber} postId - postId of the post containing the poll
   * @return {Promise.<Platform.Response>}
   */
  getPoll(postId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Poll/{postId}/", {
        postId: postId.toString()
      })
    ));
  }

  /**
   * @param {Number} quantity
   * @param {*} tagsSinceDate
   * @return {Promise.<Platform.Response>}
   */
  getPopularTags(quantity, tagsSinceDate) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetPopularTags/{?quantity,tagsSinceDate}", {
        quantity,
        tagsSinceDate
      })
    ));
  }

  /**
   * @param {BigNumber} childPostId
   * @param {Boolean} [showBanned = false]
   * @return {Promise.<Platform.Response>}
   */
  getPostAndParent(childPostId, showBanned = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetPostAndParent/{childPostId}/{?showbanned}", {
        childPostId: childPostId.toString(),
        showbanned: showBanned
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPostAndParentAwaitingApproval(childPostId, showBanned) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetPostAndParentAwaitingApproval/{childPostId}/{?,showbanned}", {
        childPostId,
        showBanned
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPostsThreadedPaged(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetPostsThreadedPaged/{parentPostId}/{page}/{pageSize}/{replySize}/{getParentPost}/{rootThreadMode}/{sortMode}/{?showbanned}", {
        parentPostId: params.parentPostId,
        page: params.page,
        pageSize: params.pageSize,
        replySize: params.replySize,
        getParentPost: params.getParentPost,
        rootThreadMode: params.rootThreadMode,
        sortMode: params.sortMode,
        showbanned: params.showBanned
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPostsThreadedPagedFromChild(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetPostsThreadedPagedFromChild/{childPostId}/{page}/{pageSize}/{replySize}/{rootThreadMode}/{sortMode}/{?showbanned}", {
        childPostId: params.childPostId,
        page: params.page,
        pageSize: params.pageSize,
        replySize: params.replySize,
        rootThreadMode: params.rootThreadMode,
        sortMode: params.sortMode,
        showbanned: params.showBanned
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getRecruitmentThreadSummaries() {
    return this._serviceRequest(new Request(
      new URI("/Forum/Recruit/Summaries/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getTopicForContent(contentId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetTopicForContent/{contentId}/", {
        contentId
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getTopicsPaged(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/GetTopicsPaged/{page}/{pageSize}/{group}/{sort}/{quickDate}/{categoryFilter}/{?tagstring}", {
        page: params.page,
        pageSize: params.pageSize,
        group: params.group,
        sort: params.sort,
        quickDate: params.quickDate,
        categoryFilter: params.categoryFilter,
        tagstring: params.tagString
      })
    ));
  }

  /**
   * @param {BigNumber} postId
   * @return {Promise.<Platform.Response>}
   */
  joinFireteamThread(postId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Recruit/Join/{id}/", {
        id: postId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} postId
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  kickBanFireteamApplicant(postId, membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Recruit/{postId}/{membershipId}/", {
        postId: postId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} postId
   * @return {Promise.<Platform.Response>}
   */
  leaveFireteamThread(postId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Recruit/Leave/{id}/", {
        id: postId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} answerPostId
   * @param {BigNumber} questionTopicId
   * @return {Promise.<Platform.Response>}
   */
  markReplyAsAnswer(answerPostId, questionTopicId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/MarkReplyAsAnswer/{answer}/{question}/", {
        answer: answerPostId.toString(),
        question: questionTopicId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} postId
   * @param {BigNumber} moderatedItemId
   * @param {Number} reason
   * @param {String} [comments = "group post ban"]
   * @param {BungieNet.enums.affectedItemType} [moderatedItemType = BungieNet.enums.affectedItemType.post]
   * @param {BungieNet.enums.requestedPunishment} [requestedPunishment = BungieNet.enums.requestedPunishment.ban]
   * @return {Promise.<Platform.Response>}
   */
  moderateGroupPost(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Post/{postId}/GroupModerate/", {
        postId: params.postId.toString()
      }),
      "POST",
      {
        comments: params.comments,
        moderatedItemId: params.moderatedItemId.toString(),
        moderatedItemType: params.moderatedItemType,
        reason: params.reason,
        requestedPunishment: params.requestedPunishment
      }
    ));
  }

  /**
   *
   * @return {Promise.<Platform.Response>}
   */
  moderatePost(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Post/{p1}/Moderate/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  moderateTag(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Tags/{p1}/Moderate/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   *
   * - payload is set to null, this may result in a bug
   * @param {BigNumber} pollId
   * @param {Number} optionIndex - 0-based index of the option being voted for
   * @return {Promise.<Platform.Response>}
   */
  pollVote(pollId, optionIndex) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/Poll/Vote/{pollId}/{index}/", {
        pollId: pollId.toString(),
        optionIndex
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} postId
   * @param {Number} rating - 0 to 100, currently only 0 OR 100
   * @return {Promise.<Platform.Response>}
   */
  ratePost(postId, rating) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/RatePost/{postId}/{rating}/", {
        postId: postId.toString(),
        rating
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} topicId
   * @return {Promise.<Platform.Response>}
   */
  unmarkReplyAsAnswer(topicId) {
    return this._serviceRequest(new Request(
      URI.expand("/Forum/UnmarkReplyAsAnswer/{topicId}/", {
        topicId: topicId.toString()
      })
    ));
  }



  /// Activity Service

  /**
   * @param {String} tag - ie. #destiny, hash included
   * @return {Promise.<Platform.Response>}
   */
  followTag(tag) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Tag/Follow/{?tag}", {
        tag
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  followUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{id}/Follow/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {*} p1
   * @param {*} p2
   * @param {Number} [currentPage = 1]
   * @return {Promise.<Platform.Response>}
   */
  getApplicationActivityForUser(p1, p2, currentPage = 1) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Activities/Application/{p2}/{?page}", {
        p1,
        p2,
        page: currentPage
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @deprecated 2016-09-10
   */
  getAggregatedActivitiesForCurrentUser(typeFilter, format) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Aggregation/{?typefilter,format}", {
        typefilter: typeFilter,
        format
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getEntitiesFollowedByCurrentUser() {
    return this._serviceRequest(new Request(
      new URI("/Activity/Following/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getEntitiesFollowedByCurrentUserV2(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Following/V2/{p1}/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getEntitiesFollowedByUser(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Following/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getEntitiesFollowedByUserV2(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Following/V2/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFollowersOfTag(tag, itemsPerPage, currentPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Tag/Followers/{?tag,itemsperpage,currentpage}", {
        tag,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFollowersOfUser(membershipId, itemsPerPage, currentPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{membershipId}/Followers/{?itemsperpage,currentpage}", {
        membershipId,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getForumActivitiesForUser(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/{?itemsperpage,currentpage,format}", {
        p1: params.p1,
        itemsperpage: params.itemsPerPage,
        currentpage: params.currentPage,
        format: params.format
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getForumActivitiesForUserV2(p1, currentPage, format) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Activities/ForumsV2/{?currentpage,format}", {
        p1,
        currentpage: currentPage,
        format
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFriends() {
    return this._serviceRequest(new Request(
      new URI("/Activity/Friends/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFriendsAllNoPresence(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Friends/AllNoPresence/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFriendsPaged(membershipType, page) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Friends/{membershipType}/{page}/", {
        membershipType,
        page
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getGroupsFollowedByCurrentUser() {
    return this._serviceRequest(new Request(
      new URI("/Activity/Following/Groups/")
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getGroupsFollowedByUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{id}/Following/Groups/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getGroupsFollowedPagedByCurrentUser(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Following/Groups/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getGroupsFollowedPagedByUser(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Following/Groups/Paged/{p2}/", {
        p1,
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getLikeAndShareActivityForUser(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Activities/LikesAndShares/{?itemsperpage,currentpage,format}", {
        p1: params.p1,
        itemsperpage: params.itemsPerPage,
        currentpage: params.currentPage,
        format: params.format
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getLikeAndShareActivityForUserV2(p1, currentPage, format) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Activities/LikesAndSharesV2/{?currentpage,format}", {
        p1,
        currentpage: currentPage,
        format
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getLikeShareAndForumActivityForUser(p1, currentPage, format) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{p1}/Activities/LikeShareAndForum/{?currentpage,format}", {
        p1,
        currentpage: currentPage,
        format
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getUsersFollowedByCurrentUser() {
    return this._serviceRequest(new Request(
      new URI("/Activity/Following/Users/")
    ));
  }

  /**
   * @param {String} tag - ie. #destiny, with hash
   * @return {Promise.<Platform.Response>}
   */
  unfollowTag(tag) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/Tag/Unfollow/{?tag}", {
        tag
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  unfollowUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Activity/User/{id}/Unfollow/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }



  /// Group Service

  /**
   * @param {BigNumber} groupId
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  approveAllPending(groupId, message) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/ApproveAll/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  approveGroupMembership(groupId, membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Approve/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  approveGroupMembershipV2(groupId, membershipId, message) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/ApproveV2/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {
        message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {String} message
   * @param {BigNumber[]} membershipIds
   * @return {Promise.<Platform.Response>}
   */
  approvePendingForList(groupId, message, membershipIds) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/ApproveList/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        membershipIds: membershipIds.map(bn => bn.toString()),
        message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {String} comment
   * @param {BungieNet.enums.moderatorRequestedPunishment} - might not be right enum
   * @return {Promise.<Platform.Response>}
   */
  banMember(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Ban/", {
        groupId: params.groupId.toString(),
        membershipId: params.membershipId.toString()
      }),
      "POST",
      {
        comment: params.comment,
        length: params.length
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} allyGroupId
   * @return {Promise.<Platform.Response>}
   */
  breakAlliance(groupId, allyGroupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Relationship/{allyGroupId}/BreakAlliance/", {
        groupId: groupId.toString(),
        allyGroupId: allyGroupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  breakAlliances(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/BreakAlliances/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  createGroup() {
    return this._serviceRequest(new Request(
      new URI("/Group/Create/"),
      "POST",
      {

      }
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  createGroupV2(details) {
    return this._serviceRequest(new Request(
      new URI("/Group/Create/V2/"),
      "POST",
      details
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  createMinimalGroup(name, about) {
    return this._serviceRequest(new Request(
      new URI("/Group/Create/Minimal/"),
      "POST",
      {
        groupName: name,
        groupAbout: about
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  denyAllPending(groupId, message) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/DenyAll/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  denyGroupMembership(groupId, membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Deny/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  denyGroupMembershipV2(groupId, membershipId, message) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/DenyV2/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {
        message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {String} message
   * @param {BigNumber[]} membershipIds
   * @return {Promise.<Platform.Response>}
   */
  denyPendingForList(groupId, message, membershipIds) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/DenyList/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        message,
        membershipIds: membershipIds.map(bn => bn.toString())
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType}
   * @return {Promise.<Platform.Response>}
   */
  diableClanForGroup(groupId, clanMembershipType) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Clans/Disable/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  disbandAlliance(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/BreakAllAlliances/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  editGroup(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Edit/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {BungieNet.enums.groupMemberType} groupMembershipType
   * @param {*} [clanPlatformType = 0]
   * @return {Promise.<Platform.Response>}
   */
  editGroupMembership(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/SetMembershipType/{groupMembershipType}/{?clanPlatformType}", {
        groupId: params.groupId.toString(),
        membershipId: params.membershipId.toString(),
        groupMembershipType: params.groupMembershipType,
        clanPlatformType: params.clanPlatformType
      }),
      "POST",
      {

      }
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  editGroupV2(groupId, details) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/EditV2/", {
        groupId: groupId.toString()
      }),
      "POST",
      details
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @param {String} clanName
   * @return {Promise.<Platform.Response>}
   */
  enableClanForGroup(groupId, clanMembershipType, clanName) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Clans/Enable/{clanMembershipType}/{?clanName}", {
        groupId: groupId.toString(),
        clanMembershipType,
        clanName
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  followGroupsWithGroup(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/FollowList/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} followGroupId
   * @return {Promise.<Platform.Response>}
   */
  followGroupWithGroup(groupId, followGroupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Follow/{followGroupId}/", {
        groupId: groupId.toString(),
        followGroupId: followGroupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} itemsPerPage
   * @param {Number} currentPage
   * @return {Promise.<Platform.Response>}
   */
  getAdminsOfGroup(groupId, itemsPerPage, currentPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Admins/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage,
        currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} itemsPerPage
   * @param {Number} currentPage
   * @return {Promise.<Platform.Response>}
   */
  getAdminsOfGroupV2(groupId, itemsPerPage, currentPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/AdminsV2/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage,
        currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getAllFoundedGroupsForMember(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{id}/Founded/All/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getAllGroupsForCurrentMember(clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyGroups/All/{?clanonly,populatefriends}", {
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getAllGroupsForMember(membershipId, clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{membershipId}/All/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        clanonly: clanOnly,
        populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getAlliedGroups(groupId, currentPage, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Allies/{?currentPage,populatefriends}", {
        groupId: groupId.toString(),
        currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAvailableGroupAvatars() {
    return this._serviceRequest(new Request(
      new URI("/Group/GetAvailableAvatars/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAvailableGroupThemes() {
    return this._serviceRequest(new Request(
      new URI("/Group/GetAvailableThemes/")
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @return {Promise.<Platform.Response>}
   */
  getBannedMembersOfGroup(groupId, currentPage, itemsPerPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Banned/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage,
        currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @return {Promise.<Platform.Response>}
   */
  getBannedMembersOfGroupV2(groupId, currentPage, itemsPerPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/BannedV2/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage,
        currentPage
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getClanAttributeDefinitions() {
    return this._serviceRequest(new Request(
      new URI("/Group/GetClanAttributeDefinitions/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDeletedGroupsForCurrentMember() {
    return this._serviceRequest(new Request(
      new URI("/Group/MyGroups/Deleted/")
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getFoundedGroupsForMember(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{membershipId}/Founded/{currentPage}/{?clanonly,populatefriends}", {
        membershipId: params.membershipId.toString(),
        currentPage: params.currentPage,
        clanonly: params.clanOnly,
        populatefriends: params.populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getGroup(groupId, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {String} groupName
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getGroupByName(groupName, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/Name/{groupName}/{?populatefriends}", {
        groupName,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getGroupsFollowedByGroup(groupId, currentPage, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Following/{currentPage}/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getGroupsFollowingGroup(groupId, currentPage, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/FollowedBy/{currentPage}/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {String} partialTag
   * @return {Promise.<Platform.Response>}
   */
  getGroupTagSuggestions(partialTag) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/GetGroupTagSuggestions/{?partialtag}", {
        partialtag: partialTag
      })
    ));
  }

  /**
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getJoinedGroupsForCurrentMember(clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyGroups/{?clanonly,populatefriends}", {
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {Number} currentPage
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getJoinedGroupsForCurrentMemberV2(currentPage, clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyGroups/V2/{currentPage}/{?clanonly,populatefriends}", {
        currentPage,
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getJoinedGroupsForMember(membershipId, clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{membershipId}/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getJoinedGroupsForMemberV2(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{membershipId}/Joined/{currentPage}/{?clanonly,populatefriends}", {
        membershipId: params.membershipId.toString(),
        currentPage: params.currentPage,
        clanonly: params.clanOnly,
        populatefriends: params.populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getJoinedGroupsForMemberV3(membershipId, currentPage, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{membershipId}/JoinedV3/{currentPage}/{?populatefriends}", {
        membershipId: membershipId.toString(),
        currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {BungieNet.enums.groupMemberType}
   * @param {*} [sort = 0]
   * @param {BungieNet.enums.bungieMembershipType} platformType
   * @return {Promise.<Platform.Response>}
   */
  getMembersOfClan(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/ClanMembers/{?currentPage,memberType,sort,platformType}", {
        groupId: params.groupId.toString(),
        currentPage: params.currentPage,
        memberType: params.memberType,
        sort: params.sort,
        platformType: params.platformType
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @param {BungieNet.enums.groupMemberType} memberType
   * @param {BungieNet.enums.bungieMembershipType} platformType
   * @param {*} sort
   * @return {Promise.<Platform.Response>}
   */
  getMembersOfGroup(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{?itemsPerPage,currentPage,memberType,platformType,sort}", {
        groupId: params.groupId.toString(),
        itemsPerPage: params.itemsPerPage,
        currentPage: params.currentPage,
        memberType: params.memberType,
        platformType: params.platformType,
        sort: params.sort
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @param {BungieNet.enums.groupMemberType} memberType
   * @param {BungieNet.enums.bungieMembershipType} platformType
   * @param {*} sort
   * @return {Promise.<Platform.Response>}
   */
  getMembersOfGroupV2(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/MembersV2/{?itemsPerPage,currentPage,memberType,platformType,sort}", {
        groupId: params.groupId.toString(),
        itemsPerPage: params.itemsPerPage,
        currentPage: params.currentPage,
        memberType: params.memberType,
        platformType: params.platformType,
        sort: params.sort
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @param {BungieNet.enums.groupMemberType} memberType
   * @param {BungieNet.enums.bungieMembershipType} platformType
   * @param {*} sort
   * @param {String} nameSearch
   * @return {Promise.<Platform.Response>}
   */
  getMembersOfGroupV3(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/MembersV3/{?itemsPerPage,currentPage,memberType,platformType,sort,nameSearch}", {
        groupId: params.groupId.toString(),
        itemsPerPage: params.itemsPerPage,
        currentPage: params.currentPage,
        memberType: params.memberType,
        platformType: params.platformType,
        sort: params.sort,
        nameSearch: params.nameSearch
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: [
   *  {
   *    groupdId: "-BigNumber-",
   *    membershipType: 2,
   *    membershipId: "-BigNumber-"
   *  }
   * ]
   */
  getMyClanMemberships() {
    return this._serviceRequest(new Request(
      new URI("/Group/MyClans/")
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @param {Number} currentPage
   * @return {Promise.<Platform.Response>}
   */
  getPendingClanMemberships(groupId, clanMembershipType, currentPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Clan/{clanMembershipType}/Pending/{currentPage}/", {
        groupId: groupId.toString(),
        clanMembershipType,
        currentPage
      })
    ));
  }

  /**
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getPendingGroupsForCurrentMember(populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyPendingGroups/{?populatefriends}", {
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getPendingGroupsForCurrentMemberV2(currentPage, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyPendingGroupsV2/{currentPage}/{?populatefriends}", {
        currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getPendingGroupsForMember(membershipId, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/User/{membershipId}/Pending/{?populatefriends}", {
        membershipId: membershipId.toString(),
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getPendingGroupsForMemberV2(currentPage, populateFriends) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyPendingGroups/V2/{currentPage}/{?populatefriends}", {
        currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getPendingMemberships(groupId, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/Pending/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @return {Promise.<Platform.Response>}
   */
  getPendingMembershipsV2(groupId, currentPage) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/PendingV2/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage
      })
    ));
  }

  /**
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  getRecommendedGroups(populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/Recommended/{?populatefriends}", {
        populatefriends: populateFriends
      }),
      "POST",
      {

      }
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  groupSearch(params, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/Search/{?populatefriends}", {
        populatefriends: populateFriends
      }),
      "POST",
      params
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @param {String} title
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  inviteClanMember(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/InviteToClan/{membershipId}/{clanMembershipType}/", {
        groupId: params.groupId,
        membershipId: params.membershipId.toString(),
        clanMembershipType: params.clanMembershipType
      }),
      "POST",
      {
        title: params.title,
        message: params.message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {String} title
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  inviteGroupMember(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Invite/{membershipId}/", {
        groupId: params.groupId.toString(),
        membershipId: params.membershipId.toString()
      }),
      "POST",
      {
        title: params.title,
        message: params.message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber[]} targetIds
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  inviteManyToJoin(groupId, targetIds, message) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Allies/InviteMany/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        targetIds: targetIds.map(bn => bn.toString()),
        messageContent: {
          message
        }
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} allyGroupId
   * @return {Promise.<Platform.Response>}
   */
  inviteToJoinAlliance(groupId, allyGroupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Allies/Invite/{allyGroupId}/", {
        groupId: groupId.toString(),
        allyGroupId: allyGroupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @param {String} message
   * @return {Promise.<Platform.Response>}
   */
  joinClanForGroup(groupId, clanMembershipType, message) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType
      }),
      "POST",
      {
        message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {BungieNet.enums.bungieMembershipType} clanPlatformType
   * @return {Promise.<Platform.Response>}
   */
  kickMember(groupId, membershipId, clanPlatformType) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Kick/{?clanPlatformType}", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString(),
        clanPlatformType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @return {Promise.<Platform.Response>}
   */
  leaveClanForGroup(groupId, clanMembershipType) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Clans/Leave/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  migrate(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{p1}/Migrate/{p2}/{p3}/", {
        p1,
        p2,
        p3
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} membershipType
   * @return {Promise.<Platform.Response>}
   */
  overrideFounderAdmin(groupId, membershipType) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Admin/FounderOverride/{membershipType}/", {
        groupId: groupId.toString(),
        membershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @return {Promise.<Platform.Response>}
   */
  refreshClanSettingsInDestiny(clanMembershipType) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/MyClans/Refresh/{clanMembershipType}/", {
        clanMembershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  requestGroupMembership(groupId, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/Apply/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  requestGroupMembershipV2(groupId, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/ApplyV2/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} allyGroupId
   * @return {Promise.<Platform.Response>}
   */
  requestToJoinAlliance(groupId, allyGroupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Allies/RequestToJoin/{allyGroupId}/", {
        groupId: groupId.toString(),
        allyGroupId: allyGroupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<Platform.Response>}
   */
  rescindGroupMembership(groupId, populateFriends = false) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/Rescind/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  setGroupAsAlliance(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/SetAsAlliance/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {*} p2
   * @return {Promise.<Platform.Response>}
   */
  setPrivacy(groupId, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Privacy/{p2}/", {
        groupId: groupId.toString(),
        p2
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  unbanMember(groupId, membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Unban/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  undeleteGroup(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Undelete/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  unfollowAllGroupsWithGroup(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/UnfollowAll/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<Platform.Response>}
   */
  unfollowGroupsWithGroup(groupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/UnfollowList/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} followGroupId
   * @return {Promise.<Platform.Response>}
   */
  unfollowGroupWithGroup(groupId, followGroupId) {
    return this._serviceRequest(new Request(
      URI.expand("/Group/{groupId}/Unfollow/{followGroupId}/", {
        groupId: groupId.toString(),
        followGroupId: followGroupId.toString()
      }),
      "POST",
      {

      }
    ));
  }



  /// Ignore Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  flagItem() {
    return this._serviceRequest(new Request(
      new URI("/Ignore/Flag/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getIgnoresForUser() {
    return this._serviceRequest(new Request(
      new URI("/Ignore/MyIgnores/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getIgnoreStatusForPost(postId) {
    return this._serviceRequest(new Request(
      URI.expand("/Ignore/MyIgnores/Posts/{postId}/", {
        postId: postId.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getIgnoreStatusForUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Ignore/MyIgnores/Users/{membershipId}/", {
        membershipId: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getReportContext(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Ignore/ReportContext/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  ignoreItem(params) {
    return this._serviceRequest(new Request(
      new URI("/Ignore/Ignore/"),
      "POST",
      {
        ignoredItemId: params.ignoredItemId,
        ignoredItemType: params.ignoredItemType,
        comment: params.comment,
        reason: params.reason,
        itemContextId: params.itemContextId,
        itemContextType: params.itemContextType,
        ModeratorRequest: params.moderatorRequest
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  myLastReport() {
    return this._serviceRequest(new Request(
      new URI("/Ignore/MyLastReport/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  unignoreItem() {
    return this._serviceRequest(new Request(
      new URI("/Ignore/Unignore/"),
      "POST",
      {

      }
    ));
  }



  /// Game Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPlayerGamesById(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Game/GetPlayerGamesById/{p1}/", {
        p1
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  reachModelSneakerNet(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Game/ReachModelSneakerNet/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }



  /// Admin Service

  /**
   * @param {String} username - search term
   * @return {Promise.<Platform.Response>}
   */
  adminUserSearch(username) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/Search/{?username}", {
        username
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  bulkEditPost() {
    return this._serviceRequest(new Request(
      new URI("/Admin/BulkEditPost/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAdminHistory(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/GlobalHistory/{p1}/{p2}/{?membershipFilter,startdate,enddate}", {
        p1: params.p1,
        p2: params.p2,
        membershipFilter: params.membershipFilter,
        startdate: params.startDate,
        enddate: params.endDate
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAssignedReports() {
    return this._serviceRequest(new Request(
      new URI("/Admin/Assigned/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} [currentPage = 1]
   * @param {Number} [itemsPerPage = 1]
   * @return {Promise.<Platform.Response>}
   */
  getDisciplinedReportsForMember(membershipId, currentPage = 1, itemsPerPage = 1) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/Reports/", {
        id: membershipId.toString()
      }),
      "POST",
      {
        currentPage,
        itemsPerPage
      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {*} p2
   * @return {Promise.<Platform.Response>}
   */
  getRecentDisciplineAndFlagHistoryForMember(membershipId, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/RecentIncludingFlags/{p2}/", {
        id: membershipId.toString(),
        p2
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getResolvedReports() {
    return this._serviceRequest(new Request(
      new URI("/Admin/Reports/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: {
   *  membershipId: "-id-",
   *  isProfileBanned: bool
   *  isForumBanned: bool
   *  isMsgBanned: bool,
   *  isGroupWallBanned: bool
   * }
   */
  getUserBanState(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/GetBanState/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage - 0-based
   * @return {Promise.<Platform.Response>}
   */
  getUserPostHistory(membershipId, currentPage = 0) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/PostHistory/{page}/", {
        id: membershipId.toString(),
        page: currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getUserWebHistoryClientIpHistory(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/GetWebClientIpHistory/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  globallyIgnoreItem() {
    return this._serviceRequest(new Request(
      new URI("/Admin/Ignores/GloballyIgnore/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  overrideBanOnUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/SetBan/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  overrideGlobalIgnore() {
    return this._serviceRequest(new Request(
      new URI("/Admin/Ignores/OverrideGlobalIgnore/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  overrideGroupWallBanOnUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/SetGroupWallBan/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  overrideMsgBanOnUser(membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Admin/Member/{id}/SetMsgBan/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  overturnReport() {
    return this._serviceRequest(new Request(
      new URI("/Admin/Reports/Overturn/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} reportId
   * @param {BigNumber} reason
   * @param {BigNumber} banLength
   * @param {Number} result
   * @param {BigNumber} reportId
   * @return {Promise.<Platform.Response>}
   */
  resolveReport(params) {
    return this._serviceRequest(new Request(
      new URI("/Admin/Assigned/Resolve/"),
      "POST",
      {
        banLength: params.banLength.toString(),
        comments: params.comments,
        reason: params.reason.toString(),
        reportId: params.reportId.toString(),
        result: params.result
      }
    ));
  }



  /// Token Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  applyOfferToCurrentDestinyMembership(p1, p2) {
    return this._serviceRequest(new Request(
      URI.expand("/Tokens/ApplyOfferToCurrentDestinyMembership/{p1}/{p2}/", {
        p1,
        p2
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  breakBond() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/RAF/BreakBond/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  claimAndApplyOnToken(tokenType, redeemCode) {
    return this._serviceRequest(new Request(
      URI.expand("/Tokens/ClaimAndApplyToken/{tokenType}/", {
        tokenType
      }),
      "POST",
      {
        redeemCode
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  claimToken(redeemCode) {
    return this._serviceRequest(new Request(
      new URI("/Tokens/Claim/"),
      "POST",
      {
        redeemCode
      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  consumeMarketplacePlatformCodeOffer(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/Tokens/ConsumeMarketplacePlatformCodeOffer/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCurrentUserOfferHistory() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/OfferHistory/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: {
   *  IsThrottled: false,
   *  ThrottleExpires: "-iso-date-string",
   *  NumberOfFailedAttemptsToday: 0,
   *  MaximumFailedAttemptsPerDay: 3,
   *  AgeVerificationState: true
   * }
   */
  getCurrentUserThrottleState() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/ThrottleState/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getRAFEligibility() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/RAF/GetEligibility/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  marketplacePlatformCodeOfferHistory() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/MarketplacePlatformCodeOfferHistory/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  rafClaim() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/RAF/Claim/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  rafGenerateReferralCode(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Tokens/RAF/GenerateReferralCode/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  rafGetNewPlayerBondDetails() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/RAF/GetNewPlayerBondDetails/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  rafGetVeteranBondDetails() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/RAF/GetVeteranBondDetails/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  verifyAge() {
    return this._serviceRequest(new Request(
      new URI("/Tokens/VerifyAge/"),
      "POST",
      {

      }
    ));
  }



  /// Destiny Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  buyItem() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/BuyItem/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} itemId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  equipItem(membershipType, itemId, characterId) {
    return this._serviceRequest(new Request(
      new URI("/Destiny/EquipItem/"),
      "POST",
      {
        membershipType,
        itemId: itemId.toString(),
        characterId: characterId.toString()
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {BigNumber[]} itemIds
   * @return {Promise.<Platform.Response>}
   */
  equipItems(membershipType, characterId, itemIds) {
    return this._serviceRequest(new Request(
      new URI("/Destiny/EquipItems/"),
      "POST",
      {
        membershipType,
        characterId: characterId.toString(),
        itemIds: itemIds.map(bn => bn.toString())
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getAccount(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getAccountSummary(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Summary/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getActivityBlob(e) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/GetActivityBlob/{e}/", {
        e
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @param {BungieNet.enums.destinyActivityModeType} [mode = BungieNet.enums.destinyActivityModeType.none]
   * @param {Number} [count = 25] number of results to return
   * @param {Number} [page = 1] 1-based
   * @return {Promise.<Platform.Response>}
   */
  getActivityHistory(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/ActivityHistory/{membershipType}/{destinyMembershipId}/{characterId}/{?mode,count,page}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        characterId: params.characterId.toString(),
        mode: params.mode,
        count: params.count,
        page: params.page
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getAdvisorsForAccount(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Advisors/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getAdvisorsForCharacter(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getAdvisorsForCharacterV2(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/V2/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getAdvisorsForCurrentCharacter(membershipType, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Advisors/", {
        membershipType,
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getAllItemsSummary(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Items/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getAllVendorsForCurrentCharacter(membershipType, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendors/", {
        membershipType,
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType}
   * @return {Promise.<Platform.Response>}
   */
  getBondAdvisors(membershipType) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Advisors/Bonds/", {
        membershipType
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getCharacter(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Complete/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getCharacterActivities(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Activities/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getCharacterInventory(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getCharacterInventorySummary(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/Summary/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getCharacterProgression(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Progression/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getCharacterSummary(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getClanLeaderboards(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/ClanLeaderboards/{p1}/{?modes,statid,maxtop}", {
        p1: params.p1,
        modes: params.modes,
        statid: params.statid,
        maxtop: params.maxtop
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getDestinyAggregateActivityStats(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/AggregateActivityStats/{membershipType}/{destinyMembershipId}/{characterId}/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinyExplorerItems(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Explorer/Items/{?params*}", {
        params
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinyExplorerTalentNodeSteps(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Explorer/TalentNodeSteps/{?params*}", {
        params
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinyLiveTileContentItems() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/LiveTiles/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinyManifest() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Manifest/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getDestinySingleDefinition(definitionType, definitionId, version) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Manifest/{definitionType}/{definitionId}/{?version}", {
        definitionType,
        definitionId,
        version
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getExcellenceBadges(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/GetExcellenceBadges/{membershipType}/{destinyMembershipId}/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getGrimoireByMembership(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Vanguard/Grimoire/{membershipType}/{destinyMembershipId}/{?flavour,single}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId,
        flavour: params.flavour,
        single: params.single
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getGrimoireDefinition() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Vanguard/Grimoire/Definition/")
    ));
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
   * @return {Promise.<Platform.Response>}
   */
  getHistoricalStats(options) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/{mType}/{dMID}/{cId}/{?pType,mds,grps,mstart,mend,dstart,dend}", {
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
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getHistoricalStatsDefinition() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Stats/Definition/")
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BungieNet.enums.destinyStatsGroupType[]} groups
   * @return {Promise.<Platform.Response>}
   */
  getHistoricalStatsForAccount(membershipType, destinyMembershipId, groups) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/Account/{membershipType}/{destinyMembershipId}/{?groups}", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        groups
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @param {BigNumber} itemInstanceId
   * @return {Promise.<Platform.Response>}
   */
  getItemDetail(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/{itemInstanceId}/", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        characterId: params.characterId.toString(),
        itemInstanceId: params.itemInstanceId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getItemReferenceDetail(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{p1}/Account/{p2}/Character/{p3}/ItemReference/{p4}/", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        p4: params.p4
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BungieNet.enums.destinyActivityModeType[]} modes
   * @param {*} statid
   * @param {*} maxtop
   * @return {Promise.<Platform.Response>}
   */
  getLeaderboards(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/Leaderboards/{membershipType}/{destinyMembershipId}/{?modes,statid,maxtop}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        modes: params.modes.join(","),
        statid: params.statid,
        maxtop: params.maxtop
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @param {BungieNet.enums.destinyActivityModeType[]} modes
   * @param {*} statid
   * @param {*} maxtop
   * @return {Promise.<Platform.Response>}
   */
  getLeaderboardsForCharacter(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/Leaderboards/{membershipType}/{destinyMembershipId}/{characterId}/{?modes,statid,maxtop}", {
        membershipType: params.membershipType,
        destinyMembershipId: params.destinyMembershipId.toString(),
        characterId: params.characterId.toString(),
        modes: params.modes.join(","),
        statid: params.statid,
        maxtop: params.maxtop
      })
    ));
  }

  /**
   * @param {BungieNet.enums.destinyActivityModeType[]} modes
   * @param {*} code
   * @return {Promise.<Platform.Response>}
   */
  getLeaderboardsForPsn(modes, code) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/LeaderboardsForPsn/{?modes,code}", {
        modes: modes.join(","),
        code
      })
    ));
  }

  /**
   * @param {BungieNet.eums.membershipType} membershipType
   * @param {String} displayName
   * @param {Boolean} [ignoreCase = false]
   * @return {Promise.<Platform.Response>}
   */
  getMembershipIdByDisplayName(membershipType, displayName, ignoreCase) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Stats/GetMembershipIdByDisplayName/{displayName}/{?ignorecase}", {
        membershipType,
        displayName,
        ignorecase: ignoreCase
      })
    ));
  }

  /**
   * @param {BungieNet.enums.bungieMembershipType} membershipType
   * @param {Boolean} flavour
   * @param {BigNumber} single
   * @return {Promise.<Platform.Response>}
   */
  getMyGrimoire(membershipType, flavour, single) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Vanguard/Grimoire/{membershipType}/{?flavour,single}", {
        membershipType,
        flavour,
        single
      })
    ));
  }

  /**
   * @param {BigNumber} activityInstanceId
   * @return {Promise.<Platform.Response>}
   */
  getPostGameCarnageReport(activityInstanceId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/PostGameCarnageReport/{activityInstanceId}/", {
        activityInstanceId: activityInstanceId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPublicAdvisors() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Advisors/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPublicAdvisorsV2() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Advisors/V2/")
    ));
  }

  /**
   * @param {BigNumber} vendorId
   * @return {Promise.<Platform.Response>}
   */
  getPublicVendor(vendorId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Vendors/{vendorId}/", {
        vendorId: vendorId.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} vendorId
   * @return {Promise.<Platform.Response>}
   */
  getPublicVendorWithMetadata(vendorId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Vendors/{vendorId}/Metadata/", {
        vendorId: vendorId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getPublicXurVendor() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Advisors/Xur/")
    ));
  }

  /**
   * @param {BungieNet.enums.bungieMembershipType} membershipType
   * @param {BigNumber} recordBookHash
   * @return {Promise.<Platform.Response>}
   */
  getRecordBookCompletionStatus(membershipType, recordBookHash) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/RecordBooks/{recordBookHash}/Completition/", {
        membershipType,
        recordBookHash: recordBookHash.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getSpecialEventAdvisors() {
    return this._serviceRequest(new Request(
      new URI("/Destiny/Events/")
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getTriumphs(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Triumphs/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getUniqueWeaponHistory(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/Stats/UniqueWeapons/{membershipType}/{destinyMembershipId}/{characterId}/", {
        membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getVault(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Vault/{?accountId}", {
        membershipType,
        accountId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<Platform.Response>}
   */
  getVaultSummary(membershipType, destinyMembershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Vault/Summary/{?accountId}", {
        membershipType,
        accountId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {BigNumber} vendorId
   * @return {Promise.<Platform.Response>}
   */
  getVendorForCurrentCharacter(membershipType, characterId, vendorId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/", {
        membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {BigNumber} vendorId
   * @return {Promise.<Platform.Response>}
   */
  getVendorForCurrentCharacterWithMetadata(membershipType, characterId, vendorId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Metadata/", {
        membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {BigNumber} vendorId
   * @param {BigNumber} itemId
   * @return {Promise.<Platform.Response>}
   */
  getVendorItemDetailForCurrentUser(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Item/{itemId}/", {
        membershipType: params.membershipType,
        characterId: params.characterId.toString(),
        vendorId: params.vendorId.toString(),
        itemId: params.itemId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {BigNumber} vendorId
   * @param {BigNumber} itemId
   * @return {Promise.<Platform.Response>}
   */
  getVendorItemDetailForCurrentUserWithMetadata(params) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Item/{itemId}/Metadata/", {
        membershipType: params.membershipType,
        characterId: params.characterId.toString(),
        vendorId: params.vendorId.toString(),
        itemId: params.itemId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @return {Promise.<Platform.Response>}
   */
  getVendorSummariesForCurrentCharacter(membershipType, characterId) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendors/Summaries/", {
        membershipType,
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  refundItem(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/{p1}/RefundItem/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {String} displayName
   * @return {Promise.<Platform.Response>}
   */
  searchDestinyPlayer(membershipType, displayName) {
    return this._serviceRequest(new Request(
      URI.expand("/Destiny/SearchDestinyPlayer/{membershipType}/{displayName}/", {
        membershipType,
        displayName
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} itemId
   * @param {BigNumber} characterId
   * @param {Boolean} state - true to lock, false to unlock
   * @return {Promise.<Platform.Response>}
   */
  setItemLockState(params) {
    return this._serviceRequest(new Request(
      new URI("/Destiny/SetLockState/"),
      "POST",
      {
        membershipType: params.membershipType,
        itemId: params.itemId.toString(),
        characterId: params.characterId.toString(),
        state: params.state
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} membershipId
   * @param {BigNumber} characterId
   * @param {BigNumber} itemId
   * @param {Boolean} state - true to track, false to not track
   * @return {Promise.<Platform.Response>}
   */
  setQuestTrackedState(params) {
    return this._serviceRequest(new Request(
      new URI("/Destiny/SetQuestTrackedState/"),
      "POST",
      {
        membershipType: params.membershipType,
        membershipId: params.membershipId.toString(),
        characterId: params.characterId.toString(),
        itemId: params.itemId.toString(),
        state: params.state
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {Number} itemReferenceHash
   * @param {BigNumber} itemId
   * @param {Number} stackSize
   * @param {BigNumber} characterId
   * @param {Boolean} transferToVault
   * @return {Promise.<Platform.Response>}
   */
  transferItem(params) {
    return this._serviceRequest(new Request(
      new URI("/Destiny/TransferItem/"),
      "POST",
      {
        membershipType: params.membershipType.toString(),
        itemReferenceHash: params.itemReferenceHash,
        itemId: params.itemId.toString(),
        stackSize: params.stackSize,
        characterId: params.characterId.toString(),
        transferToVault: params.transferToVault
      }
    ));
  }



  /// Community Content Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  adminSetCommunityLiveMemberBanStatus(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Partnerships/{p1}/{p2}/Ban/{p3}/", {
        p1,
        p2,
        p3
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  adminSetCommunityLiveMemberFeatureStatus(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Partnerships/{p1}/{p2}/Feature/{p3}/", {
        p1,
        p2,
        p3
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  alterApprovalState(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/AlterApprovalState/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  editContent(p1) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Edit/{p1}/", {
        p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAdminCommunityLiveStatuses(p1, p2, name) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Admin/{p1}/{p2}/{?name}", {
        p1,
        p2,
        name
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getApprovalQueue(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Queue/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCommunityContent(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Get/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCommunityFeaturedActivityModes() {
    return this._serviceRequest(new Request(
      new URI("/CommunityContent/Live/ActivityModes/Featured/")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCommunityLiveStatuses(params) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/All/{p1}/{p2}/{p3}/{?modeHash}", {
        p1: params.p1,
        p2: params.p2,
        p3: params.p3,
        modeHash: params.modeHash
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCommunityLiveStatusesForClanmates(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Clan/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCommunityLiveStatusesForFriends(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Friends/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getFeaturedCommunityLiveStatuses(p1, p2, p3) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Features/{p1}/{p2}/{p3}/", {
        p1,
        p2,
        p3
      })
    ));
  }

  /**
   * @param {BungieNet.enums.partnershipType} partnershipType
   * @param {BungieNet.enums.bungieMembershipType} membershipType
   * @param {BigNumber} membershipId
   * @return {Promise.<Platform.Response>}
   */
  getStreamingStatusForMember(partnershipType, membershipType, membershipId) {
    return this._serviceRequest(new Request(
      URI.expand("/CommunityContent/Live/Users/{pType}/{mType}/{mId}/", {
        pType: partnershipType,
        mType: membershipType,
        mId: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  submitContent() {
    return this._serviceRequest(new Request(
      new URI("/CommunityContent/Submit/"),
      "POST",
      {

      }
    ));
  }



  /// Core Service

  /**
   * @return {Promise.<Platform.Response>}
   */
  getAvailableLocales() {
    return this._serviceRequest(new Request(
      new URI("").path("//GetAvailableLocales")
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getCommonSettings() {
    return this._serviceRequest(new Request(
      new URI("").path("//Settings/")
    ));
  }

  /**
   * @param {Boolean} includeStreaming
   * @return {Promise.<Platform.Response>}
   */
  getGlobalAlerts(includeStreaming = true) {
    return this._serviceRequest(new Request(
      new URI("").path(URITemplate.expand("//GlobalAlerts/{?includestreaming}", {
        includestreaming: includeStreaming
      }))
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   */
  getSystemStatus(p1) {
    return this._serviceRequest(new Request(
      new URI("").path(URITemplate.expand("//Status/{p1}/", {
        p1
      }))
    ));
  }

  /**
   * @return {Promise.<Platform.Response>}
   * @example
   * Response: "Hello World"
   */
  helloWorld() {
    return this._serviceRequest(new Request(
      new URI("").path("//HelloWorld/")
    ));
  }

}

/**
 * Header key-name pairs
 * @type {Object}
 */
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
