import request from "request";
import BungieNet from "./BungieNet.js";

/**
 * Plugin base class for plugins. Each plugin MUST define an update method.
 *
 * void update( String: eventName, args[] )
 */
export default class Plugin {

  /**
   * Dummy function for inheriting classes
   * @param {String} eventName - name of the event being raised
   * @param {*} e - event object
   * @return {undefined}
   */
  static update(eventName, e) {
    throw new Error("update method is undefined in subclass");
  }

}

Plugin.CookieJarMemoryPlugin = class extends Plugin {

  /**
   *
   */
  constructor() {
    super();
    this.jar = request.jar();
  }

  /**
   * @param {String} eventName -
   * @param {Object} e -
   * @return {undefined}
   */
  update(eventName, e) {
    if(eventName === BungieNet.Platform.events.frameBeforeSend) {
      e.target.options.jar = this.jar;
    }
  }

};

Plugin.OAuthPlugin = class extends Plugin {

  /**
   * @param {String} accessToken - oauth access token
   */
  constructor(accessToken) {
    super();
    this.accessToken = accessToken;
  }

  /**
   * @param {String} eventName -
   * @param {Object} e -
   * @return {undefined}
   */
  update(eventName, e) {
    if(eventName === BungieNet.Platform.events.frameBeforeSend) {
      e.target.options.headers.Authorization = `Bearer ${ this.accessToken }`;
    }
  }

};
