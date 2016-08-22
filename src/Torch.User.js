/* globals Torch, BungieNet, moment */
Torch.User = class {

  /**
   * Create a user, pass the bungie.net user object as param
   * @param {Object} [o = {}]
   */
  constructor(o = {}) {

    /**
     * @type {Object}
     */
    this._data = o;

    /**
     * @type {Map}
     */
    this._converted = new Map();

    this._convert();

  }

  /**
   * @return {void}
   */
  _convert() {

    this._converted.set(
      "accountAge",
      moment.duration(Date.getTime() - this._data.firstAccess)
    );

    this._converted.set(
      "firstAccess",
      moment(this._data.firstAccess)
    );

    this._converted.set(
      "lastUpdate",
      typeof this._data.lastUpdate !== "undefined" ?
        moment(this._data.lastUpdate) :
        null
    );

    this._converted.set(
      "membershipId",
      new BigNumber(this._data.membershipId.toString())
    );

    this._converted.set(
      "statusDate",
      typeof this._data.statusDate !== "undefined" ?
        moment(this._data.statusDate) :
        null
    );

  }

  /**
   * @type {String}
   */
  get about() {
    return this._data.about;
  }

  /**
   * Duration the user has been a member
   * @type {Duration}
   */
  get accountAge() {
    return this._converted.get("accountAge");
  }

  /**
   * URI for the user's avatar
   * @return {URI}
   */
  avatarLink() {

    let uri = new URI(this._data.profilePicturePath);

    if(uri.is("relative")) {
      uri = BungieNet.base.resource(uri.resource());
    }

    return uri;

  }

  /**
   * @type {Object}
   */
  get context() {
    return this._data.context;
  }

  /**
   * @type {String}
   */
  get displayName() {
    return this._data.displayName;
  }

  /**
   * Date of first access
   * @type {Moment}
   */
  get firstAccess() {
    return this._converted.get("firstAccess");
  }

  /**
   * @type {Number}
   */
  get followerCount() {
    return this._data.followerCount;
  }

  /**
   * @type {Number}
   */
  get followingUserCount() {
    return this._data.followingUserCount;
  }

  /**
   * @type {Boolean}
   */
  get isDeleted() {
    return this._data.isDeleted;
  }

  /**
   * Most recent date the user's profile has changed
   * @return {Moment|null}
   */
  getLastActive() {

    let moments = [
      this.firstAccess,
      this.lastUpdate,
      this.statusDate
    ].map(d => d);

    if(moments.length === 0) {
      return null;
    }
    //else if(moments.length === 1){
    //  return dates[0];
    //}

    return moment.max(moments);

    //return moments.reduce((a, b) => {
    //  return a > b ? a : b;
    //});

  }

  /**
   * @type {Moment|null}
   */
  get lastUpdate() {
    return this._converted.get("lastUpdate");
  }

  /**
   * @type {String}
   */
  get locale() {
    return this._data.locale;
  }

  /**
   * @type {Boolean}
   */
  get localeInheritDefault() {
    return this._data.localeInheritDefault;
  }

  /**
   * @type {BigNumber}
   */
  get membershipId() {
    return this._converted.get("membershipId");
  }

  /**
   * Generate a URI to the user's profile
   * @return {Promise}
   */
  getProfileLink() {
    return new Promise(resolve => {
      BungieNet.getLocaleBase().then(uri => {

        uri
          .segment("Profile")
          .segment(BungieNet.enums.bungieMembershipType.bungie_next.toString())
          .segment(this.membershipId.toString());

        return resolve(uri);

      });
    });
  }

  /**
   * @type {Number}
   */
  get profilePicture() {
    return this._data.profilePicture;
  }

  /**
   * @return {URI}
   */
  getProfilePictureLink() {

    let uri = new URI(this._data.profilePicturePath);

    if(uri.is("relative")) {
      uri = BungieNet.base.resource(uri.resource());
    }

    return uri;

  }

  /**
   * @type {String}
   */
  get profilePicturePath() {
    return this._data.profilePicturePath;
  }

  /**
   * @type {Number}
   */
  get profileTheme() {
    return this._data.profileTheme;
  }

  /**
   * @type {String}
   */
  get profileThemeName() {
    return this._data.profileThemeName;
  }

  /**
   * @return {URI}
   */
  getProfileThemeHeaderLink() {

    return BungieNet
      .base
      .segment("img")
      .segment("UserThemes")
      .segment(this._data.profileThemeName)
      .filename("header.jpg");

  }

  /**
   * @type {String}
   */
  get psnDisplayName() {
    return this._data.psnDisplayName;
  }

  /**
   * @type {Boolean}
   */
  get showActivity() {
    return this._data.showActivity;
  }

  /**
   * @type {Boolean}
   */
  get showGroupMessaging() {
    return this._data.showGroupMessaging;
  }

  /**
   * @type {Moment|null}
   */
  get statusDate() {
    return this._converted.get("statusDate");
  }

  /**
   * @type {String|null}
   */
  get statusText() {
    return this._data.statusText;
  }

  /**
   * @type {String}
   */
  get successMessageFlags() {
    return this._data.successMessageFlags;
  }

  /**
   * @type {String}
   */
  get uniqueName() {
    return this._data.uniqueName;
  }

  /**
   * @type {Number}
   */
  get userTitle() {
    return this._data.userTitle;
  }

  /**
   * @type {String}
   */
  get userTitleDisplay() {
    return this._data.userTitleDisplay;
  }

  /**
   * @type {String}
   */
  get xboxDisplayName() {
    return this._data.xboxDisplayName;
  }

  /**
   * @return {String}
   */
  toString() {
    return `${this.displayName} (${this.uniqueName})`;
  }

};
