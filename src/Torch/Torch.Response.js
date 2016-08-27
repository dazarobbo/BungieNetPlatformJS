/* globals Torch */
Torch.Response = class {

  /**
   * @param {BungieNet.Platform.Response} resp
   * @param {Object} [obj={}]
   */
  constructor(resp, obj = {}) {
    this.response = resp;
    Object.keys(obj).forEach(k => this[k] = obj[k]);
  }

  /**
   * Whether this response is an error
   * @return {Boolean}
   */
  get isError() {
    return this.response.isError;
  }

};
