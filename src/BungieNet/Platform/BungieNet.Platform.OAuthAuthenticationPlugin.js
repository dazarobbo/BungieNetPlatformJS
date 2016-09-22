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
      frame.http.addHeader("Authorization", `Bearer ${this._oauthToken}`);
    }

};
