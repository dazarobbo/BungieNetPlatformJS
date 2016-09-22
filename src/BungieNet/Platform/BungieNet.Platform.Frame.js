/* globals BungieNet */
/**
 * BungieNet.Platform.Frame
 *
 * Instances of this class should be used in the Platform
 */
BungieNet.Platform.Frame = class {

  constructor() {

    this.request = null;
    this.response = null;
    this.http = null;

    this.platformRequest = null;
    this.platformResponse = null;

    this.state = BungieNet.Platform.Frame.state.none;

    this.serviceResolve = null;
    this.serviceReject = null;

  }

  /**
   * Attach an event listener
   * @param {String} type - event type to listen for
   * @param {Function} func - event callback
   */
  on(type, func) {
    this._platformRequest.on(type, func);
  }

  /**
   * Remove an event listener
   * @param {String} type - event to remove
   * @param {Function} func - handler to remove
   */
  off(type, func) {
    this._platformRequest.off(type, func);
  }


};

BungieNet.Platform.Frame.state = {
  none: 0,
  waiting: 1,
  active: 2
};
