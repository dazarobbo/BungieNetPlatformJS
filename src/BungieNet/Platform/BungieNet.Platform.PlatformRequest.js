/* globals BungieNet */
BungieNet.Platform.PlatformRequest = class {

  constructor(frame) {
    this._frame = frame;
    this._frame.http = new BungieNet.Plaform.Http2(frame.request);
    this._events = new BungieNet.Platform.EventTarget([

      "httpUpdate",
      "httpError",
      "httpSuccess",
      "httpDone",

      "platformError",
      "platformSuccess",
      "platformDone",

      "error",
      "success"

    ]);
  }

  _bind() {
    this._frame.http.on("update", this._httpUpdate);
    this._frame.http.on("success", this._httpSuccess);
    this._frame.http.on("fail", this._httpFail);
  }

  _httpUpdate() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpUpdate");
      ev.target = this;
      ev.frame = this._frame;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _httpSuccess() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpSuccess");
      ev.target = this;
      ev.frame = this._frame;
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
      ev.frame = this._frame;
      this._events.dispatch(ev);

      this._onHttpDone()
        .then(resolve);

    });
  }

  _onHttpDone() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpDone");
      ev.target = this;
      ev.frame = this._frame;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _onHttpSuccess() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("httpUpdate");
      ev.target = this;
      ev.frame = this._frame;
      this._events.dispatch(ev);

      BungieNet.Platform.Response
        .parse(this._frame.http.responseText)
        .then(this._onResponseParsed, this._onResponseCorrupt)
        .then(resolve);

    });
  }

  _onPlatformError() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("platformError");
      ev.target = this;
      ev.frame = this._frame;
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
      ev.frame = this._frame;
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
      ev.frame = this._frame;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _onResponseParsed(response) {
    return new Promise(resolve => {

      let p = null;

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
      ev.frame = this._frame;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  _success() {
    return new Promise(resolve => {

      let ev = new BungieNet.Platform.Event("success");
      ev.target = this;
      ev.frame = this._frame;
      this._events.dispatch(ev);

      return resolve();

    });
  }

  execute() {
    return new Promise(resolve => {
      this._bind();
      this._frame.http.go();
      return resolve();
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
