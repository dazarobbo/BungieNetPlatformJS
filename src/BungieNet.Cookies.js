BungieNet.Cookies = class{

  /**
   * Returns the cookie with the given name
   * @param  {String} name
   * @return {Promise}
   */
  static get(name){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .getMatching(c => c.name === name)
        .then(cookies => {

          if(cookies.length === 0){
            return reject(new BungieNet.Error(
              BungieNet.Error.codes.no_cookie_by_name
            ));
          }

          return resolve(cookies[0]);

        }, reject);
    });
  }

  /**
   * Returns an array of cookies which pass the predicate function
   * @param  {Function} predicate
   * @return {Promise}
   */
  static getMatching(predicate){
    return new Promise((resolve, reject) => {

      try{
        BungieNet.Cookies.provider
          .getAll()
          .then(cookies => resolve(cookies.filter(predicate)));
      }
      catch(ex){
        return reject(new BungieNet.Error(
          BungieNet.Error.codes.no_cookie_provider
        ));
      }

    });
  }

  /**
   * Returns an array of session cookies
   * @return {Promise}
   */
  static getSessionCookies(){
    return BungieNet.Cookies.getMatching(c => c.session);
  }

  /**
   * Returns the value for a given cookie name
   * @param  {String} name name of cookie
   * @return {Promise}
   */
  static getValue(name){
    return new Promise((resolve, reject) => {
      BungieNet.Cookies
        .get(name)
        .then(cookie => resolve(cookie.value), reject)
        .catch(() => reject(void 0));
    });
  }

};

/**
 * Cookie provider interface
 * @type {mixed}
 */
BungieNet.Cookies.provider = null;
