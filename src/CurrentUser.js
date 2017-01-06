import "./Common.js";
import Cookies from "./Cookies.js";

/**
 * BungieNet.CurrentUser
 *
 * Functions specific to the current user or client
 */
export default class CurrentUser {

  /**
   * Returns a bool for whether the user is signed in based on cookie existence
   * @return {Promise.<Boolean>} bool
   */
  static async authenticated() {

    try {
      await Cookies.get("bungleatk");
      return true;
    }
    catch(err) {
      return false;
    }

  }

  /**
   * Whether there is any trace of an existing user
   * @return {Promise.<Boolean>} true if exists
   */
  static async exists() {
    const cookies = await Cookies.getMatching(c => c);
    return cookies.length > 0;
  }

  /**
   * Returns the CSRF token for API requests
   * @return {Promise.<String>} string
   */
  static getCsrfToken() {
    //token is the value of the bungled cookie
    return Cookies.getValue("bungled");
  }

  /**
   * Returns the member id of the current user
   * @return {Promise.<Number>} id
   */
  static async getMembershipId() {
    const cookie = await Cookies.get("bungleme");
    return parseInt(cookie.value, 10);
  }

  /**
   * Returns the set bungie.net theme
   * @return {Promise.<String>} theme
   */
  static getTheme() {
    return Cookies.getValue("bungletheme");
  }

  /**
   * Returns the current user's locale
   * @return {Promise.<String>} resolves with string if successful, otherwise
   * rejected with null
   */
  static async getLocale() {

    const cookie = await Cookies.get("bungleloc");
    const arr = /&?lc=(.+?)(?:$|&)/i.exec(cookie.value);

    if(arr.length >= 1) {
      return arr[1];
    }

    return null;

  }

}
