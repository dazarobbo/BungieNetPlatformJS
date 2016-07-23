/* globals BungieNet: true */
/**
 * BungieNet.CurrentUser
 *
 * Functions specific to the current user or client
 */
BungieNet.CurrentUser = class {

  /**
   * Returns a bool for whether the user is signed in based on cookie existence
   * @return {Promise}
   */
  static authenticated() {
    return new Promise(resolve => {

      //if cookie found, resolve as true
      //if it isn't found, resolve as false
      //TODO: does this make sense?
      return BungieNet.Cookies
        .get("bungleatk")
        .then(() => resolve(true), () => resolve(false));

    });
  }

  /**
   * Whether there is any trace of an existing user
   * @return {Promise}
   */
  static exists() {
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .getMatching(c => c)
        .then(cookies => {
          return resolve(cookies.length > 0);
        }, reject);
    });
  }

  /**
   * Returns the CSRF token for API requests
   * @return {Promise}
   */
  static getCsrfToken() {
    //token is the value of the bungled cookie
    return BungieNet.Cookies.getValue("bungled");
  }

  /**
   * Returns the member id of the current user
   * @return {Promise}
   */
  static getMembershipId() {
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .getValue("bungleme")
        .then(id => resolve(parseInt(id, 10)), reject);
    });
  }

  /**
   * Returns the set bungie.net theme
   * @return {Promise}
   */
  static getTheme() {
    return BungieNet.cookies.getValue("bungletheme");
  }

  /**
   * Returns the current user's locale
   * @return {Promise} resolves with string if successful, otherwise rejected
   * with null
   */
  static getLocale() {
    return new Promise((resolve, reject) => {
      BungieNet.Cookies.getValue("bungleloc")
        .then(str => {

            //parse the locale from the cookie
            let arr = /&?lc=(.+?)(?:$|&)/i.exec(str);

            //if successful, resolve it
            if(arr.length >= 1) {
              return resolve(arr[1]);
            }

            //otherwise reject as unable to find
            return reject(null);

        }, () => reject(null));
    });
  }

};
