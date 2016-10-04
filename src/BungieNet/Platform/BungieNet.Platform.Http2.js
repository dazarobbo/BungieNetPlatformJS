/* globals BungieNet */
/**
 * Simpler XHR superclass
 *
 * Events:
 *  1. "update", for when the request changes in some way
 *  2. "success", for when the request completes properly
 *  3. "fail", for when the request fails
 *  4. "done", for when the request succeeds or fails
 *
 * @param {BungieNet.Platform.Request} [request = null] - request to make
 * @param {Object} [options = {}]
 */
BungieNet.Platform.Http2 = class extends XMLHttpRequest {

  constructor(request = null) {

    super();

    this._request = request;

    /**
     * Events which this class dispatches
     * @type {BungieNet.Platform.EventTarget}
     */
    this._events = new BungieNet.Platform.EventTarget([
      "update",   //when the request changes in some way
      "success",  //when it completes properly
      "fail",     //when it fails
      "done"      //finished, success or fail
    ]);

    //bind XHR events to superclass handlers
    this.onreadystatechange = this.__onreadystatechange;
    this.onerror = this.__onerror;

  }

  /**
   * The inner request
   * @return {BungieNet.Platform.Request}
   */
  get request() {
    return this._request;
  }

  set request(r) {
    this._request = r;
  }

  /**
   * Private event dispatcher for when the request is "done", meaning that it
   * has succeeded or failed
   */
  __ondone() {
    let ev = new BungieNet.Platform.Event("done");
    ev.target = this;
    this._events.dispatch(ev);
  }

  /**
   * Private event dispatcher for when the request fails in some way, ie. at the
   * network level, or some other HTTP error
   */
  __onerror() {

    let ev = new BungieNet.Platform.Event("fail");
    ev.target = this;
    this._events.dispatch(ev);

    this.__ondone();

  }

  /**
   * Private event dispatcher for when the request changes, ie.
   * onreadystatechange
   */
  __onreadystatechange() {

    let ev = new BungieNet.Platform.Event("update");
    ev.target = this;

    this._events.dispatch(ev);

    if(this.readyState === XMLHttpRequest.DONE) {

      if(this.status === 200) {
        this.__onsuccess();
      }
      else {
        this.__onerror();
      }

      this.__ondone();

    }

  }

  /**
   * Private event dispatcher for when the request completes successfully
   */
  __onsuccess() {
    let ev = new BungieNet.Platform.Event("success");
    ev.target = this;
    this._events.dispatch(ev);
  }

  /**
   * Attaches an event listener to the given event type
   * @param {String} type - name of the event to listen for
   * @param {Function} func - event listener
   */
  on(type, func) {
    this._events.addEventListener(type, func);
  }

  /**
   * Removes an event listener
   * @param {String} type - name of the event
   * @param {Function} func - event handler to remove
   */
  off(type, func) {
    this._events.removeEventListener(type, func);
  }

  /**
   * Initiates the request and returns a Promise with resolve attached to the
   * success handler, and reject attached to the fail handler
   * @return {Promise}
   */
  go() {
    return new Promise((resolve, reject) => {

      this.open(this._request.method, this._request.uri.toString(), true);

      if(typeof resolve === "function") {
        this.on("success", resolve);
      }

      if(typeof reject === "function") {
        this.on("fail", reject);
      }

      this.send(this._request.data);

      if(typeof resolve !== "function") {
        return resolve();
      }

    });
  }

};
