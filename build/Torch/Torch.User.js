"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch, BungieNet, moment */
Torch.User = function () {

  /**
   * Create a user, pass the bungie.net user object as param
   * @param {Object} [o = {}]
   */
  function _class() {
    var o = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, _class);

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


  _createClass(_class, [{
    key: "_convert",
    value: function _convert() {

      this._converted.set("accountAge", moment.duration(Date.getTime() - this._data.firstAccess));

      this._converted.set("firstAccess", moment(this._data.firstAccess));

      this._converted.set("lastUpdate", typeof this._data.lastUpdate !== "undefined" ? moment(this._data.lastUpdate) : null);

      this._converted.set("membershipId", new BigNumber(this._data.membershipId.toString()));

      this._converted.set("statusDate", typeof this._data.statusDate !== "undefined" ? moment(this._data.statusDate) : null);
    }

    /**
     * @type {String}
     */

  }, {
    key: "avatarLink",


    /**
     * URI for the user's avatar
     * @return {URI}
     */
    value: function avatarLink() {

      var uri = new URI(this._data.profilePicturePath);

      if (uri.is("relative")) {
        uri = BungieNet.base.resource(uri.resource());
      }

      return uri;
    }

    /**
     * @type {Object}
     */

  }, {
    key: "getLastActive",


    /**
     * Most recent date the user's profile has changed
     * @return {Moment|null}
     */
    value: function getLastActive() {

      var moments = [this.firstAccess, this.lastUpdate, this.statusDate].map(function (d) {
        return d;
      });

      if (moments.length === 0) {
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

  }, {
    key: "getProfileLink",


    /**
     * Generate a URI to the user's profile
     * @return {Promise}
     */
    value: function getProfileLink() {
      var _this = this;

      return new Promise(function (resolve) {
        BungieNet.getLocaleBase().then(function (uri) {

          uri.segment("Profile").segment(BungieNet.enums.bungieMembershipType.bungie_next.toString()).segment(_this.membershipId.toString());

          return resolve(uri);
        });
      });
    }

    /**
     * @type {Number}
     */

  }, {
    key: "getProfilePictureLink",


    /**
     * @return {URI}
     */
    value: function getProfilePictureLink() {

      var uri = new URI(this._data.profilePicturePath);

      if (uri.is("relative")) {
        uri = BungieNet.base.resource(uri.resource());
      }

      return uri;
    }

    /**
     * @type {String}
     */

  }, {
    key: "getProfileThemeHeaderLink",


    /**
     * @return {URI}
     */
    value: function getProfileThemeHeaderLink() {

      return BungieNet.base.segment("img").segment("UserThemes").segment(this._data.profileThemeName).filename("header.jpg");
    }

    /**
     * @type {String}
     */

  }, {
    key: "toString",


    /**
     * @return {String}
     */
    value: function toString() {
      return this.displayName + " (" + this.uniqueName + ")";
    }
  }, {
    key: "about",
    get: function get() {
      return this._data.about;
    }

    /**
     * Duration the user has been a member
     * @type {Duration}
     */

  }, {
    key: "accountAge",
    get: function get() {
      return this._converted.get("accountAge");
    }
  }, {
    key: "context",
    get: function get() {
      return this._data.context;
    }

    /**
     * @type {String}
     */

  }, {
    key: "displayName",
    get: function get() {
      return this._data.displayName;
    }

    /**
     * Date of first access
     * @type {Moment}
     */

  }, {
    key: "firstAccess",
    get: function get() {
      return this._converted.get("firstAccess");
    }

    /**
     * @type {Number}
     */

  }, {
    key: "followerCount",
    get: function get() {
      return this._data.followerCount;
    }

    /**
     * @type {Number}
     */

  }, {
    key: "followingUserCount",
    get: function get() {
      return this._data.followingUserCount;
    }

    /**
     * @type {Boolean}
     */

  }, {
    key: "isDeleted",
    get: function get() {
      return this._data.isDeleted;
    }
  }, {
    key: "lastUpdate",
    get: function get() {
      return this._converted.get("lastUpdate");
    }

    /**
     * @type {String}
     */

  }, {
    key: "locale",
    get: function get() {
      return this._data.locale;
    }

    /**
     * @type {Boolean}
     */

  }, {
    key: "localeInheritDefault",
    get: function get() {
      return this._data.localeInheritDefault;
    }

    /**
     * @type {BigNumber}
     */

  }, {
    key: "membershipId",
    get: function get() {
      return this._converted.get("membershipId");
    }
  }, {
    key: "profilePicture",
    get: function get() {
      return this._data.profilePicture;
    }
  }, {
    key: "profilePicturePath",
    get: function get() {
      return this._data.profilePicturePath;
    }

    /**
     * @type {Number}
     */

  }, {
    key: "profileTheme",
    get: function get() {
      return this._data.profileTheme;
    }

    /**
     * @type {String}
     */

  }, {
    key: "profileThemeName",
    get: function get() {
      return this._data.profileThemeName;
    }
  }, {
    key: "psnDisplayName",
    get: function get() {
      return this._data.psnDisplayName;
    }

    /**
     * @type {Boolean}
     */

  }, {
    key: "showActivity",
    get: function get() {
      return this._data.showActivity;
    }

    /**
     * @type {Boolean}
     */

  }, {
    key: "showGroupMessaging",
    get: function get() {
      return this._data.showGroupMessaging;
    }

    /**
     * @type {Moment|null}
     */

  }, {
    key: "statusDate",
    get: function get() {
      return this._converted.get("statusDate");
    }

    /**
     * @type {String|null}
     */

  }, {
    key: "statusText",
    get: function get() {
      return this._data.statusText;
    }

    /**
     * @type {String}
     */

  }, {
    key: "successMessageFlags",
    get: function get() {
      return this._data.successMessageFlags;
    }

    /**
     * @type {String}
     */

  }, {
    key: "uniqueName",
    get: function get() {
      return this._data.uniqueName;
    }

    /**
     * @type {Number}
     */

  }, {
    key: "userTitle",
    get: function get() {
      return this._data.userTitle;
    }

    /**
     * @type {String}
     */

  }, {
    key: "userTitleDisplay",
    get: function get() {
      return this._data.userTitleDisplay;
    }

    /**
     * @type {String}
     */

  }, {
    key: "xboxDisplayName",
    get: function get() {
      return this._data.xboxDisplayName;
    }
  }]);

  return _class;
}();
//# sourceMappingURL=Torch.User.js.map