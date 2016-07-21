/**
 * Response from the Bungie.net Platform
 * @type {BungieNet.Platform.Response}
 */
BungieNet.Platform.Response = class{

  /**
   * @param  {Object} o a JSON-decoded HTTP response
   * @return {BungieNet.Platform.Response}
   */
  constructor(o){
    this.errorCode = o.ErrorCode;
    this.errorStatus = o.ErrorStatus;
    this.message = o.Message;
    this.messageData = o.MessageData;
    this.response = o.Response;
    this.throttleSeconds = o.ThrottleSeconds;
  }

  /**
   * Whether this response represents an application error
   * @return {Boolean}
   */
  get isError(){
    return this.errorCode !== BungieNet.enums.platformErrorCodes.success;
  }

};
