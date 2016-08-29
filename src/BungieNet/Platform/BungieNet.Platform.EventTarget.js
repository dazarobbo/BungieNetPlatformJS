/* globals BungieNet */
/**
 * Intermediary event type
 *
 * @param {Array} eventTypes - array of strings of events to handle
 *
 * @example
 * let et = new EventTarget([
 *  "load",
 *  "start"
 *  "stop"
 * ]);
 *
 * let e = new Event("start");
 * e.foo = "bar";
 *
 * et.addEventListener("start", (e) => { console.log(e.foo); }); //bar
 * et.dispatchEvent(e);
 * et.removeEventListener("start", handler);
 *
 */
BungieNet.Platform.EventTarget = class {

  constructor(eventTypes = []) {

    this._listeners = new Map();

    for(let et of eventTypes) {
      this._listeners.set(et.toLowerCase(), new Set());
    }

  }

  /**
   * Attach an event listener to the given type
   * @param {String} type - name of the event to listen for
   * @param {Function} callback - event handler function
   */
  addEventListener(type, callback) {

    type = type.trim().toLowerCase();

    if(!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }

    this._listeners.get(type).add(callback);

  }

  /**
   * Remove an already attached listener for the given type
   * @param {String} type - name of the event to detach
   * @param {Function} callback - event handler to remove
   */
  removeEventListener(type, callback) {

    type = type.trim().toLowerCase();

    if(!this._listeners.has(type)) {
      return;
    }

    this._listeners.get(type).delete(callback);

  }

  /**
   * Dispatches the given event to all event listeners
   * @param {BungieNet.Platform.Event} event - event to dispatch
   */
  dispatchEvent(event) {

    if(!this._listeners.has(event.type)) {
      return;
    }

    for(let cb of this._listeners.get(event.type)) {
      cb.call(this, event);
    }

  }

};
