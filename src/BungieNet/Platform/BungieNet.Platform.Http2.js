/* globals BungieNet */
BungieNet.Platform.Http2 = class extends XMLHttpRequest {

  constructor(request, options) {

    this._request = request;
    this._options = options;
    this._events = new BungieNet.Platform.EventTarget([
      "update",   //when the request changes in some way
      "success",  //when it completes properly
      "fail",     //when it fails
      "done"      //finished, success or fail
    ]);

    this.onreadystatechange = this.__onreadystatechange;
    this.onerror = this.__onerror;

  }

  get request() {
    return this._request;
  }

  __ondone() {
    let ev = new BungieNet.Platform.Event("done");
    ev.target = this;
    this._events.dispatch(ev);
  }

  __onerror() {

    let ev = new BungieNet.Platform.Event("fail");
    ev.target = this;
    this._events.dispatch(ev);

    this.__ondone();

  }

  __onreadystatechange() {

    let ev = new BungieNet.Platform.Event("update");
    ev.target = this;

    this._events.dispatch(ev);

    if(this.readyState === XMLHttpRequest.DONE) {

      if(this.status === 200) {
        this.__onsuccess();
      }

      this.__ondone();

    }

  }

  __onsuccess() {
    let ev = new BungieNet.Platform.Event("success");
    ev.target = this;
    this._events.dispatch(ev);
  }

  on(type, func) {
    this._events.addEventListener(type, func);
  }

  off(type, func) {
    this._events.removeEventListener(type, func);
  }

  go() {
    return new Promise((resolve, reject) => {

      this.open(this._request.method, this._request.uri.toString(), true);
      this.send(this._request.data);

      if(typeof resolve === "function") {
        this.on("success", resolve);
      }

      if(typeof reject === "function") {
        this.on("fail", reject);
      }

    });
  }

};
