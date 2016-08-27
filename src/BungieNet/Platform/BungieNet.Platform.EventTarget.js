/* globals BungieNet */
BungieNet.Platform.EventTarget = class {

  constructor(eventTypes = []) {

    this._listeners = new Map();

    for(let et of eventTypes) {
      this._listeners.set(et.toLowerCase(), new Set());
    }

  }

  addEventListener(type, callback) {

    type = type.trim().toLowerCase();

    if(!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }

    this._listeners.get(type).add(callback);

  }

  removeEventListener(type, callback) {

    type = type.trim().toLowerCase();

    if(!this._listeners.has(type)) {
      return;
    }

    this._listeners.get(type).delete(callback);

  }

  dispatchEvent(event) {

    if(!this._listeners.has(event.type)) {
      return;
    }

    for(let cb of this._listeners.get(event.type)) {
      cb.call(this, event);
    }

  }

};
