/* globals BungieNet: true */
/* globals ExtendableError: true */
BungieNet.Error = class extends ExtendableError {

  constructor(
      message = "",
      code = BungieNet.Error.codes.unknown,
      data = void 0
    ) {
      super(message);
      this.code = code;
      this.data = data;
  }

};

BungieNet.Error.codes = {

  /**
   * Cookies cannot be found
   * @type {Number}
   */
  no_cookie_by_name: 1,

  /**
   * Network failure
   * @type {Number}
   */
  network_error: 2,

  /**
   * Value required for X-CSRF header not found
   * @type {Number}
   */
  no_csrf_token: 3,

  /**
   * Response from bungie.net could not be parsed as valid JSON
   * @type {Number}
   */
  corrupt_response: 4,

  /**
   * An invalid cookie provider was set or used
   * @type {Number}
   */
  no_cookie_provider: 5,

  /**
   * Generic error
   * @type {Number}
   */
  unknown: 6
  
};
