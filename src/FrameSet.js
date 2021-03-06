/**
 * FrameSet
 */
export default class FrameSet {

  /**
   * @param {Number} [maxSize = -1] - maximum size of the set, -1 is no limit
   */
  constructor(maxSize = -1) {
    this._arr = [];
    this._maxSize = maxSize;
    this._comparer = null;
  }

  /**
   * Iterate over the inner array
   * @return {undefined}
   */
  *[Symbol.iterator]() {
    yield* this._arr;
  }

  /**
   * Item at the back of the set
   * @type {Frame}
   */
  get back() {
    return this._arr[this.length - 1];
  }

  /**
   * Clear all items in the set
   * @return {undefined}
   */
  clear() {
    this._arr.length = 0;
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
   * @param {Function} func - comparer function
   */
  set comparer(func) {
    this._comparer = func;
  }

  /**
   * Remove and return the item at the front of the set
   * @return {Frame} frame to return
   */
  dequeue() {
    return this._arr.shift();
  }

  /**
   * Whether the set is empty
   * @type {Boolean}
   */
  get empty() {
    return this.length === 0;
  }

  /**
   * Add an item to the end of the queue
   * @param {Frame} frame - frame to add
   * @return {undefined}
   */
  enqueue(frame) {

    if(this.full) {
      return;
    }

    this._arr.push(frame);

  }

  /**
   * Filter the set by the given function; return true to keep
   * @param {Function} func - filter function
   * @return {FrameSet} filtered set
   */
  filter(func) {

    const fs = new FrameSet();

    fs._arr = this._arr.filter(func);
    fs._maxSize = this._maxSize;
    fs._comparer = typeof this._comparer === "function"
      ? this._comparer.bind(fs)
      : null;

    return fs;

  }

  /**
   * Item at the front of the set
   * @type {Frame}
   */
  get front() {
    return this._arr[0];
  }

  /**
   * Whether the set is full
   * @type {Boolean}
   */
  get full() {
    return this.length >= this.maxLength;
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
   * @param {Number} ms - maximum size
   */
  set maxSize(ms) {
    this._maxSize = ms;
  }

  /**
   * Remove a given frame from the set
   * @param {Frame} frame - frame to remove
   * @return {undefined}
   */
  remove(frame) {
    this._arr = this._arr.filter(f => f !== frame);
  }

  /**
   * Number of items in the set
   * @type {Number}
   */
  get size() {
    return this._arr.length;
  }

  /**
   * Sorts the items in this queue according to the comparer
   * @return {undefined}
   */
  sort() {
    this._arr.sort(this._comparer);
  }

}
