/* globals Torch, moment */
Torch.Conversation = class {

  constructor(o = {}) {

    /**
     * Raw data from bungie.net
     * @type {Object}
     */
    this._data = o;

    /**
     * Converted data
     * @type {Map}
     */
    this._converted = new Map();

    /**
     * @type {Torch.Messsage[]}
     */
    this.messages = [];

    this._convert();

  }

  *[Symbol.iterator]() {
    yield* this.messages;
  }

  _convert() {

    this._converted.set(
      "conversationId",
      new BigNumber(this._data.conversationId)
    );

    this._converted.set(
      "dateStarted",
      moment(this._data.dateStarted)
    );

    this._converted.set(
      "lastMessageId",
      new BigNumber(this._data.lastMessageId)
    );

    this._converted.set(
      "lastMessageSent",
      moment(this._data.lastMessageSent)
    );

    this._converted.set(
      "lastRead",
      moment(this._data.lastRead)
    );

    this._converted.set(
      "memberFromId",
      new BigNumber(this._data.memberFromId)
    );

    this._converted.set(
      "ownerEntityId",
      new BigNumber(this._data.ownerEntityId)
    );

    this._converted.set(
      "starter",
      new BigNumber(this._data.starter)
    );

    this._converted.set(
      "targetMembershipId",
      new BigNumber(this._data.targetMembershipId)
    );

  }

  /**
   * @return {String}
   */
  get body() {
    return this._data.body;
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
  get dateStarted() {
    return this._converted.get("dateStarted");
  }

  /**
   * @return {Boolean}
   */
  get isAutoResponse() {
    return this._data.isAutoResponse;
  }

  /**
   * @return {Boolean}
   */
  get isGlobal() {
    return this._data.isGlobal;
  }

  /**
   * @return {Boolean}
   */
  get isLocked() {
    return this._data.isLocked;
  }

  /**
   * @return {Boolean}
   */
  get isRead() {
    return this._data.isRead;
  }

  /**
   * @return {BigNumber}
   */
  get lastMessageId() {
    return this._converted.get("lastMessageId");
  }

  /**
   * @return {Moment}
   */
  get lastMessageSent() {
    return this._converted.get("lastMessageSent");
  }

  /**
   * @return {Moment}
   */
  get lastRead() {
    return this._converted.get("lastRead");
  }

  /**
   * @return {BigNumber}
   */
  get memberFromId() {
    return this._converted.get("memberFromId");
  }

  /**
   * @return {BigNumber}
   */
  get ownerEntityId() {
    return this._converted.get("ownerEntityId");
  }

  /**
   * @return {Number}
   */
  get ownerEntityType() {
    return this._data.ownerEntityType;
  }

  /**
   * @return {BigNumber}
   */
  get starter() {
    return this._converted.get("starter");
  }

  /**
   * @return {Number}
   */
  get status() {
    return this._data.status;
  }

  /**
   * @return {BigNumber}
   */
  get targetMembershipId() {
    return this._converted.get("targetMembershipId");
  }

  /**
   * @return {Number}
   */
  get totalMessageCount() {
    return this._data.totalMessageCount;
  }

};
