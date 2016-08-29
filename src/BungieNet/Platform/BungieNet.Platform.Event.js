/* globals BungieNet */
/**
 * Event type to use with EventTarget
 *
 * @param {String} type - name of the event type
 */
BungieNet.Platform.Event = class {

  constructor(type) {
    this._type = type;
  }
  
  get type() {
    return this._type;
  }

};
