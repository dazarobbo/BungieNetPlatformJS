import "babel-polyfill";
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
  static async get(name) {
    const cookies = await Cookies.getMatching(c => c.name === name);
    return cookies[0];
  }

  /**
   * Returns an array of cookies which pass the predicate function
   * @param  {Function} predicate return true to include
   * @return {Promise.<Cookie[]>} array
   */
  static async getMatching(predicate) {
    const cookies = await Cookies.provider.getAll();
    return cookies.filter(predicate);
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
  static async getValue(name) {
    const cookie = await Cookies.get(name);
    return cookie.value;
  }

}

/**
 * Cookie provider interface
 * @type {*}
 */
Cookies.provider = null;
