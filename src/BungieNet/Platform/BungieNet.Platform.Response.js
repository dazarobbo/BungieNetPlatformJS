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

  /**
   * Whether this response was throttled
   * @return {Boolean}
   */
  get isThrottled() {

    switch(this.errorCode) {
      case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded:
      case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded_minutes:
      case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded_seconds:
      case BungieNet.enums.platformErrorCodes.throttle_limit_exceeded_momentarily:
      case BungieNet.enums.platformErrorCodes.per_endpoint_request_throttle_exceeded:
        return true;
    }

    return false;

  }

};
