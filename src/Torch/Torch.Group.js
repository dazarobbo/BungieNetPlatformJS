/* globals Torch, BungieNet, moment */
Torch.Group = class {

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

  _convert() {

    this._converted.set(
      "banExpireDate",
      moment(this._data.banExpireDate)
    );

    this._converted.set(
      "conversationId",
      new BigNumber(this._data.conversationId)
    );

    this._converted.set(
      "creationDate",
      moment(this._data.creationDate)
    );

    this._converted.set(
      "deletedByMembershipId",
      new BigNumber(this._data.deletedByMembershipId)
    );

    this._converted.set(
      "deletionDate",
      moment(this._data.deletionDate)
    );

    this._converted.set(
      "founderMembershipId",
      new BigNumber(this._data.founderMembershipId)
    );

    this._converted.set(
      "groupId",
      new BigNumber(this._data.groupId)
    );

    this._converted.set(
      "membershipIdCreated",
      new BigNumber(this._data.membershipIdCreated)
    );

    this._converted.set(
      "modificationDate",
      moment(this._data.modificationDate)
    );

    this._converted.set(
      "primaryAlliedGroupId",
      new BigNumber(this._data.primaryAlliedGroupId)
    );

    this._converted.set(
      "tags",
      this._data.tags.map(m => new Torch.Tag(m))
    );

  }

  /**
   * @return {String}
   */
  get about() {
    return this._data.about;
  }

  /**
   * @return {Boolean}
   */
  get allowChat() {
    return this._data.allowChat;
  }

  /**
   * @return {Number}
   */
  get avatarImageIndex() {
    return this._data.avatarImageIndex;
  }

  /**
   * @return {String}
   */
  get avatarPath() {
    return this._data.avatarPath;
  }

  /**
   * @return {URI}
   */
  getAvatarLink() {

    let uri = new URI(this._data.avatarPath);

    if(uri.is("relative")) {
      uri = BungieNet.base.resource(uri.resource());
    }

    return uri;

  }

  /**
   * @return {Moment|null}
   */
  get banExpireDate() {
    let d = this._converted.get("banExpireDate");
    return d.isSame("2001-01-01") ? null : d;
  }

  /**
   * @return {Boolean}
   */
  get wasBanned() {
    return this.banExpireDate !== null;
  }

  /**
   * @return {String}
   */
  get bannerPath() {
    return this._data.bannerPath;
  }

  /**
   * @return {URI}
   */
  getBannerLink() {

    let uri = new URI(this._data.bannerPath);

    if(uri.is("relative")) {
      uri = BungieNet.base.resource(uri.resource());
    }

    return uri;

  }

  /**
   * @return {Number}
   */
  get chatSecurity() {
    return this._data.chatSecurity;
  }

  /**
   * @return {String}
   */
  get clanCallsign() {
    return this._data.clanCallsign;
  }

  /**
   * @return {Number}
   */
  get clanReviewType() {
    return this._data.clanReviewType;
  }

  /**
   * @return {BigNumber}
   */
  get conversationId() {
    return this._converted.get("conversationId");
  }

  /**
   * @return {Moment}
   */
  get creationDate() {
    return this._converted.get("creationDate");
  }

  /**
   * @return {Number}
   */
  get defaultPublicity() {
    return this._data.defaultPublicity;
  }

  /**
   * @return {BigNumber}
   */
  get deletedByMembershipId() {
    return this._converted.get("deletedByMembershipId");
  }

  /**
   * @return {Moment|null}
   */
  get deletionDate() {
    let d = this._converted.get("deletionDate");
    return d.isSame("2001-01-01") ? null : d;
  }

  /**
   * @return {Boolean}
   */
  get wasDeleted() {
    return this.deletionDate !== null;
  }

  /**
   * @return {Boolean}
   */
  get enableInvitationMessagingForAdmins() {
    return this._data.enableInvitationMessagingForAdmins;
  }

  /**
   * @return {BigNumber}
   */
  get founderMembershipId() {
    return this._converted.get("founderMembershipId");
  }

  /**
   * @return {BigNumber}
   */
  get groupId() {
    return this._converted.get("groupId");
  }

  /**
   * @return {Number}
   */
  get groupType() {
    return this._data.groupType;
  }

  /**
   * @return {Number}
   */
  get homepage() {
    return this._data.homepage;
  }

  /**
   * @return {Boolean}
   */
  get isAllianceOwner() {
    return this._data.isAllianceOwner;
  }

  /**
   * @return {Boolean}
   */
  get isDefaultPostAlliance() {
    return this._data.isDefaultPostAlliance;
  }

  /**
   * @return {Boolean}
   */
  get isDefaultPostPublic() {
    return this._data.isDefaultPostPublic;
  }

  /**
   * @return {Boolean}
   */
  get isDeleted() {
    return this._data.isDeleted;
  }

  /**
   * @return {Boolean}
   */
  get isMembershipClosed() {
    return this._data.isMembershipClosed;
  }

  /**
   * @return {Boolean}
   */
  get isMembershipReviewed() {
    return this._data.isMembershipReviewed;
  }

  /**
   * @return {Boolean}
   */
  get isPublic() {
    return this._data.isPublic;
  }

  /**
   * @return {Boolean}
   */
  get isPublicTopicAdminOnly() {
    return this._data.isPublicTopicAdminOnly;
  }

  /**
   * @return {String}
   */
  get locale() {
    return this._data.locale;
  }

  /**
   * @return {Number}
   */
  get memberCount() {
    return this._data.memberCount;
  }

  /**
   * @return {BigNumber}
   */
  get membershipIdCreated() {
    return this._converted.get("membershipIdCreated");
  }

  /**
   * @return {Number}
   */
  get membershipOption() {
    return this._data.membershipOption;
  }

  /**
   * @return {Moment|null}
   */
  get modificationDate() {
    let d = this._converted.get("modificationDate");
    return d.isSame("2001-01-01") ? null : d;
  }

  /**
   * @return {String}
   */
  get motto() {
    return this._data.motto;
  }

  /**
   * @return {String}
   */
  get name() {
    return this._data.name;
  }

  /**
   * @return {Number}
   */
  get pendingMemberCount() {
    return this._data.pendingMemberCount;
  }

  /**
   * @return {BigNumber}
   */
  get primaryAlliedGroupId() {
    return this._converted.get("primaryAlliedGroupId");
  }

  /**
   * @return {Number}
   */
  get rating() {
    return this._data.rating;
  }

  /**
   * @return {Number}
   */
  get ratingCount() {
    return this._data.ratingCount;
  }

  /**
   * @return {Torch.Tag[]}
   */
  get tags() {
    return this._converted.get("tags");
  }

  /**
   * @return {String}
   */
  get theme() {
    return this._data.theme;
  }

  /**
   * @return {String}
   */
  toString() {
    return this.name;
  }

};
