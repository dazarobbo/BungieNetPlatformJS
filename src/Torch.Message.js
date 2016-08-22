/* globals Torch, moment */
Torch.Messsage = class {

  constructor(o = {}) {

    /**
     * @type {Object}
     */
    this._data = o;

    /**
     * @type {Map}
     */
    this._converted = new Map();

    /**
     * @type {Torch.User}
     */
    this.sender = null;

    /**
     * @type {Torch.Group[]}
     */
    this.group = null;

  }

  _convert() {

    this._converted.set(
      "conversationId",
      new BigNumber(this._data.conversationId)
    );

    this._converted.set(
      "dateSent",
      moment(this._data.dateSent)
    );

    this._converted.set(
      "memberFromId",
      new BigNumber(this._data.memberFromId)
    );

    this._converted.set(
      "messageId",
      new BigNumber(this._data.messageId)
    );

  }

  /**
   * @return {String}
   */
  get body() {
    return this._data.body;
  }

  /**
   * @return {String}
   */
  get conversationId() {
    return this._converted.get("conversationId");
  }

  /**
   * @return {Moment}
   */
  get dateSent() {
    return this._converted.get("dateSent");
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
  get isDeleted() {
    return this._data.isDeleted;
  }

  /**
   * @return {BigNumber}
   */
  get memberFromId() {
    return new BigNumber(this._data.memberFromId);
  }

  /**
   * @return {BigNumber}
   */
  get messageId() {
    return this._converted.get("messageId");
  }

  /**
   * @return {String}
   */
  toString() {
    return this.body;
  }

};
