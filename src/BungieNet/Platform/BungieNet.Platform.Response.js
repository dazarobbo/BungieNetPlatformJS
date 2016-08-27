/* globals BungieNet: true */
/**
 * BungieNet.Platform.Response
 *
 * Represents an application response from the bungie.net platform. This type
 * should be constructed using an object from bungie.net (ie. JSON).
 *
 * This type complements BungieNet.Platform.Request.
 */
BungieNet.Platform.Response = class {

  /**
   * @param {Object} o
   */
  constructor(o) {
    this.errorCode = o.ErrorCode;
    this.errorStatus = o.ErrorStatus;
    this.message = o.Message;
    this.messageData = o.MessageData;
    this.response = o.Response;
    this.throttleSeconds = o.ThrottleSeconds;
  }

  /**
   * Whether this response represents a platform application error
   * @type {Boolean}
   */
  get isError() {
    return this.errorCode !== BungieNet.enums.platformErrorCodes.success;
  }

};
