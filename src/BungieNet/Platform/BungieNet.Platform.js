/* globals BungieNet */
/**
 * BungieNet.Platform
 *
 * @param {Object} [opts = {}]
 * @param {String} [opts.apiKey = ""] bungie.net API key
 * @param {BungieNet.Platform.authenticationType} [opts.authType = BungieNet.Platform.authenticationType.cookies] - authentication type the platform will use
 * @param {Number} [opts.maxConcurrent = -1] - maximum concurrent requests, default is no limit
 * @param {Boolean} [opts.paused = false] - whether the platform is paused to new requests
 * @param {Number} [opts.respectThrottle = true] - whether to respect bungie.net's throttling
 * @param {Number} [opts.timeout = 5000] - network timeout in milliseconds
 * @param {Boolean} [opts.anonymous = false] - whether the platform should make unidentified requests
 *
 * Notes:
 * (a) platform request workflow is as follows:
 *  1. when an endpoint has been invoked
 *  2. a service request is created
 *  3. the request is passed to a HTTP routine
 *  4. the HTTP routine create a HTTP request
 *  5. the HTTP request is added to a wait queue
 *  6. when appropriate, the HTTP request is dequeued frm the wait queue
 *  7. the HTTP request is added to the active pool
 *  8. the HTTP request is initiated
 *  ...
 *  (i) when the HTTP request finishes
 *  (ii) the response is parsed into a response
 *
 * (b) certain operations/situations will trigger the platform into trying to
 * dequeue from the wait queue. These are:
 * - when the platform detects a request 'done'-ing;
 * - when maxConcurrent is updated;
 * - when the platform is unpaused; and
 * - when respectThrottle is updated.
 *
 * @todo replace userContext with "anonymous" requests
 * @todo implement throttling
 *
 * @example
 * let p = new BungieNet.Platform({
 * 	apiKey: "api-key-here"
 * });
 *
 * p.apiKey = "a-different-key";
 * p.timeout = 10000; //10 seconds
 *
 * p.getCountsForCurrentUser().then(r => {
 * 	//do something
 * }, err => {
 * 	//some error
 * });
 *
 */
BungieNet.Platform = class {

  constructor(opts = {}) {

    /**
     * @type {Set}
     */
    this._activePool = new Set();

    /**
     * @type {Date}
     */
    this._throttleExpiration = new Date();

    /**
     * @type {BungieNet.Platform.Queue}
     */
    this._waitQueue = new BungieNet.Platform.Queue();

    /**
     * @type {Object}
     */
    this._options = {
      apiKey: "",
      authType: BungieNet.Platform.authenticationType.cookies,
      maxConcurrent: -1,
      paused: false,
      respectThrottle: true,
      timeout: 5000,
      userContext: true
    };

    /**
     * @type {BungieNet.Platform.EventTarget}
     */
    this._events = BungieNet.Platform.EventTarget([
      "activeRequest",
      "beforeSend",
      "dequeuedRequest",
      "networkError",
      "platformError",
      "queued",
      "requestDone",
      "requestStateChange",
      "throttled"
    ]);

    //copy any value in opts to this._options
    //only copy matching keys
    //DON'T use hasOwnProperty - opts could be any object
    Object.keys(this._options)
      .filter(x => x in opts)
      .forEach(x => this._options[x] = opts[x]);

  }


  /// Authentication

  /**
   * Applies cookie-based authentication to the request
   * @param {BungieNet.Platform.Request} request
   * @return {Promise.<BungieNet.Platform.Request>}
   */
  _cookieAuthentication(request) {
    return new Promise((resolve, reject) => {
      BungieNet.CurrentUser.getCsrfToken()
        .then(token => {

          request.options.add(http => {
            http.useCookies = true;
            http.addHeader(BungieNet.Platform.headers.csrf, token);
          });

          return resolve(request);

        }, () => {
          return reject(new BungieNet.Error(
            null,
            BungieNet.Error.codes.no_csrf_token
          ));
        });
    });
  }

  /**
   * Applies OAuth-based authentication to the request
   * @param {BungieNet.Platform.Request} request
   * @return {Promise.<BungieNet.Platform.Request>}
   */
  _oauthAuthentication(request) {
    return new Promise(resolve => {

      request.options.add(http => {
        http.addHeader(
          BungieNet.Platform.headers.oauth,
          `Bearer ${this._options.oauthToken}`
        );
      });

      return resolve(request);

    });
  }



  /// Network

  /**
   * Initiates the request and queues it
   * @param {BungieNet.Platform.Request} request
   * @return {Promise.<BungieNet.Platform.Http2>}
   */
  _httpRequest(request) {
    return new Promise((resolve, reject) => {

      let http = new BungieNet.Platform.Http2(request);

      http.timeout = this._options.timeout;

      //add any predefined headers
      for(let {name, value} of request.headers) {
        http.addHeader(name, value);
      }

      //apply any/all http options
      request.options.forEach(func => func(http));

      http.on("update", () => {
        this.__httpUpdate(http);
      });

      http.on("success", () => {
        this.__httpSuccess(http).then(() => {
          return resolve(http);
        });
      });

      http.on("fail", () => {
        this.__httpFail(http).then(() => {
          return reject(http);
        });
      });

      //queue it, try the queue
      this.__queueRequest(http).then(this.__tryRequest);

    });
  }

  /**
   * API-level request method
   * @param  {BungieNet.Platform.Request} request
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  _serviceRequest(request) {
    return new Promise((resolve, reject) => {
      BungieNet.getLocale().then(loc => {

        let promises = [];

        //construct the full path
        //copy any query string params
        //add the locale
        request.uri =
          BungieNet.platformPath
          .segment(request.uri.path())
          .setSegment(request.uri.search(true))
          .addSearch("lc", loc);

        //urijs is smart enough to remove the trailing slash
        //add it back in manually to avoid bungie.net redirects
        if(request.uri.path().endsWith("/")) {
          request.uri = request.uri.path(request.uri.path() + "/");
        }

        //add api key header
        request.options.add(http => {
          http.addHeader(
            BungieNet.Platform.headers.apiKey,
            this._options.apiKey
          );
        });

        //add authentication
        if(!this._options.anonymous) {
          switch(this._options.authType) {

            case BungieNet.Platform.authenticationType.cookies:
              promises.push(this._cookieAuthentication(request));
              break;

            case BungieNet.Platform.authenticationType.oauth:
              promises.push(this._oauthAuthentication(request));
              break;

            default: //superfluous, but just to make it clear...
            case BungieNet.Platform.authenticationType.none:
              //no need to do anything
              break;

          }
        }

        //when ready, do the request
        Promise.all(promises).then(() => {
          this._httpRequest(request).then(({responseText}) => {

            let obj = void 0;

            try {
              obj = JSON.parse(responseText);
            }
            catch(err) {
              return reject(new BungieNet.Error(
                null,
                BungieNet.Error.codes.corrupt_response
              ));
            }

            let response = new BungieNet.Platform.Response(obj);

            this.__onServiceRequestDone(response).then(() => {
              return resolve(response);
            });

          }, reject);
        });

      });
    });
  }



  /// Private HTTP Handlers

  /**
   * Handler for when a HTTP request updates (readystatechange)
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __httpUpdate(http) {
    return new Promise(resolve => {
      return this.__requestStateChange(http).then(resolve);
    });
  }

  /**
   * Handler for when a HTTP request succeeds (HTTP 200)
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __httpSuccess(http) {
    return new Promise(resolve => {
      return this.__httpRequestDone(http).then(resolve);
    });
  }

  /**
   * Handler for when a HTTP request fails (ie. network failure)
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __httpFail(http) {
    return new Promise(resolve => {
      return this.__httpError(http).then(resolve);
    });
  }


  /// Private Handlers

  /**
   * Adds a request to the wait queue
   * @param {BungieNet.Platform.Http2}
   * @return {Promise}
   */
  __queueRequest(http) {
    return new Promise(resolve => {

      this._waitQueue.enqueue(http);

      let ev = new BungieNet.Platform.Event("queued");
      ev.target = this;
      ev.http = http;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  /**
   * Attempts to begin a request, taking any conditiions into account
   * @return {Promise}
   */
  __tryRequest() {
    return new Promise((resolve, reject) => {

      //check if paused
      if(this._options.paused) {
        return reject();
      }

      //check if any waiting requests
      if(this._waitQueue.empty) {
        return reject();
      }

      //check if too many ongoing requests
      if(this._options.maxConcurrent !== -1) {
        if(this._activePool.size >= this._options.maxConcurrent) {
          return reject();
        }
      }

      //check for throttling
      if(this._options.respectThrottle && this.throttled) {
        return this.__throttled().then(reject);
      }

      //try get a request from the queue
      return this.__tryDequeueRequest().then(firstHttp => {

        this.__beforeSend(firstHttp).then(() => {
          this.__setActiveRequest(firstHttp);
          //DON'T RESOLVE HERE!
        });

        return resolve();

      }, reject);

    });
  }

  /**
   * Attempts to dequeue a request from the wait list
   * @return {Promise.<BungieNet.Platform.Http2>}
   */
  __tryDequeueRequest() {
    return new Promise((resolve, reject) => {

      if(this._waitQueue.empty) {
        return reject();
      }

      let firstHttp = this._waitQueue.dequeue();

      let ev = new BungieNet.Platform.Event("dequeuedRequest");
      ev.target = this;
      ev.http = firstHttp;
      this._events.dispatch(ev);

      return resolve(firstHttp);

    });
  }

  /**
   * Places a request into the active pool and starts it
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __setActiveRequest(http) {
    return new Promise(resolve => {

      this._activePool.add(http);
      http.go(); //start the request

      let ev = new BungieNet.Platform.Event("activeRequest");
      ev.target = this;
      ev.http = http;
      this._events.dispatch(ev);

      return resolve(http);

    });
  }

  /**
   * Before the request is sent, call this to dispatch the event
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __beforeSend(http) {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("beforeSend");
      ev.target = this;
      ev.http = http;
      this._events.dispatch(ev);

      return resolve(ev.http);

    });
  }

  /**
   * Updates the instance with throttle information from a response
   * @param {BungieNet.Platform.Response} response
   * @return {Promise}
   */
  __privateThrottled(response) {
    return new Promise(resolve => {

      let d = new Date();
      d.setSecond(d.getSeconds() + response.throttleSeconds);
      this._throttleExpiration = d;

      return resolve(response);

    });
  }

  /**
   * Dispatcher to be called when an attempt to request is made while
   * the platform is throttled
   * @return {Promise}
   */
  __throttled() {
    return new Promise(resolve => {

      //this is event sent to caller, BEFORE a request is made if the instance
      //determines the new request will be throttled
      let ev = new BungieNet.Platform.Event("throttled");
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  /**
   * When the HTTP request is 'done', regardless of success or failure
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __httpRequestDone(http) {
    return new Promise(resolve => {
      this.__requestDone(http).then(resolve);
    });
  }

  /**
   * When the XHR request for whatever reason
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __httpError(http) {
    return new Promise(resolve => {
      this.__onNetworkError(http)
        .then(() => { this.__requestDone(http); })
        .then(resolve);
    });
  }

  /**
   * When this instance returns a valid bungie.net platform response
   * @param {BungieNet.Platform.Response} response
   * @return {Promise}
   */
  __serviceRequestDone(response) {
    return new Promise(resolve => {

      if(response.isError) {
        this.__onPlatformError(response).then(() => {
          switch(response.errorCode) {
            case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded:
            case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded_minutes:
            case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded_seconds:
            case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded_momentarily:
            case BungieNet.enums.platformErrorCodes.per_endpoint_request_throttle_exceeded:

              //update throttle info
              return this.__privateThrottled(response).then(resolve);

          }
        });
      }

      return resolve(response);

    });
  }

  /**
   * Handler for network errors
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __networkError(http) {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("networkError");
      ev.target = this;
      ev.http = http;
      this._events.dispatch(ev);

      return resolve(ev.http);

    });
  }

  /**
   * Handler for the request state changing
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __requestStateChange(http) {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("requestStateChange");
      ev.target = this;
      ev.http = http;
      this._events.dispatch(ev);

      return resolve(ev.http);

    });
  }

  /**
   * Handler for when the bungie.net platform returns a non-successful response
   * @param {BungieNet.Platform.Response} response
   * @return {Promise}
   */
  __platformError(response) {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("platformError");
      ev.target = this;
      ev.response = response;
      this._events.dispatch(ev);

      return resolve(response);

    });
  }

  /**
   * When a request is 'done', regardless of success or failure
   * @param {BungieNet.Platform.Http2} http
   * @return {Promise}
   */
  __requestDone(http) {
    return new Promise(resolve => {

      this._activePool.delete(http);

      let ev = new BungieNet.Platform.Event("requestDone");
      ev.target = this;
      ev.http = http;
      this._events.dispatch(ev);

      //DON'T RESOLVE ON THIS
      this.__tryRequest();

      return resolve(http);

    });
  }



  /// Public



  /// Events

  /**
   * Attach an event listener
   * @param {String} type - event type to listen for
   * @param {Function} func - event callback
   */
  on(type, func) {
    this._events.addEventListener(type, func);
  }

  /**
   * Remove an event listener
   * @param {String} type - event to remove
   * @param {Function} func - handler to remove
   */
  off(type, func) {
    this._events.removeEventListener(type, func);
  }



  /// Platform Options

  /**
   * Number of active requests
   * @return {Number}
   */
  get activeRequests() {
    return this._activePool.size;
  }

  get apiKey() {
    return this._options.apiKey;
  }

  set apiKey(key) {
    this._options.apiKey = key;
  }

  get authType() {
    return this._options.authType;
  }

  set authType(at) {
    this._options.authType = at;
  }

  get maxConcurrent() {
    return this._options.maxConcurrent;
  }

  set maxConcurrent(mc) {
    this._options.maxConcurrent = mc;
    this.__tryRequest();
  }

  get paused() {
    return this._options.paused;
  }

  pause() {
    this._options.paused = true;
  }

  unpause() {
    this._options.unpause = false;
    this.__tryRequest();
  }

  get respectThrottle() {
    return this._options.respectThrottle;
  }

  set respectThrottle(ok) {
    this._options.respectThrottle = ok;
    this.__tryRequest();
  }

  get throttled() {
    return this._throttleExpiration > Date.now();
  }

  get timeout() {
    return this._options.timeout;
  }

  set timeout(timeout) {
    this._options.timeout = timeout;
  }

  get anonymous() {
    return this._options.anonymous;
  }

  set anonymous(ok) {
    this._options.anonymous = ok;
  }

  /**
   * Number of queued requests
   * @return {Number}
   */
  get queuedRequests() {
    return this._waitQueue.length;
  }



  /// Application Service
  applicationSearch() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/App/Search/"),
      "POST",
      {

      }
    ));
  }

  changeApiKeyStatus(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/ChangeApiKeyState/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }

  createApiKey(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/CreateApiKey/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  createApplication() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/App/CreateApplication/"),
      "POST",
      {

      }
    ));
  }

  editApplication(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/EditApplication/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  getAccessTokensFromCode() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/App/GetAccessTokensFromCode/"),
      "POST",
      {

      }
    ));
  }

  getAccessTokensFromRefreshToken() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/App/GetAccessTokensFromRefreshToken/"),
      "POST",
      {

      }
    ));
  }

  getApplication(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/Application/{p1}/", {
        p1: p1
      })
    ));
  }

  getApplicationApiKeys(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/ApplicationApiKeys/{p1}/", {
        p1: p1
      })
    ));
  }

  getAuthorizations(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/Authorizations/{p1}/", {
        p1: p1
      })
    ));
  }

  privateApplicationSearch() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/App/PrivateSearch/"),
      "POST",
      {

      }
    ));
  }

  revokeAuthorization(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/App/RevokeAuthorization/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }



  /// User Service
  createUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/CreateUser/"),
      "POST",
      {

      }
    ));
  }

  editSuccessMessageFlags(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/MessageFlags/Success/Update/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAvailableAvatars() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableAvatars/")
    ));
  }

  getAvailableAvatarsAdmin(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/GetAvailableAvatarsAdmin/{p1}/", {
        p1: p1
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAvailableThemes() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableThemes/")
    ));
  }

  /**
   * @param  {BigNumber} membershipId
   * @param  {BungieNet.enums.membershipType} membershipType
   */
  getBungieAccount(membershipId, membershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/GetBungieAccount/{membershipId}/{membershipType}/", {
          membershipId: membershipId.toString(),
          membershipType: membershipType
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId - bungie.net memberId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getBungieNetUserById(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/GetBungieNetUserById/{membershipId}/", {
        membershipId: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCountsForCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetCounts/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetCredentialTypesForAccount/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetCurrentBungieAccount/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetBungieNetUser/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetMobileAppPairings/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example {@see getMobileAppPairings}
   */
  getMobileAppPairingsUncached() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetMobileAppPairingsUncached/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetNotificationSettings/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetPlatformApiKeysForUser/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example
   * Response: "/ExpireWebAuth.ashx?..."
   */
  getSignOutUrl() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetSignOutUrl/")
    ));
  }

  /**
   * @param {BigNumber} membershipId - bungie.net membership id
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example
   * Response: []
   */
  getUserAliases(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/GetUserAliases/{membershipId}/", {
        membershipId: membershipId.toString()
      })
    ));
  }

  /**
   * @param {Boolean} [excludeBungieNet = false] - exclude bungie.net member id
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example
   * Response: {
   *  -id-as-key-: -membership-type-as-value-,
   *  ...
   * }
   */
  getUserMembershipIds(excludeBungieNet = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/GetMembershipIds/{?excludebungienet}", {
        excludeBungieNet: excludeBungieNet
      })
    ));
  }

  linkOverride() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/LinkOverride/"),
      "POST",
      {

      }
    ));
  }

  registerMobileAppPair() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/RegisterMobileAppPair/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {String} username - query to search for
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example
   * Response: [
   *  { user information },
   *  ...
   * ]
   */
  searchUsers(username) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/SearchUsers/{?q}", {
        q: username
      })
    ));
  }

  /**
   * @param {String} username - search query
   * @param {Number} [page = 1] - 1-based page number
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example {@see searchUsers}
   */
  searchUsersPaged(username, page = 1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/SearchUsersPaged/{searchTerm}/{page}/", {
        searchTerm: username,
        page: page
      })
    ));
  }

  /**
   * @param {String} username - search query
   * @param {Number} [page = 1] 1-based page number
   * @param {*} [p3 = null] UNKNOWN
   * @return {Promise.<BungieNet.Platform.Response>}
   * @example {@see SearchUsersPaged}
   */
  searchUsersPagedV2(username, page = 1, p3 = null) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/SearchUsersPaged/{searchTerm}/{page}/{p3}/", {
        searchTerm: username,
        page: page,
        p3: p3
      })
    ));
  }

  setAcknowledged(ackId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/Acknowledged/{ackId}/", {
        ackId: ackId
      }),
      "POST",
      {

      }
    ));
  }

  unregisterMobileAppPair(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/UnregisterMobileAppPair/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  updateDestinyEmblemAvatar() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/UpdateDestinyEmblemAvatar/"),
      "POST",
      {

      }
    ));
  }

  updateNotificationSetting() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/Notification/Update/"),
      "POST",
      {

      }
    ));
  }

  updateStateInfoForMobileAppPair() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  updateUser(opts) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/UpdateUser/"),
      "POST",
      opts
    ));
  }

  updateUserAdmin(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/User/UpdateUserAdmin/{p1}/", {
        p1: p1
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  createConversation(membersTo, body) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/CreateConversation/"),
      "POST",
      {
        membersToId: membersTo.map(bn => bn.toString()),
        body: body
      }
    ));
  }

  createConversationV2() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/CreateConversationV2/"),
      "POST",
      {

      }
    ));
  }

  getAllianceInvitedToJoinInvitations(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/AllianceInvitations/InvitationsToJoinAnotherGroup/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })
    ));
  }

  getAllianceJoinInvitations(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/AllianceInvitations/RequestsToJoinYourGroup/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })
    ));
  }

  /**
   * @param {BigNumber} conversationId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getConversationById(conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationById/{conversationId}/", {
        conversationId: conversationId.toString()
      })
    ));
  }

  /**
   * @param  {BigNumber} conversationId - conversation id
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getConversationByIdV2(conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationByIdV2/{id}/", {
        id: conversationId.toString()
      })
    ));
  }

  getConversationsV2(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationsV2/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })
    ));
  }

  getConversationsV3(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationsV3/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })
    ));
  }

  getConversationsV4(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationsV4/{p1}/", {
        p1: p1
      })
    ));
  }

  /**
   * @param  {Number} [page = 1]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getConversationsV5(page = 1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationsV5/{page}/", {
        page: page
      })
    ));
  }

  getConversationThreadV2(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationThreadV2/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })
    ));
  }

  /**
   * Get a page of a conversation
   * @param  {BigNumber} id - conversation id
   * @param  {Number} [page = 1] - page to return
   * @param  {BigNumber} [before = (2^63) - 1] - message id filter
   * @param  {BigNumber} [after = 0] - message id filter
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getConversationThreadV3(
    id,
    page = 1,
    after = new BigNumber("0"),
    before = (new BigNumber(2)).pow(63).minus(1)
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand(
        "/Message/GetConversationThreadV3/{id}/{page}/{?after,before}", {
        id: id.toString(),
        page: page,
        after: after.toString(),
        before: before.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getConversationWithMemberId(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationWithMember/{id}/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param  {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getConversationWithMemberIdV2(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationWithMemberV2/{id}/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param  {Number} [page = 1] - 1-based
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupConversations(page = 1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetGroupConversations/{page}/", {
        page: page
      })
    ));
  }

  getInvitationDetails(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/Invitations/{p1}/Details/", {
        p1: p1
      })
    ));
  }

  getTotalConversationCount() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/GetTotalConversationCount/")
    ));
  }

  getUnreadConversationCountV2() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/GetUnreadPrivateConversationCount/")
    ));
  }

  getUnreadConversationCountV3() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/GetTotalConversationCountV3/")
    ));
  }

  getUnreadConversationCountV4() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/GetUnreadConversationCountV4/")
    ));
  }

  getUnreadGroupConversationCount() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/GetUnreadGroupConversationCount/")
    ));
  }

  /**
   * Leave a given conversation by id
   * @param  {BigNumber} conversationId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  leaveConversation(conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/LeaveConversation/{id}/", {
        id: conversationId.toString()
      })
    ));
  }

  moderateGroupWall(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/ModerateGroupWall/{p1}/{p2}/"),
      "POST",
      {
        p1: p1,
        p2: p2
      }
    ));
  }

  reviewAllInvitations(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/Invitations/ReviewAllDirect/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }

  reviewInvitation(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/Invitations/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }),
      "POST",
      {

      }
    ));
  }

  reviewInvitationDirect(invitationId, invitationResponseState) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/Invitations/ReviewDirect/{id}/{state}/", {
        id: invitationId,
        state: invitationResponseState
      }),
      "POST",
      {

      }
    ));
  }

  reviewInvitations(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/Invitations/ReviewListDirect/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  saveMessageV2() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  saveMessageV3(body, conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/SaveMessageV3/"),
      "POST",
      {
        body: body,
        conversationId: conversationId.toString()
      }
    ));
  }

  saveMessageV4() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/SaveMessageV4/"),
      "POST",
      {

      }
    ));
  }

  updateConversationLastViewedTimestamp() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  userIsTyping(conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/UserIsTyping/"),
      "POST",
      {
        conversationId: conversationId.toString()
      }
    ));
  }



  /// Notification Service
  getRealTimeEvents(p1, p2, timeout) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Notification/Events/{p1}/{p2}/{?timeout}", {
        timeout: timeout
      })
    ));
  }

  /**
   * @deprecated
   */
  getRecentNotificationCount() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Notification/GetCount/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getRecentNotifications() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Notification/GetRecent/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  resetNotification() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Notification/Reset/")
    ));
  }



  /// Content Service

  /**
   * @param {BigNumber} careerId
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Careers/{id}/", {
        id: careerId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Content/Careers/")
    ));
  }

  getContentById(p1, p2, head) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/GetContentById/{p1}/{p2}/{?head}", {
        p1: p1,
        p2: p2,
        head: head
      })
    ));
  }

  getContentByTagAndType(p1, p2, p3, head) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/GetContentByTagAndType/{p1}/{p2}/{p3}/{?,head}", {
        p1: p1,
        p2: p2,
        p3: p3,
        head: head
      })
    ));
  }

  getContentType(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/GetContentType/{p1}/", {
        p1: p1
      })
    ));
  }

  getDestinyContent(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Destiny/{p1}/", {
        p1: p1
      })
    ));
  }

  getDestinyContentV2(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Destiny/V2/{p1}/", {
        p1: p1
      })
    ));
  }

  getFeaturedArticle() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Content/Site/Featured/")
    ));
  }

  getHomepageContent(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Homepage/{p1}/", {
        p1: p1
      })
    ));
  }

  getHomepageContentV2() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Homepage/V2/")
    ));
  }

  getJobs(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Jobs/{p1}/", {
        p1: p1
      })
    ));
  }

  getNews(p1, p2, itemsPerPage, currentPage = 1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/News/{p1}/{p2}/{?itemsperpage,currentpage}", {
        p1: p1,
        p2: p2,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPromoWidget() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Content/Site/Destiny/Promo/")
    ));
  }

  getPublications(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Publications/{p1}/", {
        p1: p1
      })
    ));
  }

  /**
   * @param {String} query - search query
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  searchCareers(query) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Careers/Search/{?searchtext}", {
        searchtext: query
      })
    ));
  }

  searchContentByTagAndType(p1, p2, p3, head, currentPage, itemsPerPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/SearchContentByTagAndType/{p1}/{p2}/{p3}/{?head,currentpage,itemsperpage}", {
        p1: p1,
        p2: p2,
        p3: p3,
        head: head,
        currentpage: currentPage,
        itemsperpage: itemsPerPage
      })
    ));
  }

  searchContentEx(p1, head) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/SearchEx/{p1}/{?,head}", {
        p1: p1,
        head: head
      })
    ));
  }

  searchContentWithText(p1, head, cType, tag, currentPage, searchText) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Content/Site/Homepage/{p1}/{?head,ctype,tag,currentpage,searchtext}/", {
        p1: p1,
        head: head,
        ctype: cType,
        tag: tag,
        currentpage: currentPage,
        searchtext: searchText
      }),
      "POST",
      {

      }
    ));
  }



  /// ExternalSocial Service
  getAggregatedSocialFeed(p1, types) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/ExternalSocial/GetAggregatedSocialFeed/{p1}/{?,types}", {
        p1: p1,
        types: types
      })
    ));
  }



  /// Survey Service
  getSurvey() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Survey/GetSurvey/")
    ));
  }



  /// Forum Service
  approveFireteamThread(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/Recruit/Approve/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  changeLockState(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/ChangeLockState/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }

  changePinState(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/ChangePinState/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }

  createContentComment() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  createPost(post) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Forum/CreatePost/"),
      "POST",
      post
    ));
  }

  /**
   * @param {BigNumber} postId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  deletePost(postId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  editPost(postId, post) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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

  getCoreTopicsPaged(p1, p2, p3, p4) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetCoreTopicsPaged/{p1}/{p2}/{p3}/{p4}/", {
        p1: p1,
        p2: p2,
        p3: p3,
        p4: p4
      })
    ));
  }

  getForumTagCountEstimate(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetForumTagCountEstimate/{p1}/", {
        p1: p1
      })
    ));
  }

  getForumTagSuggestions(partialTag) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetForumTagSuggestions/{p1}/{?,partialtag}", {
        partialtag: partialTag
      })
    ));
  }

  /**
   * @param {BigNumber} postId - postId of the post containing the poll
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPoll(postId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/Poll/{postId}/", {
        postId: postId.toString()
      })
    ));
  }

  /**
   * @param {Number} quantity
   * @param {*} tagsSinceDate
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPopularTags(quantity, tagsSinceDate) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetPopularTags/{?quantity,tagsSinceDate}", {
        quantity: quantity,
        tagsSinceDate: tagsSinceDate
      })
    ));
  }

  /**
   * @param {BigNumber} childPostId
   * @param {Boolean} [showBanned = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPostAndParent(childPostId, showBanned = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetPostAndParent/{childPostId}/{?showbanned}", {
        childPostId: childPostId.toString(),
        showbanned: showBanned
      })
    ));
  }

  getPostAndParentAwaitingApproval(childPostId, showBanned) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetPostAndParentAwaitingApproval/{childPostId}/{?,showbanned}", {
        childPostId: childPostId,
        showbanned: showBanned
      })
    ));
  }

  getPostsThreadedPaged(
    parentPostId,
    page,
    pageSize,
    replySize,
    getParentPost,
    rootThreadMode,
    sortMode,
    showBanned
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetPostsThreadedPaged/{parentPostId}/{page}/{pageSize}/{replySize}/{getParentPost}/{rootThreadMode}/{sortMode}/{?showbanned}", {
        parentPostId: parentPostId,
        page: page,
        pageSize: pageSize,
        replySize: replySize,
        getParentPost: getParentPost,
        rootThreadMode: rootThreadMode,
        sortMode: sortMode,
        showbanned: showBanned
      })
    ));
  }

  getPostsThreadedPagedFromChild(
    childPostId,
    page,
    pageSize,
    replySize,
    rootThreadMode,
    sortMode,
    showBanned
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetPostsThreadedPagedFromChild/{childPostId}/{page}/{pageSize}/{replySize}/{rootThreadMode}/{sortMode}/{?showbanned}", {
        childPostId: childPostId,
        page: page,
        pageSize: pageSize,
        replySize: replySize,
        rootThreadMode: rootThreadMode,
        sortMode: sortMode,
        showbanned: showBanned
      })
    ));
  }

  getRecruitmentThreadSummaries() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Forum/Recruit/Summaries/"),
      "POST",
      {

      }
    ));
  }

  getTopicForContent(contentId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetTopicForContent/{contentId}/", {
        contentId: contentId
      })
    ));
  }

  getTopicsPaged(
    page,
    pageSize,
    group,
    sort,
    quickDate,
    categoryFilter,
    tagString
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/GetTopicsPaged/{page}/{pageSize}/{group}/{sort}/{quickDate}/{categoryFilter}/{?tagstring}", {
        page: page,
        pageSize: pageSize,
        group: group,
        sort: sort,
        quickDate: quickDate,
        categoryFilter: categoryFilter,
        tagstring: tagString
      })
    ));
  }

  /**
   * @param {BigNumber} postId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  joinFireteamThread(postId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  kickBanFireteamApplicant(postId, membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  leaveFireteamThread(postId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  markReplyAsAnswer(answerPostId, questionTopicId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  moderateGroupPost(
    postId,
    moderatedItemId,
    reason = 1,
    comments = "group post ban",
    moderatedItemType = BungieNet.enums.affectedItemType.post,
    requestedPunishment = BungieNet.enums.requestedPunishment.ban
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/Post/{postId}/GroupModerate/", {
        postId: postId.toString()
      }),
      "POST",
      {
        comments: comments,
        moderatedItemId: moderatedItemId.toString(),
        moderatedItemType: moderatedItemType,
        reason: reason,
        requestedPunishment: requestedPunishment
      }
    ));
  }

  /**
   *
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  moderatePost(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/Post/{p1}/Moderate/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  moderateTag(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/Tags/{p1}/Moderate/", {
        p1: p1
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  pollVote(pollId, optionIndex) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/Poll/Vote/{pollId}/{index}/", {
        pollId: pollId.toString(),
        optionIndex: optionIndex
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} postId
   * @param {Number} rating - 0 to 100, currently only 0 OR 100
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  ratePost(postId, rating) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/RatePost/{postId}/{rating}/", {
        postId: postId.toString(),
        rating: rating
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} topicId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unmarkReplyAsAnswer(topicId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Forum/UnmarkReplyAsAnswer/{topicId}/", {
        topicId: topicId.toString()
      })
    ));
  }



  /// Activity Service

  /**
   * @param {String} tag - ie. #destiny, hash included
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  followTag(tag) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Tag/Follow/{?tag}", {
        tag: tag
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  followUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{id}/Follow/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  getAggregatedActivitiesForCurrentUser(typeFilter, format) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Aggregation/{?typefilter,format}", {
        typefilter: typeFilter,
        format: format
      })
    ));
  }

  getEntitiesFollowedByCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Following/")
    ));
  }

  getEntitiesFollowedByCurrentUserV2(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Following/V2/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      })
    ));
  }

  getEntitiesFollowedByUser(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Following/", {
        p1: p1
      })
    ));
  }

  getEntitiesFollowedByUserV2(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Following/V2/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })
    ));
  }

  getFollowersOfTag(tag, itemsPerPage, currentPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Tag/Followers/{?tag,itemsperpage,currentpage}", {
        tag: tag,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })
    ));
  }

  getFollowersOfUser(membershipId, itemsPerPage, currentPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{membershipId}/Followers/{?itemsperpage,currentpage}", {
        membershipId: membershipId,
        itemsperpage: itemsPerPage,
        currentpage: currentPage
      })
    ));
  }

  getForumActivitiesForUser(p1, itemsPerPage, currentPage, format) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/{?itemsperpage,currentpage,format}", {
        p1: p1,
        itemsperpage: itemsPerPage,
        currentpage: currentPage,
        format: format
      })
    ));
  }

  getForumActivitiesForUserV2(p1, currentPage, format) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Activities/ForumsV2/{?currentpage,format}", {
        p1: p1,
        currentpage: currentPage,
        format: format
      })
    ));
  }

  getFriends() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Friends/")
    ));
  }

  getFriendsAllNoPresence(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Friends/AllNoPresence/{p1}/", {
        p1: p1
      })
    ));
  }

  getFriendsPaged(membershipType, page) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Friends/{membershipType}/{page}/", {
        membershipType: membershipType,
        page: page
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupsFollowedByCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Following/Groups/")
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupsFollowedByUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{id}/Following/Groups/", {
        id: membershipId.toString()
      })
    ));
  }

  getGroupsFollowedPagedByCurrentUser(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Following/Groups/{p1}/", {
        p1: p1
      })
    ));
  }

  getGroupsFollowedPagedByUser(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Following/Groups/Paged/{p2}/", {
        p1: p1,
        p2: p2
      })
    ));
  }

  getLikeAndShareActivityForUser(p1, itemsPerPage, currentPage, format) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Activities/LikesAndShares/{?itemsperpage,currentpage,format}", {
        p1: p1,
        itemsperpage: itemsPerPage,
        currentpage: currentPage,
        format: format
      })
    ));
  }

  getLikeAndShareActivityForUserV2(p1, currentPage, format) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Activities/LikesAndSharesV2/{?currentpage,format}", {
        p1: p1,
        currentpage: currentPage,
        format: format
      })
    ));
  }

  getLikeShareAndForumActivityForUser(p1, currentPage, format) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/User/{p1}/Activities/LikeShareAndForum/{?currentpage,format}", {
        p1: p1,
        currentpage: currentPage,
        format: format
      })
    ));
  }

  getUsersFollowedByCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Following/Users/")
    ));
  }

  /**
   * @param {String} tag - ie. #destiny, with hash
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unfollowTag(tag) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Activity/Tag/Unfollow/{?tag}", {
        tag: tag
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unfollowUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  approveAllPending(groupId, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/ApproveAll/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  approveGroupMembership(groupId, membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  approveGroupMembershipV2(groupId, membershipId, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/ApproveV2/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {String} message
   * @param {BigNumber[]} membershipIds
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  approvePendingForList(groupId, message, membershipIds) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/ApproveList/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        membershipIds: membershipIds.map(bn => bn.toString()),
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {String} comment
   * @param {BungieNet.enums.moderatorRequestedPunishment} - might not be right enum
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  banMember(groupId, membershipId, comment, length) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Ban/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {
        comment: comment,
        length: length
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} allyGroupId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  breakAlliance(groupId, allyGroupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  breakAlliances(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/BreakAlliances/", {
        groupId: groupId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  createGroup() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  createGroupV2(details) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Group/Create/V2/"),
      "POST",
      details
    ));
  }

  createMinimalGroup(name, about) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  denyAllPending(groupId, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/DenyAll/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  denyGroupMembership(groupId, membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  denyGroupMembershipV2(groupId, membershipId, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/DenyV2/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {String} message
   * @param {BigNumber[]} membershipIds
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  denyPendingForList(groupId, message, membershipIds) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/DenyList/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        message: message,
        membershipIds: membershipIds.map(bn => bn.toString())
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType}
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  diableClanForGroup(groupId, clanMembershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Clans/Disable/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  disbandAlliance(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  editGroup(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  editGroupMembership(groupId, membershipId, groupMembershipType, clanPlatformType = 0) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/SetMembershipType/{groupMembershipType}/{?clanPlatformType}", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString(),
        groupMembershipType: groupMembershipType,
        clanPlatformType: clanPlatformType
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  editGroupV2(groupId, details) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  enableClanForGroup(groupId, clanMembershipType, clanName) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Clans/Enable/{clanMembershipType}/{?clanName}", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType,
        clanName: clanName
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  followGroupsWithGroup(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  followGroupWithGroup(groupId, followGroupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdminsOfGroup(groupId, itemsPerPage, currentPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Admins/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} itemsPerPage
   * @param {Number} currentPage
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdminsOfGroupV2(groupId, itemsPerPage, currentPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/AdminsV2/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAllFoundedGroupsForMember(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/User/{id}/Founded/All/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAllGroupsForCurrentMember(clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAllGroupsForMember(membershipId, clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/User/{membershipId}/All/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        clanonly: clanOnly,
        populateFriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAlliedGroups(groupId, currentPage, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Allies/{?currentPage,populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAvailableGroupAvatars() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Group/GetAvailableAvatars/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAvailableGroupThemes() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Group/GetAvailableThemes/")
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getBannedMembersOfGroup(groupId, currentPage, itemsPerPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Banned/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Number} itemsPerPage
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getBannedMembersOfGroupV2(groupId, currentPage, itemsPerPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/BannedV2/{?itemsPerPage,currentPage}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getClanAttributeDefinitions() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Group/GetClanAttributeDefinitions/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getDeletedGroupsForCurrentMember() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Group/MyGroups/Deleted/")
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getFoundedGroupsForMember(
    membershipId,
    currentPage,
    clanOnly = false,
    populateFriends = false
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/User/{membershipId}/Founded/{currentPage}/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        currentPage: currentPage,
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroup(groupId, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {String} groupName
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupByName(groupName, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/Name/{groupName}/{?populatefriends}", {
        groupName: groupName,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupsFollowedByGroup(groupId, currentPage, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Following/{currentPage}/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupsFollowingGroup(groupId, currentPage, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/FollowedBy/{currentPage}/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {String} partialTag
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGroupTagSuggestions(partialTag) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/GetGroupTagSuggestions/{?partialtag}", {
        partialtag: partialTag
      })
    ));
  }

  /**
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getJoinedGroupsForCurrentMember(clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getJoinedGroupsForCurrentMemberV2(currentPage, clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/MyGroups/V2/{currentPage}/{?clanonly,populatefriends}", {
        currentPage: currentPage,
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Boolean} [clanOnly = false]
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getJoinedGroupsForMember(membershipId, clanOnly = false, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getJoinedGroupsForMemberV2(
    membershipId,
    currentPage,
    clanOnly = false,
    populateFriends = false
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/User/{membershipId}/Joined/{currentPage}/{?clanonly,populatefriends}", {
        membershipId: membershipId.toString(),
        currentPage: currentPage,
        clanonly: clanOnly,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getJoinedGroupsForMemberV3(membershipId, currentPage, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/User/{membershipId}/JoinedV3/{currentPage}/{?populatefriends}", {
        membershipId: membershipId.toString(),
        currentPage: currentPage,
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getMembersOfClan(groupId, currentPage, memberType, sort, platformType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/ClanMembers/{?currentPage,memberType,sort,platformType}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
        memberType: memberType,
        sort: sort,
        platformType: platformType
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getMembersOfGroup(groupId, currentPage, itemsPerPage, memberType, platformType, sort) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/{?itemsPerPage,currentPage,memberType,platformType,sort}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage,
        memberType: memberType,
        platformType: platformType,
        sort: sort
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getMembersOfGroupV2(groupId, currentPage, itemsPerPage, memberType, platformType, sort) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/MembersV2/{?itemsPerPage,currentPage,memberType,platformType,sort}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage,
        memberType: memberType,
        platformType: platformType,
        sort: sort
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getMembersOfGroupV3(
    groupId,
    currentPage,
    itemsPerPage,
    memberType,
    platformType,
    sort,
    nameSearch
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/MembersV3/{?itemsPerPage,currentPage,memberType,platformType,sort,nameSearch}", {
        groupId: groupId.toString(),
        itemsPerPage: itemsPerPage,
        currentPage: currentPage,
        memberType: memberType,
        platformType: platformType,
        sort: sort,
        nameSearch: nameSearch
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Group/MyClans/")
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @param {Number} currentPage
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingClanMemberships(groupId, clanMembershipType, currentPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Clan/{clanMembershipType}/Pending/{currentPage}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType,
        currentPage: currentPage
      })
    ));
  }

  /**
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingGroupsForCurrentMember(populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/MyPendingGroups/{?populatefriends}", {
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingGroupsForCurrentMemberV2(currentPage, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/MyPendingGroupsV2/{currentPage}/{?populatefriends}", {
        currentPage: currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingGroupsForMember(membershipId, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/User/{membershipId}/Pending/{?populatefriends}", {
        membershipId: membershipId.toString(),
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {Number} currentPage
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingGroupsForMemberV2(currentPage, populateFriends) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/MyPendingGroups/V2/{currentPage}/{?populatefriends}", {
        currentPage: currentPage,
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingMemberships(groupId, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/Pending/{?populatefriends}", {
        groupId: groupId.toString(),
        populatefriends: populateFriends
      })
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Number} currentPage
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getPendingMembershipsV2(groupId, currentPage) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/PendingV2/{?populatefriends}", {
        groupId: groupId.toString(),
        currentPage: currentPage,
      })
    ));
  }

  /**
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getRecommendedGroups(populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  groupSearch(params, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  inviteClanMember(groupId, membershipId, clanMembershipType, title, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/InviteToClan/{membershipId}/{clanMembershipType}/", {
        groupId: groupId,
        membershipId: membershipId.toString(),
        clanMembershipType: clanMembershipType
      }),
      "POST",
      {
        title: title,
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {String} title
   * @param {String} message
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  inviteGroupMember(groupId, membershipId, title, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Invite/{membershipId}/", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString()
      }),
      "POST",
      {
        title: title,
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber[]} targetIds
   * @param {String} message
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  inviteManyToJoin(groupId, targetIds, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Allies/InviteMany/", {
        groupId: groupId.toString()
      }),
      "POST",
      {
        targetIds: targetIds.map(bn => bn.toString()),
        messageContent: {
          message: message
        }
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} allyGroupId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  inviteToJoinAlliance(groupId, allyGroupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  joinClanForGroup(groupId, clanMembershipType, message) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType
      }),
      "POST",
      {
        message: message
      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @param {BungieNet.enums.bungieMembershipType} clanPlatformType
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  kickMember(groupId, membershipId, clanPlatformType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Members/{membershipId}/Kick/{?clanPlatformType}", {
        groupId: groupId.toString(),
        membershipId: membershipId.toString(),
        clanPlatformType: clanPlatformType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  leaveClanForGroup(groupId, clanMembershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Clans/Leave/{clanMembershipType}/", {
        groupId: groupId.toString(),
        clanMembershipType: clanMembershipType
      }),
      "POST",
      {

      }
    ));
  }

  migrate(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{p1}/Migrate/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BungieNet.enums.bungieMembershipType} membershipType
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  overrideFounderAdmin(groupId, membershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Admin/FounderOverride/{membershipType}/", {
        groupId: groupId.toString(),
        membershipType: membershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BungieNet.enums.bungieMembershipType} clanMembershipType
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  refreshClanSettingsInDestiny(clanMembershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/MyClans/Refresh/{clanMembershipType}/", {
        clanMembershipType: clanMembershipType
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {Boolean} [populateFriends = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  requestGroupMembership(groupId, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  requestGroupMembershipV2(groupId, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  requestToJoinAlliance(groupId, allyGroupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  rescindGroupMembership(groupId, populateFriends = false) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  setGroupAsAlliance(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  setPrivacy(groupId, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Group/{groupId}/Privacy/{p2}/", {
        groupId: groupId.toString(),
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} groupId
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unbanMember(groupId, membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  undeleteGroup(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unfollowAllGroupsWithGroup(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unfollowGroupsWithGroup(groupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  unfollowGroupWithGroup(groupId, followGroupId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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


  flagItem() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Ignore/Flag/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getIgnoresForUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Ignore/MyIgnores/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getIgnoreStatusForPost(postId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Ignore/MyIgnores/Posts/{postId}/", {
        postId: postId.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getIgnoreStatusForUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Ignore/MyIgnores/Users/{membershipId}/", {
        membershipId: membershipId.toString()
      })
    ));
  }

  getReportContext(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Ignore/ReportContext/{p1}/", {
        p1: p1
      })
    ));
  }

  ignoreItem(
    ignoredItemId,
    ignoredItemType,
    comment,
    reason,
    itemContextId,
    itemContextType,
    moderatorRequest
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Ignore/Ignore/"),
      "POST",
      {
        ignoredItemId: ignoredItemId,
        ignoredItemType: ignoredItemType,
        comment: comment,
        reason: reason,
        itemContextId: itemContextId,
        itemContextType: itemContextType,
        ModeratorRequest: moderatorRequest
      }
    ));
  }

  myLastReport() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Ignore/MyLastReport/")
    ));
  }

  unignoreItem() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Ignore/Unignore/"),
      "POST",
      {

      }
    ));
  }



  /// Game Service
  getPlayerGamesById(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Game/GetPlayerGamesById/{p1}/", {
        p1: p1
      })
    ));
  }

  reachModelSneakerNet(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Game/ReachModelSneakerNet/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }



  /// Admin Service

  /**
   * @param {String} username - search term
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  adminUserSearch(username) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/Search/{?username}", {
        username: username
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  bulkEditPost() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Admin/BulkEditPost/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdminHistory(p1, p2, membershipFilter, startDate, endDate) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/GlobalHistory/{p1}/{p2}/{?membershipFilter,startdate,enddate}", {
        p1: p1,
        p2: p2,
        membershipFilter: membershipFilter,
        startdate: startDate,
        enddate: endDate
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAssignedReports() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getDisciplinedReportsForMember(membershipId, currentPage = 1, itemsPerPage = 1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/Reports/", {
        id: membershipId.toString()
      }),
      "POST",
      {
        currentPage: currentPage,
        itemsPerPage: itemsPerPage
      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {*} p2
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getRecentDisciplineAndFlagHistoryForMember(membershipId, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/RecentIncludingFlags/{p2}/", {
        id: membershipId.toString(),
        p2: p2
      })
    ));
  }

  /**
   *
   */
  getResolvedReports() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Admin/Reports/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/GetBanState/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @param {Number} currentPage - 0-based
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getUserPostHistory(membershipId, currentPage = 0) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/PostHistory/{page}/", {
        id: membershipId.toString(),
        page: currentPage
      })
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getUserWebHistoryClientIpHistory(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/GetWebClientIpHistory/", {
        id: membershipId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  globallyIgnoreItem() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Admin/Ignores/GloballyIgnore/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  overrideBanOnUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/SetBan/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  overrideGlobalIgnore() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Admin/Ignores/OverrideGlobalIgnore/"),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BigNumber} membershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  overrideGroupWallBanOnUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  overrideMsgBanOnUser(membershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Admin/Member/{id}/SetMsgBan/", {
        id: membershipId.toString()
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  overturnReport() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  resolveReport(reportId, reason, banLength, result, comments) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Admin/Assigned/Resolve/"),
      "POST",
      {
        banLength: banLength.toString(),
        comments: comments,
        reason: reason.toString(),
        reportId: reportId.toString(),
        result: result
      }
    ));
  }



  /// Token Service
  applyOfferToCurrentDestinyMembership(p1, p2) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Tokens/ApplyOfferToCurrentDestinyMembership/{p1}/{p2}/", {
        p1: p1,
        p2: p2
      }),
      "POST",
      {

      }
    ));
  }

  breakBond() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/RAF/BreakBond/"),
      "POST",
      {

      }
    ));
  }

  claimAndApplyOnToken(tokenType, redeemCode) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Tokens/ClaimAndApplyToken/{tokenType}/", {
        tokenType: tokenType
      }),
      "POST",
      {
        redeemCode: redeemCode
      }
    ));
  }

  claimToken(redeemCode) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/Claim/"),
      "POST",
      {
        redeemCode: redeemCode
      }
    ));
  }

  consumeMarketplacePlatformCodeOffer(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Tokens/ConsumeMarketplacePlatformCodeOffer/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      }),
      "POST",
      {

      }
    ));
  }

  getCurrentUserOfferHistory() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/OfferHistory/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
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
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/ThrottleState/")
    ));
  }

  getRAFEligibility() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/RAF/GetEligibility/")
    ));
  }

  marketplacePlatformCodeOfferHistory() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/MarketplacePlatformCodeOfferHistory/")
    ));
  }

  rafClaim() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/RAF/Claim/"),
      "POST",
      {

      }
    ));
  }

  rafGenerateReferralCode(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Tokens/RAF/GenerateReferralCode/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  rafGetNewPlayerBondDetails() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/RAF/GetNewPlayerBondDetails/")
    ));
  }

  rafGetVeteranBondDetails() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/RAF/GetVeteranBondDetails/")
    ));
  }

  verifyAge() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Tokens/VerifyAge/"),
      "POST",
      {

      }
    ));
  }



  /// Destiny Service

  buyItem() {
    return this._serviceRequest(new BungieNet.Platform.Request(
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  equipItem(membershipType, itemId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/EquipItem/"),
      "POST",
      {
        membershipType: membershipType,
        itemId: itemId.toString(),
        characterId: characterId.toString()
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {BigNumber[]} itemIds
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  equipItems(membershipType, characterId, itemIds) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/EquipItems/"),
      "POST",
      {
        membershipType: membershipType,
        characterId: characterId.toString(),
        itemIds: itemIds.map(bn => bn.toString())
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAccount(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAccountSummary(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Summary/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  getActivityBlob(e) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/GetActivityBlob/{e}/", {
        e: e
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getActivityHistory(
    membershipType,
    destinyMembershipId,
    characterId,
    mode = BungieNet.enums.destinyActivityModeType.none,
    count = 25,
    page = 1
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/ActivityHistory/{membershipType}/{destinyMembershipId}/{characterId}/{?mode,count,page}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString(),
        mode: mode,
        count: count,
        page: page
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdvisorsForAccount(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Advisors/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdvisorsForCharacter(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdvisorsForCharacterV2(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Advisors/V2/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAdvisorsForCurrentCharacter(membershipType, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Advisors/", {
        membershipType: membershipType,
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAllItemsSummary(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Items/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getAllVendorsForCurrentCharacter(membershipType, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendors/", {
        membershipType: membershipType,
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType}
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getBondAdvisors(membershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Advisors/Bonds/", {
        membershipType: membershipType
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCharacter(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Complete/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCharacterActivities(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Activities/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCharacterInventory(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCharacterInventorySummary(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/Summary/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCharacterProgression(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Progression/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getCharacterSummary(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getClanLeaderboards(p1, modes, statid, maxtop) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/ClanLeaderboards/{p1}/{?modes,statid,maxtop}", {
        p1: p1,
        modes: modes,
        statid: statid,
        maxtop: maxtop
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getDestinyAggregateActivityStats(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/AggregateActivityStats/{membershipType}/{destinyMembershipId}/{characterId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  getDestinyExplorerItems(params) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Explorer/Items/{?params*}", {
        params: params
      })
    ));
  }

  getDestinyExplorerTalentNodeSteps(params) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Explorer/TalentNodeSteps/{?params*}", {
        params: params
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getDestinyLiveTileContentItems() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/LiveTiles/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getDestinyManifest() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Manifest/")
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getDestinySingleDefinition(definitionType, definitionId, version) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Manifest/{definitionType}/{definitionId}/{?version}", {
        definitionType: definitionType,
        definitionId: definitionId,
        version: version
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getExcellenceBadges(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/GetExcellenceBadges/{membershipType}/{destinyMembershipId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  getGrimoireByMembership(membershipType, destinyMembershipId, flavour, single) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Vanguard/Grimoire/{membershipType}/{destinyMembershipId}/{?flavour,single}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId,
        flavour: flavour,
        single: single
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getGrimoireDefinition() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Vanguard/Grimoire/Definition/")
    ));
  }

  getHistoricalStats(
    membershipType,
    destinyMembershipId,
    characterId,
    periodType,
    modes,
    groups,
    monthstart,
    monthend,
    daystart,
    dayend
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/{membershipType}/{destinyMembershipId}/{characterId}/{?periodType,modes,groups,monthstart,monthend,daystart,dayend}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId,
        characterId: characterId,
        periodType: periodType,
        modes: modes,
        groups: groups,
        monthstart,
        monthend,
        daystart,
        dayend
      })
    ));
  }

  /**
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getHistoricalStatsDefinition() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Stats/Definition/")
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BungieNet.enums.destinyStatsGroupType[]} groups
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getHistoricalStatsForAccount(membershipType, destinyMembershipId, groups) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/Account/{membershipType}/{destinyMembershipId}/{?groups}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        groups: groups
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @param {BigNumber} itemInstanceId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getItemDetail(membershipType, destinyMembershipId, characterId, itemInstanceId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Character/{characterId}/Inventory/{itemInstanceId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString(),
        itemInstanceId: itemInstanceId.toString()
      })
    ));
  }

  getItemReferenceDetail(p1, p2, p3, p4) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{p1}/Account/{p2}/Character/{p3}/ItemReference/{p4}/", {
        p1: p1,
        p2: p2,
        p3: p3,
        p4: p4
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BungieNet.enums.destinyActivityModeType[]} modes
   * @param {*} statid
   * @param {*} maxtop
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getLeaderboards(membershipType, destinyMembershipId, modes, statid, maxtop) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/Leaderboards/{membershipType}/{destinyMembershipId}/{?modes,statid,maxtop}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        modes: modes.join(","),
        statid: statid,
        maxtop: maxtop
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getLeaderboardsForCharacter(membershipType, destinyMembershipId, characterId, modes, statid, maxtop) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/Leaderboards/{membershipType}/{destinyMembershipId}/{characterId}/{?modes,statid,maxtop}", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString(),
        modes: modes.join(","),
        statid: statid,
        maxtop: maxtop
      })
    ));
  }

  /**
   * @param {BungieNet.enums.destinyActivityModeType[]} modes
   * @param {*} code
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getLeaderboardsForPsn(modes, code) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/LeaderboardsForPsn/{?modes,code}", {
        modes: modes.join(","),
        code: code
      })
    ));
  }

  /**
   * @param {BungieNet.eums.membershipType} membershipType
   * @param {String} displayName
   * @param {Boolean} [ignoreCase = false]
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getMembershipIdByDisplayName(membershipType, displayName, ignoreCase) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Stats/GetMembershipIdByDisplayName/{displayName}/{?ignorecase}", {
        membershipType: membershipType,
        displayName: displayName,
        ignorecase: ignoreCase
      })
    ));
  }

  getMyGrimoire(membershipType, flavour, single) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Vanguard/Grimoire/{membershipType}/{?flavour,single}", {
        membershipType: membershipType,
        flavour: flavour,
        single: single
      })
    ));
  }

  getPostGameCarnageReport(activityInstanceId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/PostGameCarnageReport/{activityInstanceId}/", {
        activityInstanceId: activityInstanceId
      })
    ));
  }

  getPublicAdvisors() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Advisors/")
    ));
  }

  getPublicAdvisorsV2() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Advisors/V2/")
    ));
  }

  getPublicVendor(vendorId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Vendors/{vendorId}/", {
        vendorId: vendorId
      })
    ));
  }

  getPublicVendorWithMetadata(vendorId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Vendors/{vendorId}/Metadata/", {
        vendorId: vendorId
      })
    ));
  }

  getPublicXurVendor() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Advisors/Xur/")
    ));
  }

  getRecordBookCompletionStatus(membershipType, recordBookHash) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/RecordBooks/{recordBookHash}/Completition/", {
        membershipType: membershipType,
        recordBookHash: recordBookHash
      })
    ));
  }

  getSpecialEventAdvisors() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/Events/")
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getTriumphs(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/Account/{destinyMembershipId}/Triumphs/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getUniqueWeaponHistory(membershipType, destinyMembershipId, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/Stats/UniqueWeapons/{membershipType}/{destinyMembershipId}/{characterId}/", {
        membershipType: membershipType,
        destinyMembershipId: destinyMembershipId.toString(),
        characterId: characterId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVault(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Vault/{?accountId}", {
        membershipType: membershipType,
        accountId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} destinyMembershipId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVaultSummary(membershipType, destinyMembershipId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Vault/Summary/{?accountId}", {
        membershipType: membershipType,
        accountId: destinyMembershipId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {Number} vendorId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVendorForCurrentCharacter(membershipType, characterId, vendorId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {Number} vendorId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVendorForCurrentCharacterWithMetadata(membershipType, characterId, vendorId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Metadata/", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {Number} vendorId
   * @param {BigNumber} itemId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVendorItemDetailForCurrentUser(membershipType, characterId, vendorId, itemId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Item/{itemId}/", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId,
        itemId: itemId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @param {Number} vendorId
   * @param {BigNumber} itemId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVendorItemDetailForCurrentUserWithMetadata(membershipType, characterId, vendorId, itemId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendor/{vendorId}/Item/{itemId}/Metadata/", {
        membershipType: membershipType,
        characterId: characterId.toString(),
        vendorId: vendorId,
        itemId: itemId.toString()
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} characterId
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  getVendorSummariesForCurrentCharacter(membershipType, characterId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{membershipType}/MyAccount/Character/{characterId}/Vendors/Summaries/", {
        membershipType: membershipType,
        characterId: characterId.toString()
      })
    ));
  }

  refundItem(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/{p1}/RefundItem/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {String} displayName
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  searchDestinyPlayer(membershipType, displayName) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Destiny/SearchDestinyPlayer/{membershipType}/{displayName}/", {
        membershipType: membershipType,
        displayName: displayName
      })
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} itemId
   * @param {BigNumber} characterId
   * @param {Boolean} state - true to lock, false to unlock
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  setItemLockState(membershipType, itemId, characterId, state) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/SetLockState/"),
      "POST",
      {
        membershipType: membershipType,
        itemId: itemId.toString(),
        characterId: characterId.toString(),
        state: state
      }
    ));
  }

  /**
   * @param {BungieNet.enums.membershipType} membershipType
   * @param {BigNumber} membershipId
   * @param {BigNumber} characterId
   * @param {BigNumber} itemId
   * @param {Boolean} state - true to track, false to not track
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  setQuestTrackedState(membershipType, membershipId, characterId, itemId, state) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/SetQuestTrackedState/"),
      "POST",
      {
        membershipType: membershipType,
        membershipId: membershipId.toString(),
        characterId: characterId.toString(),
        itemId: itemId.toString(),
        state: state
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
   * @return {Promise.<BungieNet.Platform.Response>}
   */
  transferItem(
    membershipType,
    itemReferenceHash,
    itemId,
    stackSize,
    characterId,
    transferToVault
  ) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Destiny/TransferItem/"),
      "POST",
      {
        membershipType: membershipType.toString(),
        itemReferenceHash: itemReferenceHash,
        itemId: itemId.toString(),
        stackSize: stackSize,
        characterId: characterId.toString(),
        transferToVault: transferToVault
      }
    ));
  }



  /// Community Content Service
  alterApprovalState(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/CommunityContent/AlterApprovalState/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  editContent(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/CommunityContent/Edit/{p1}/", {
        p1: p1
      }),
      "POST",
      {

      }
    ));
  }

  getApprovalQueue(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/CommunityContent/Queue/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })
    ));
  }

  getCommunityContent(p1, p2, p3) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/CommunityContent/Get/{p1}/{p2}/{p3}/", {
        p1: p1,
        p2: p2,
        p3: p3
      })
    ));
  }

  submitContent() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/CommunityContent/Submit/"),
      "POST",
      {

      }
    ));
  }



  /// Core Service
  getAvailableLocales() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("//GetAvailableLocales")
    ));
  }

  getCommonSettings() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("//Settings/")
    ));
  }

  getGlobalAlerts(includeStreaming) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("//GlobalAlerts/{?includestreaming}", {
        includestreaming: includeStreaming
      })
    ));
  }

  getSystemStatus(p1) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("//Status/{p1}/", {
        p1: p1
      })
    ));
  }

  helloWorld() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("//HelloWorld/")
    ));
  }

};

/**
 * Header key-name pairs
 * @type {Object}
 */
BungieNet.Platform.headers = {
  apiKey: "X-API-Key",
  csrf: "X-CSRF",
  oauth: "Authorization"
};

/**
 * Authentication type enum
 * @type {Object}
 */
BungieNet.Platform.authenticationType = {
  none: 0,
  cookies: 1,
  oauth: 2
};
