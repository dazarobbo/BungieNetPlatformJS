"use strict";

import Cookies from "./Cookies.js";

/**
 * BungieNet.CurrentUser
 *
 * Functions specific to the current user or client
 */
export default class CurrentUser {

  /**
   * Returns a bool for whether the user is signed in based on cookie existence
   * @return {Promise.<Boolean>}
   */
  static authenticated() {
    return new Promise(resolve => {

      //if cookie found, resolve as true
      //if it isn't found, resolve as false
      //TODO: does this make sense?
      return Cookies
        .get("bungleatk")
        .then(() => resolve(true), () => resolve(false));

    });
  }

  /**
   * Whether there is any trace of an existing user
   * @return {Promise.<Cookie[]>}
   */
  static exists() {
    return new Promise((resolve, reject) => {
      Cookies
        .getMatching(c => c)
        .then(cookies => {
          return resolve(cookies.length > 0);
        }, reject);
    });
  }

  /**
   * Returns the CSRF token for API requests
   * @return {Promise.<String>}
   */
  static getCsrfToken() {
    //token is the value of the bungled cookie
    return Cookies.getValue("bungled");
  }

  /**
   * Returns the member id of the current user
   * @return {Promise.<Number>}
   */
  static getMembershipId() {
    return new Promise((resolve, reject) => {
      Cookies
        .getValue("bungleme")
        .then(id => resolve(parseInt(id, 10)), reject);
    });
  }

  /**
   * Returns the set bungie.net theme
   * @return {Promise.<String>}
   */
  static getTheme() {
    return cookies.getValue("bungletheme");
  }

  /**
   * Returns the current user's locale
   * @return {Promise.<String>} resolves with string if successful, otherwise
   * rejected with null
   */
  static getLocale() {
    return new Promise((resolve, reject) => {
      Cookies.getValue("bungleloc")
        .then(str => {

            //parse the locale from the cookie
            const arr = /&?lc=(.+?)(?:$|&)/i.exec(str);

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
