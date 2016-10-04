/* globals BungieNet */
/**
 *
 */
BungieNet.Platform.OAuthAuthenticationPlugin =
  class extends BungieNet.Platform.Plugin {

    constructor(token) {
      this._oauthToken = token;
      super();
    }

    frameOnHttpRequest(frame) {
      frame.http.setRequestHeader(
        "Authorization",
        `Bearer ${this._oauthToken}`);
    }

};
