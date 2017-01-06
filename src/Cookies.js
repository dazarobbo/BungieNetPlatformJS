import BungieNet from "./BungieNet.js";
import Error from "./Error.js";

/**
 * BungieNet.Cookies
 *
 * Interface to examine/extract bungie.net cookies from a given cookie
 * provider.
 *
 * A cookie provider must implement at least the following methods:
 *
 * [public] getAll( void ) : Promise(array of Cookie)
 * - return all cookies (*.bungie.net only)
 *
 *
 * Cookie must implement at least the following properties:
 *
 * name: string
 * session: bool
 * value: string
 *
 *
 * The cookie provider should be set similar to:
 * 	BungieNet.Cookies.provider = new CustomCookieProvider();
 */
export default class Cookies {

  /**
   * Returns the cookie with the given name
   * @param  {String} name cookie name
   * @return {Promise.<Cookie>} cookie
   */
  static get(name) {
    return new Promise((resolve, reject) => {
      Cookies
        .getMatching(c => c.name === name)
        .then(cookies => {

          if(cookies.length === 0) {
            return reject(new BungieNet.Error(
              null,
              Error.codes.no_cookie_by_name
            ));
          }

          return resolve(cookies[0]);

        }, reject);
    });
  }

  /**
   * Returns an array of cookies which pass the predicate function
   * @param  {Function} predicate return true to include
   * @return {Promise.<Cookie[]>} array
   */
  static getMatching(predicate) {
    return new Promise((resolve, reject) => {

      try {
        Cookies.provider
          .getAll()
          .then(cookies => resolve(cookies.filter(predicate)));
      }
      catch(ex) {
        return reject(new BungieNet.Error(
          null,
          Error.codes.no_cookie_provider
        ));
      }

    });
  }

  /**
   * Returns an array of session cookies
   * @return {Promise.<Cookie[]>} array
   */
  static getSessionCookies() {
    return Cookies.getMatching(c => c.session);
  }

  /**
   * Returns the value for a given cookie name
   * @param  {String} name - name of cookie
   * @return {Promise.<String>} string
   */
  static getValue(name) {
    return new Promise((resolve, reject) => {
      Cookies
        .get(name)
        .then(cookie => resolve(cookie.value), reject);
    });
  }

}

/**
 * Cookie provider interface
 * @type {*}
 */
Cookies.provider = null;