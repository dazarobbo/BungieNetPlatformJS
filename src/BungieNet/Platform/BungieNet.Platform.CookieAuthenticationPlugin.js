/* globals BungieNet */
/**
 *
 */
BungieNet.Platform.Plugins.CookieAuthenticationPlugin =
  class extends BungieNet.Platform.Plugin {

    constructor() {
      super();
    }

    frameOnHttpRequest(frame) {
      return BungieNet.CurrentUser.getCsrfToken().then(token => {
        frame.http.useCookies = true;
        frame.http.addHeader("X-CSRF", token);
      });
    }

};
