/* globals BungieNet: true */
/**
 * BungieNet.Platform
 *
 * @param {Object} opts
 *
 * Create an instance of this class to access the bungie.net API with any of the
 * following options:
 *
 * {
 * 	apiKey: {String} bungie.net API key,
 * 	userContext: {Boolean} whether the platform should use cookies,
 * 	timeout: {Number} network timeout in milliseconds,
 * 	beforeSend: {Function} callback with the XHR object as param,
 * 	onStateChange: {Function} callback with XHR object as param
 * }
 *
 * @example
 * let p = new BungieNet.Platform({
 * 	apiKey: "your-key-here"
 * });
 *
 * p.apiKey = "a-different-key";
 * p.timeout = 10000; //10 seconds
 *
 * p.getCountsForCurrentUser().then(r => {
 * 	//do something
 * }, (err) => {
 * 	//some error
 * });
 *
 */
BungieNet.Platform = class {

  constructor(opts = {}) {

    /**
     * Internal list of XHR requests
     * @type {Array}
     */
    this._requests = [];

    this._options = {
      apiKey: "",
      userContext: true,
      timeout: 5000,
      beforeSend: () => {},
      onStateChange: () => {}
    };

    //copy any value in opts to this._options
    //only copy matching keys
    Object.keys(this._options)
      .filter(x => opts.hasOwnProperty(x))
      .forEach(x => this._options[x] = opts[x]);

  }

  /**
   * Cancel all current requests
   */
  cancelAll() {
    //TODO: if this doesn't trigger onerror, remove each manually
    this._requests.forEach(x => x.abort());
    this._requests = [];
  }

  /**
   * Removes a given XHR from the platform request array
   * @param  {XMLHttpRequest} xhr
   */
  _removeRequest(xhr) {
    this.requests = this._requests.filter(x => x !== xhr);
  }

  /**
   * Make a HTTP request
   * @param  {URI} uri
   * @param  {String} method = "GET"
   * @param  {mixed} data = void(0)
   * @return {Promise}
   */
  _httpRequest(uri, method = "GET", data = void 0) {
    return new Promise((resolve, reject) => {

      let promises = [];

      let xhr = new XMLHttpRequest();
      xhr.open(method, uri.toString(), true);
      xhr.timeout = this._options.timeout;
      xhr.setRequestHeader(
        BungieNet.Platform.headers.apiKey,
        this._options.apiKey);

      //watch for changes
      xhr.onreadystatechange = () => {

        this._options.onStateChange(xhr);

        //when done
        if(xhr.readyState === 4) {

          //remove from array
          this._removeRequest(xhr);

          //validate
          if(xhr.status === 200) {
            return resolve(xhr.responseText);
          }
          else{
            return reject(new BungieNet.Error(
              null,
              BungieNet.Error.codes.network_error,
              xhr
            ));
          }

        }

      };

      //catch misc errors, reject with generic error
      xhr.onerror = () => {
        this._removeRequest(xhr);
        return reject(new BungieNet.Error(
          null,
          BungieNet.Error.codes.network_error,
          xhr
        ));
      };

      //check if making request as a user and add cookies
      if(this._options.userContext) {
        promises.push(
          BungieNet.CurrentUser.getCsrfToken()
            .then(token => {
              xhr.withCredentials = true;
              xhr.setRequestHeader(BungieNet.Platform.headers.csrf, token);
            }, () => {
              return reject(new BungieNet.Error(
                null,
                BungieNet.Error.codes.no_csrf_token
              ));
            })
        );
      }

      this._requests.push(xhr);

      //wait for any promises to resolve then fire
      Promise.all(promises).then(() => {
        this._options.beforeSend(xhr);
        xhr.send(data);
      });

    });
  }

  /**
   * API-level request method
   * @param  {BungieNet.Platform.Request} request
   * @return {Promise}
   */
  _serviceRequest(request) {
    return new Promise((resolve, reject) => {
      BungieNet.getLocale().then(loc => {

        //construct the full path
        //copy any query string params
        //add the locale
        let theUri =
          BungieNet.platformPath
          .segment(request.uri.path())
          .setSearch(request.uri.search(true))
          .addSearch("lc", loc);

        //urijs is smart enough to remove the trailing slash
        //add it back in manually to avoid bungie.net redirects
        if(!theUri.path().endsWith("/")) {
          theUri.path(theUri.path() + "/");
        }

        this._httpRequest(
          theUri,
          request.method,
          JSON.stringify(request.data)).then(respText => {

            let obj = void 0;

            try {
              obj = JSON.parse(respText);
            }
            catch(err) {
              return reject(new BungieNet.Error(
                null,
                BungieNet.Error.codes.corrupt_response
              ));
            }

            return resolve(new BungieNet.Platform.Response(obj));

          }, reject);

      });
    });
  }

  get key() {
    return this._options.apiKey;
  }

  set key(key) {
    this._options.apiKey = key;
  }

  get userContext() {
    return this._options.userContext;
  }

  set userContext(ok) {
    this._options.userContext = ok;
  }

  get timeout() {
    return this._options.timeout;
  }

  set timeout(timeout) {
    this._options.timeout = timeout;
  }

  //

  /**
   * @return {Promise}
   */
  getUsersFollowed() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Following/Users/")
    ));
  }

  /**
   * @param  {Array} membersTo array of memberIDs
   * @param  {String} body
   * @return {Promise}
   */
  createConversation(membersTo, body) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/CreateConversation/"),
      "POST",
      {
        membersToId: membersTo,
        body: body
      }
    ));
  }

  /**
   * @param  {Number} page
   * @return {Promise}
   */
  getConversationsV5(page) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationsv5/{page}/", {
        page: page
      })
    ));
  }

  /**
   * @param  {BigNumber} id
   * @return {Promise}
   */
  getConversationByIdV2(id) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationByIdV2/{id}/", {
        id: id.toString()
      })
    ));
  }

  /**
   * Get a page of a conversation
   * @param  {Number} id  conversation id
   * @param  {Number} page = 1  page to return
   * @param  {BigNumber}  before = (2^63)-1 message id filter
   * @param  {BigNumber}  after = 0 message id filter
   * @return {Promise}
   */
  getConversationThreadV3(
    id,
    page = 1,
    after = new BigNumber("0"),
    before = (new BigNumber(2)).pow(63).minus(1)
  ) {

    let uri = URI.expand(
      "/Message/GetConversationThreadV3/{id}/{page}/", {
      id: id,
      page: page
    });

    uri.addSearch("after", after.toString());
    uri.addSearch("before", before.toString());

    return this._serviceRequest(new BungieNet.Platform.Request(uri));

  }

  /**
   * @param  {Number} mId memberID
   * @return {Promise}
   */
  getConversationWithMemberIdV2(mId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetConversationWithMemberV2/{id}/", {
        id: mId
      })
    ));
  }

  /**
   * @param  {Number} page
   * @return {Promise}
   */
  getGroupConversations(page) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/GetGroupConversations/{page}/", {
        page: page
      })
    ));
  }

  /**
   * Leave a given conversation by id
   * @param  {BigNumber} conversationId
   * @return {Promise}
   */
  leaveConversation(conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand("/Message/LeaveConversation/{id}/", {
        id: conversationId.toString()
      })
    ));
  }

  /**
   * Add a message to a conversation
   * @param  {String} body
   * @param  {BigNumber} conversationId
   * @return {Promise}
   */
  saveMessageV3(body, conversationId) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Message/saveMessageV3/"),
      "POST",
      {
        body: body,
        conversationId: conversationId.toString()
      }
    ));
  }

  /**
   * Signal that the current user is typing a message
   * @todo IF THIS RETURNS AN ERROR IT'S BECAUSE THE ID MUST BE A NUMBER
   * @param  {BigNumber} conversationId
   * @return {Promise}
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

  /**
   * @return {Promise}
   */
  getAvailableAvatars() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableAvatars/")
    ));
  }

  /**
   * @return {Promise}
   */
  getAvailableThemes() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableThemes/")
    ));
  }

  /**
   * @param  {Number} membershipId
   * @param  {BungieNet.enums.membershipType} membershipType
   * @return {Promise}
   */
  getBungieAccount(membershipId, membershipType) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand(
        "/User/GetBungieAccount/{membershipId}/{membershipType}/", {
          membershipId: membershipId,
          membershipType: membershipType
      })
    ));
  }

  /**
   * @return {Promise}
   */
  getCountsForCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetCounts/")
    ));
  }

  /**
   * @return {Promise}
   */
  getCurrentUser() {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetBungieNetUser/")
    ));
  }

  /**
   * Updates the user with the given options
   * @param  {Object} opts
   * @return {Promise}
   */
  updateUser(opts) {
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/UpdateUser/"),
      "POST",
      opts
    ));
  }

};

/**
 * Header key-name pairs
 * @type {Object}
 */
BungieNet.Platform.headers = {
  apiKey: "X-API-Key",
  csrf: "X-CSRF"
};
