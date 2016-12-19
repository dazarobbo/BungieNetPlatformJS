"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* globals Torch, BungieNet, moment */
Torch.Group = function () {
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

  _createClass(_class, [{
    key: "_convert",
    value: function _convert() {

      this._converted.set("banExpireDate", moment(this._data.banExpireDate));

      this._converted.set("conversationId", new BigNumber(this._data.conversationId));

      this._converted.set("creationDate", moment(this._data.creationDate));

      this._converted.set("deletedByMembershipId", new BigNumber(this._data.deletedByMembershipId));

      this._converted.set("deletionDate", moment(this._data.deletionDate));

      this._converted.set("founderMembershipId", new BigNumber(this._data.founderMembershipId));

      this._converted.set("groupId", new BigNumber(this._data.groupId));

      this._converted.set("membershipIdCreated", new BigNumber(this._data.membershipIdCreated));

      this._converted.set("modificationDate", moment(this._data.modificationDate));

      this._converted.set("primaryAlliedGroupId", new BigNumber(this._data.primaryAlliedGroupId));

      this._converted.set("tags", this._data.tags.map(function (m) {
        return new Torch.Tag(m);
      }));
    }

    /**
     * @return {String}
     */

  }, {
    key: "getAvatarLink",


    /**
     * @return {URI}
     */
    value: function getAvatarLink() {

      var uri = new URI(this._data.avatarPath);

      if (uri.is("relative")) {
        uri = BungieNet.base.resource(uri.resource());
      }

      return uri;
    }

    /**
     * @return {Moment|null}
     */

  }, {
    key: "getBannerLink",


    /**
     * @return {URI}
     */
    value: function getBannerLink() {

      var uri = new URI(this._data.bannerPath);

      if (uri.is("relative")) {
        uri = BungieNet.base.resource(uri.resource());
      }

      return uri;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "toString",


    /**
     * @return {String}
     */
    value: function toString() {
      return this.name;
    }
  }, {
    key: "about",
    get: function get() {
      return this._data.about;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "allowChat",
    get: function get() {
      return this._data.allowChat;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "avatarImageIndex",
    get: function get() {
      return this._data.avatarImageIndex;
    }

    /**
     * @return {String}
     */

  }, {
    key: "avatarPath",
    get: function get() {
      return this._data.avatarPath;
    }
  }, {
    key: "banExpireDate",
    get: function get() {
      var d = this._converted.get("banExpireDate");
      return d.isSame("2001-01-01") ? null : d;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "wasBanned",
    get: function get() {
      return this.banExpireDate !== null;
    }

    /**
     * @return {String}
     */

  }, {
    key: "bannerPath",
    get: function get() {
      return this._data.bannerPath;
    }
  }, {
    key: "chatSecurity",
    get: function get() {
      return this._data.chatSecurity;
    }

    /**
     * @return {String}
     */

  }, {
    key: "clanCallsign",
    get: function get() {
      return this._data.clanCallsign;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "clanReviewType",
    get: function get() {
      return this._data.clanReviewType;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "conversationId",
    get: function get() {
      return this._converted.get("conversationId");
    }

    /**
     * @return {Moment}
     */

  }, {
    key: "creationDate",
    get: function get() {
      return this._converted.get("creationDate");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "defaultPublicity",
    get: function get() {
      return this._data.defaultPublicity;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "deletedByMembershipId",
    get: function get() {
      return this._converted.get("deletedByMembershipId");
    }

    /**
     * @return {Moment|null}
     */

  }, {
    key: "deletionDate",
    get: function get() {
      var d = this._converted.get("deletionDate");
      return d.isSame("2001-01-01") ? null : d;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "wasDeleted",
    get: function get() {
      return this.deletionDate !== null;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "enableInvitationMessagingForAdmins",
    get: function get() {
      return this._data.enableInvitationMessagingForAdmins;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "founderMembershipId",
    get: function get() {
      return this._converted.get("founderMembershipId");
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "groupId",
    get: function get() {
      return this._converted.get("groupId");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "groupType",
    get: function get() {
      return this._data.groupType;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "homepage",
    get: function get() {
      return this._data.homepage;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isAllianceOwner",
    get: function get() {
      return this._data.isAllianceOwner;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isDefaultPostAlliance",
    get: function get() {
      return this._data.isDefaultPostAlliance;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isDefaultPostPublic",
    get: function get() {
      return this._data.isDefaultPostPublic;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isDeleted",
    get: function get() {
      return this._data.isDeleted;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isMembershipClosed",
    get: function get() {
      return this._data.isMembershipClosed;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isMembershipReviewed",
    get: function get() {
      return this._data.isMembershipReviewed;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isPublic",
    get: function get() {
      return this._data.isPublic;
    }

    /**
     * @return {Boolean}
     */

  }, {
    key: "isPublicTopicAdminOnly",
    get: function get() {
      return this._data.isPublicTopicAdminOnly;
    }

    /**
     * @return {String}
     */

  }, {
    key: "locale",
    get: function get() {
      return this._data.locale;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "memberCount",
    get: function get() {
      return this._data.memberCount;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "membershipIdCreated",
    get: function get() {
      return this._converted.get("membershipIdCreated");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "membershipOption",
    get: function get() {
      return this._data.membershipOption;
    }

    /**
     * @return {Moment|null}
     */

  }, {
    key: "modificationDate",
    get: function get() {
      var d = this._converted.get("modificationDate");
      return d.isSame("2001-01-01") ? null : d;
    }

    /**
     * @return {String}
     */

  }, {
    key: "motto",
    get: function get() {
      return this._data.motto;
    }

    /**
     * @return {String}
     */

  }, {
    key: "name",
    get: function get() {
      return this._data.name;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "pendingMemberCount",
    get: function get() {
      return this._data.pendingMemberCount;
    }

    /**
     * @return {BigNumber}
     */

  }, {
    key: "primaryAlliedGroupId",
    get: function get() {
      return this._converted.get("primaryAlliedGroupId");
    }

    /**
     * @return {Number}
     */

  }, {
    key: "rating",
    get: function get() {
      return this._data.rating;
    }

    /**
     * @return {Number}
     */

  }, {
    key: "ratingCount",
    get: function get() {
      return this._data.ratingCount;
    }

    /**
     * @return {Torch.Tag[]}
     */

  }, {
    key: "tags",
    get: function get() {
      return this._converted.get("tags");
    }

    /**
     * @return {String}
     */

  }, {
    key: "theme",
    get: function get() {
      return this._data.theme;
    }
  }]);

  return _class;
}();