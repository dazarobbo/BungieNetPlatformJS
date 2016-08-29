/* globals BungieNet */
/**
 * Queue
 *
 * By default, this queue will act in FIFO mode. If custom, set the operation
 * type to custom and set a comparer function
 *
 * @param {Number} [maxLength = -1] - maximum length of the queue, -1 is no limit
 * @param {BungieNet.Platform.Queue.operationType} [op = BungieNet.Platform.Queue.operationType.fifo] - queue operation type
 *
 * @example
 * let queue = new BungieNet.Platform.Queue();
 * queue.enqueue(new BungieNet.Platform.QueueItem("Hello world!"));
 * queue.enqueue(new BungieNet.Platform.QueueItem("Goodbye world!"));
 *
 * queue.front.data; //Hello world!
 * queue.back.data; //Goodbye world!
 *
 */
BungieNet.Platform.Queue = class {

  constructor(maxLength = -1, op = BungieNet.Platform.Queue.operationType.fifo) {
    this._arr = [];
    this._operation = op;
    this._maxLength = maxLength;
    this._comparer = null;
  }

  *[Symbol.iterator]() {
    yield* this._arr;
  }

  /**
   * Clear all items in the queue
   */
  clear() {
    this._arr.length = 0;
  }

  /**
   * Add an item to the end of the queue
   * @param {*} data
   */
  enqueue(data) {

    if(!this.full) {
      this._arr.push(new BungieNet.Platform.QueueItem(data));
    }

    //if custom queue, sort it
    if(this._operation === BungieNet.Platform.Queue.operationType.custom) {
      this._sort();
    }

  }

  /**
   * Remove and return the item at the front of the queue
   * @return {*}
   */
  dequeue() {
    return this._arr.shift().data;
  }

  /**
   * Item at the front of the queue
   * @type {*}
   */
  get front() {
    return this._arr[0];
  }

  /**
   * Item at the back of the queue
   * @type {*}
   */
  get back() {
    return this._arr[this.length - 1];
  }

  /**
   * Whether the queue is empty
   * @type {Boolean}
   */
  get empty() {
    return this.length === 0;
  }

  /**
   * Whether the queue is full
   * @type {Boolean}
   */
  get full() {
    return this.length >= this.maxLength;
  }

  /**
   * Number of items in the queue
   * @type {Number}
   */
  get length() {
    return this._arr.length;
  }

  /**
   * Maximum number of items this queue can hold
   * @type {Number}
   */
  get maxLength() {
    return this._maxLength;
  }

  /**
   * Sets the maximum number of items this queue can hold
   * @param  {Number} ml
   */
  set maxLength(ml) {
    this._maxLength = ml;
  }

  /**
   * Operation type of the queue
   * @type {BungieNet.Platform.Queue.operationType}
   */
  get operation() {
    return this._operation;
  }

  /**
   * Sets the operation type of the queue
   * @param  {BungieNet.Platform.Queue.operationType} op
   */
  set operation(op) {
    this._operation = op;
  }

  /**
   * Comparer function for queue items
   * @type {Function}
   */
  get comparer() {
    return this._comparer;
  }

  /**
   * Sets the comparer function for queue items
   * @param  {Function} func
   */
  set comparer(func) {
    this._comparer = func;
  }

  /**
   * Sorts the items in this queue according to the comparer
   */
  _sort() {
    this._arr.sort(this._comparer);
  }

};

/**
 * Queue operation type
 * @type {Object}
 */
BungieNet.Platform.Queue.operationType = {

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
