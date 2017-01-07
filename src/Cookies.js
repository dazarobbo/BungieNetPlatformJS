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
 * Cookie must implement at least the following properties:
 *
 * name: string
 * session: bool
 * value: string
 *
 */
export default class Cookies {

  /**
   * @param {*} provider - an interface to cookies
   */
  constructor(provider) {
    this.provider = provider;
  }

  /**
   * Returns the cookie with the given name
   * @param  {String} name cookie name
   * @return {Promise.<Cookie>} cookie
   */
  async get(name) {
    const cookies = await this.getMatching(c => c.name === name);
    return cookies[0];
  }

  /**
   * Returns an array of cookies which pass the predicate function
   * @param  {Function} predicate return true to include
   * @return {Promise.<Cookie[]>} array
   */
  async getMatching(predicate) {
    const cookies = await this.provider.getAll();
    return cookies.filter(predicate);
  }

  /**
   * Returns an array of session cookies
   * @return {Promise.<Cookie[]>} array
   */
  getSessionCookies() {
    return this.getMatching(c => c.session);
  }

  /**
   * Returns the value for a given cookie name
   * @param  {String} name - name of cookie
   * @return {Promise.<String>} string
   */
  async getValue(name) {
    const cookie = await this.get(name);
    return cookie.value;
  }

}
