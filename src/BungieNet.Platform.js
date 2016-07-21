BungieNet.Platform = class{

  /**
   * Construct a new bungie.net platform instance with options
   *
   * {
   * 	apiKey: string bungie.net API key,
   * 	userContext: bool whether the platform should use cookies,
   * 	timeout: int network timeout in milliseconds,
   * 	beforeSend: function callback with the XHR object as param,
   * 	onStateChange: function callback with XHR object as param
   * }
   *
   * @param  {Object} opts
   * @return {BungieNet.Platform}
   */
  constructor(opts = {}){

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
    Object.keys(this._options)
      .filter(x => opts.hasOwnProperty(x))
      .forEach(x => this._options[x] = opts[x]);

  }

  /**
   * Cancels all current requests
   */
  cancelAll(){
    this._requests.forEach(x => x.abort());
    this._requests = [];
  }

  /**
   * Make a HTTP request
   * @param  {URI} uri
   * @param  {String} method = "GET"
   * @param  {mixed} data = void(0)
   * @return {Promise}
   */
  _httpRequest(uri, method = "GET", data = void 0){
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

        if(xhr.readyState === 4){

          //remove from internal arr
          this.requests = this._requests.filter(x => x !== xhr);

          if(xhr.status === 200){
            return resolve(xhr.responseText);
          }
          else{
            return reject(new BungieNet.Error(
              BungieNet.Error.codes.network_error,
              xhr.status,
              xhr
            ));
          }

        }

      };

      //check if making request as a user and add cookies
      if(this._options.userContext){
        promises.push(
          BungieNet.CurrentUser.getCsrfToken()
            .then(token => {
              xhr.withCredentials = true;
              xhr.setRequestHeader(BungieNet.Platform.headers.csrf, token);
            }, () => {
              return reject(new BungieNet.Error(
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
  _serviceRequest(request){
    return new Promise((resolve, reject) => {
      BungieNet.getLocale().then(loc => {

        let theUri =
          BungieNet.platformPath
          .segment(request.uri.path())
          .setSearch(request.uri.search(true))
          .addSearch("lc", loc);

        if(!theUri.path().endsWith("/")){
          theUri.path(theUri.path() + "/");
        }

        this._httpRequest(
          theUri,
          request.method,
          JSON.stringify(request.data)).then(respText => {

            let obj = void 0;

            //try to parse the response as JSON
            try{
              obj = JSON.parse(respText);
            }
            catch(err){
              return reject(new BungieNet.Error(
                BungieNet.Error.codes.corrupt_response
              ));
            }

            return resolve(new BungieNet.Platform.Response(obj));

          }, reject);

      });
    });
  }

  get key(){
    return this._options.apiKey;
  }

  set key(key){
    this._options.apiKey = key;
  }

  get userContext(){
    return this._options.userContext;
  }

  set userContext(ok){
    this._options.userContext = ok;
  }

  get timeout(){
    return this._options.timeout;
  }

  set timeout(timeout){
    this._options.timeout = timeout;
  }

  //

  /**
   * @return {Promise}
   */
  getUsersFollowed(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/Activity/Following/Users/")
    ));
  }

  /**
   * @param  {Array} membersTo array of memberIDs
   * @param  {String} body
   * @return {Promise}
   */
  createConversation(membersTo, body){
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
  getConversationsV5(page){
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
  getConversationByIdV2(id){
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
  ){

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
  getConversationWithMemberIdV2(mId){
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
  getGroupConversations(page){
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
  leaveConversation(conversationId){
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
  saveMessageV3(body, conversationId){
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
  userIsTyping(conversationId){
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
  getAvailableAvatars(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableAvatars/")
    ));
  }

  /**
   * @return {Promise}
   */
  getAvailableThemes(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetAvailableThemes/")
    ));
  }

  /**
   * @param  {BungieNet.enums.membershipType} membershipType
   * @param  {Number} membershipId
   * @return {Promise}
   */
  getBungieAccount(membershipType, membershipId){
    return this._serviceRequest(new BungieNet.Platform.Request(
      URI.expand(
        "/User/GetBungieAccount/{membershipType}/{membershipId}/", {
          membershipType: membershipType,
          membershipId: membershipId
      })
    ));
  }

  /**
   * @return {Promise}
   */
  getCountsForCurrentUser(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetCounts/")
    ));
  }

  /**
   * @return {Promise}
   */
  getCurrentUser(){
    return this._serviceRequest(new BungieNet.Platform.Request(
      new URI("/User/GetBungieNetUser/")
    ));
  }

  /**
   * Updates the user with the given options
   * @param  {Object} opts
   * @return {Promise}
   */
  updateUser(opts){
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
