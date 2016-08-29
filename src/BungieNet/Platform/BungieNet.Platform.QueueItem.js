/* globals BungieNet */
/**
 * QueueItem
 *
 * @param {*} data - any data to store
 *
 * @example
 * let item = new BungieNet.Platform.QueueItem("Hello World!");
 *
 */
BungieNet.Platform.QueueItem = class {

  constructor(data) {
    this._data = data;
    this._enqueueTime = Date.now();
  }

  /**
   * Data inside this queue item
   * @type {*}
   */
  get data() {
    return this._data;
  }

  /**
   * Sets the data inside this queue item
   * @param  {*} data
   */
  set data(data) {
    this._data = data;
  }

  /**
   * Length of time this item has existed for in milliseconds
   * @return {Number}
   */
  get queueTime() {
    return Date.now() - this._enqueueTime;
  }

};
