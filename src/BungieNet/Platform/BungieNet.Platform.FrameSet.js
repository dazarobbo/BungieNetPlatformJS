/* globals BungieNet */
/**
 * FrameSet
 *
 * By default, this set will act in FIFO mode. If custom, set the operation
 * type to custom and set a comparer function
 *
 * @param {Number} [maxSize = -1] - maximum size of the set, -1 is no limit
 * @param {BungieNet.Platform.FrameSet.operationType} [op = BungieNet.Platform.FrameSet.operationType.fifo] - set operation type
 *
 */
BungieNet.Platform.FrameSet = class {

  constructor(maxSize = -1, op = BungieNet.Platform.FrameSet.operationType.fifo) {
    this._arr = [];
    this._operation = op;
    this._maxSize = maxSize;
    this._comparer = null;
  }

  /**
   * Iterate over the inner array
   */
  *[Symbol.iterator]() {
    yield* this._arr;
  }

  /**
   * Clear all items in the set
   */
  clear() {
    this._arr.length = 0;
  }

  /**
   * Add an item to the end of the queue
   * @param {BungieNet.Platform.Frame} frame
   */
  enqueue(frame) {

    if(!this.full) {
      this._arr.push(frame);
    }

    if(this._operation === BungieNet.Platform.FrameSet.operationType.custom) {
      this.sort();
    }

  }

  /**
   * Remove and return the item at the front of the set
   * @return {BungieNet.Platform.Frame}
   */
  dequeue() {
    return this._arr.shift();
  }

  /**
   * Item at the front of the set
   * @type {BungieNet.Platform.Frame}
   */
  get front() {
    return this._arr[0];
  }

  /**
   * Item at the back of the set
   * @type {BungieNet.Platform.Frame}
   */
  get back() {
    return this._arr[this.length - 1];
  }

  /**
   * Whether the set is empty
   * @type {Boolean}
   */
  get empty() {
    return this.length === 0;
  }

  /**
   * Whether the set is full
   * @type {Boolean}
   */
  get full() {
    return this.length >= this.maxLength;
  }

  /**
   * Number of items in the set
   * @type {Number}
   */
  get size() {
    return this._arr.length;
  }

  /**
   * Maximum number of items this set can hold
   * @type {Number}
   */
  get maxSize() {
    return this._maxSize;
  }

  /**
   * Sets the maximum number of items this set can hold
   * @param  {Number} ms
   */
  set maxSize(ms) {
    this._maxSize = ms;
  }

  /**
   * Operation type of the queue
   * @type {BungieNet.Platform.FrameSet.operationType}
   */
  get operation() {
    return this._operation;
  }

  /**
   * Sets the operation type of the queue
   * @param  {BungieNet.Platform.FrameSet.operationType} op
   */
  set operation(op) {
    this._operation = op;
  }

  /**
   * Remove a given frame from the set
   * @param {BungieNet.Platform.Frame} frame
   */
  remove(frame) {
    this._arr = this._arr.filter(f => f !== frame);
  }

  /**
   * Comparer function for items
   * @type {Function}
   */
  get comparer() {
    return this._comparer;
  }

  /**
   * Sets the comparer function for items
   * @param  {Function} func
   */
  set comparer(func) {
    this._comparer = func;
  }

  /**
   * Sorts the items in this queue according to the comparer
   */
  sort() {
    this._arr.sort(this._comparer);
  }

  filter(func) {
    let fs = new BungieNet.Platform.FrameSet();
    fs._arr = this._arr.map(func);
    return fs;
  }

  getWaiting() {
    return this.filter(f => {
      return f.state === BungieNet.Platform.Frame.state.waiting;
    });
  }

  getActive() {
    return this.filter(f => {
      return f.state === BungieNet.Platform.Frame.state.active;
    });
  }

};

/**
 * Queue operation type
 * @type {Object}
 */
BungieNet.Platform.FrameSet.operationType = {

  /**
   * First In, First Out
   * @type {Number}
   */
  fifo: 1,

  /**
   * Custom operation type
   * @type {Number}
   */
  custom: 2

};
