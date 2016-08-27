/* globals Torch */
Torch.PrivilegedUser = class {

  constructor(o = {}) {

    /**
     * @type {Object}
     */
    this._data = o;

    this._converted = new Map();

    this._convert();

  }

  _convert() {

    this._converted.set(
      "user",
      new Torch.User(this._data.user)
    );

  }

  /**
   * @return {Boolean}
   */
  get adultMode() {
    return this._data.adultMode;
  }

  /**
   * @return {String}
   */
  get email() {
    return this._data.email;
  }

  /**
   * @return {Number}
   */
  get emailStatus() {
    return this._data.emailStatus;
  }

  /**
   * TODO: convert to BigNumber?
   * @return {String}
   */
  get emailUsage() {
    return this._data.emailUsage;
  }

  /**
   * @return {Boolean}
   */
  get hideDestinyData() {
    return this._data.hideDestinyData;
  }

  /**
   * @return {Boolean}
   */
  get isThemeLight() {
    return this._data.isThemeLight;
  }

  /**
   * @return {Boolean}
   */
  get pmToastsEnabled() {
    return this._data.pmToastsEnabled;
  }

  /**
   * @return {Number}
   */
  get privacy() {
    return this._data.privacy;
  }

  /**
   * @return {String}
   */
  get psnId() {
    return this._data.psnId;
  }

  /**
   * @return {Array<Number>}
   */
  get publicCredentialTypes() {
    return this._data.publicCredentialTypes;
  }

  /**
   * @return {Boolean}
   */
  get showFacebookPublic() {
    return this._data.showFacebookPublic;
  }

  /**
   * @return {Boolean}
   */
  get showGamertagPublic() {
    return this._data.showGamertagPublic;
  }

  /**
   * @return {Boolean}
   */
  get showPsnPublic() {
    return this._data.showPsnPublic;
  }

  /**
   * @return {Torch.User}
   */
  get user() {
    return this._converted.get("user");
  }

  /**
   * @return {Array<Number>}
   */
  get userAcls() {
    return this._data.userAcls;
  }

  /**
   * TODO: convert to BigNumber?
   * @return {String}
   */
  get userResearchStatusFlags() {
    return this._data.userResearchStatusFlags;
  }

  /**
   * @return {String}
   */
  toString() {
    return this.user;
  }

};
