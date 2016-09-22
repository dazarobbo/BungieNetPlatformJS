/* globals BungieNet */
BungieNet.Platform.PlatformRequest = class {

  /**
   * @param {BungieNet.Platform.Request} request
   */
  constructor(request) {
    this._http = new BungieNet.Plaform.Http2(request);
    this._events = new BungieNet.Platform.EventTarget([

      "beforeSend",

      "httpUpdate",
      "httpError",
      "httpSuccess",
      "httpDone",

      "responseParsed",

      "platformError",
      "platformSuccess",
      "platformDone",

      "error",
      "success"

    ]);
  }

  _bind() {
    this._http.on("update", this._httpUpdate);
    this._http.on("success", this._httpSuccess);
    this._http.on("fail", this._httpFail);
  }

  _beforeSend() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("beforeSend");
      ev.http = this._http;
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();


    });
  }

  _httpUpdate() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpUpdate");
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _httpSuccess() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpSuccess");
      ev.target = this;
      this._events.dispatch(ev);

      this._onHttpSuccess()
        .then(this._onHttpDone)
        .then(resolve);

    });
  }

  _httpFail() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpError");
      ev.target = this;
      this._events.dispatch(ev);

      this._onHttpDone()
        .then(resolve);

    });
  }

  _onHttpDone() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpDone");
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _onHttpSuccess() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpUpdate");
      ev.target = this;
      this._events.dispatch(ev);

      BungieNet.Platform.Response
        .parse(this._http.responseText)
        .then(this._onResponseParsed, this._onResponseCorrupt)
        .then(resolve);

    });
  }

  _onPlatformError() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("platformError");
      ev.target = this;
      this._events.dispatch(ev);

      return this._onPlatformDone()
        .then(this._error)
        .then(resolve);

    });
  }

  _onPlatformSuccess() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("platformSuccess");
      ev.target = this;
      this._events.dispatch(ev);

      return this._onPlatformDone()
        .then(this._success)
        .then(resolve);

    });
  }

  _onPlatformDone() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("platformDone");
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _onResponseParsed(response) {
    return new Promise(resolve => {

      let p = null;
      let ev = new BungieNet.Platform.Event("responseParsed");
      
      ev.target = this;
      this._events.dispatch(ev);

      if(response.isError) {
        p = this._onPlatformError();
      }
      else {
        p = this._onPlatformSuccess();
      }

      return p.then(resolve);

    });
  }

  _onResponseCorrupt() {
    return new Promise(resolve => {

      this._error()
        .then(resolve);

    });
  }

  _error() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("error");
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _success() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("success");
      ev.target = this;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  execute() {
    return new Promise(resolve => {

      this._bind();

      this._beforeSend().then(() => {
        this._http.go();
        return resolve();
      });

    });
  }

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

};
