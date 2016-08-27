/* globals Torch */
/**
 * @example
 *
 * let t = new Torch.Tag("#Bungie");
 *
 * t.hash; //#bungie
 * t.raw; //Bungie
 * t.toString(); //#bungie
 */
Torch.Tag = class {

  /**
   * @param {String} str - string containing a tag or hash tag
   */
  constructor(str) {
    this._tag = Torch.Tag._trim(str);
  }

  /**
   * Strips excess tag data
   * @param {String} str eg. "#Bungie"
   * @return {String}
   */
  static _trim(str) {
    return str.trim().replace("#", "");
  }

  /**
   * Returns the tag as a hash tag
   * @return {String} eg. "#bungie"
   */
  get hash() {
    return `#${this.toString()}`;
  }

  /**
   * The raw, non-normalised tag
   * @return {String} eg. "Bungie"
   */
  get raw() {
    return this._tag;
  }

  /**
   * Normalised version of this tag
   * @return {String} eg. "#bungie"
   */
  toString() {
    return this._tag.toLowerCase();
  }

};
