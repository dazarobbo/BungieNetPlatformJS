"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * FrameSet
 */
var FrameSet = function () {

  /**
   * @param {Number} [maxSize = -1] - maximum size of the set, -1 is no limit
   */
  function FrameSet() {
    var maxSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

    _classCallCheck(this, FrameSet);

    this._arr = [];
    this._maxSize = maxSize;
    this._comparer = null;
  }

  /**
   * Iterate over the inner array
   * @return {undefined}
   */


  _createClass(FrameSet, [{
    key: Symbol.iterator,
    value: regeneratorRuntime.mark(function value() {
      return regeneratorRuntime.wrap(function value$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.delegateYield(this._arr, "t0", 1);

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, value, this);
    })

    /**
     * Item at the back of the set
     * @type {Frame}
     */

  }, {
    key: "clear",


    /**
     * Clear all items in the set
     * @return {undefined}
     */
    value: function clear() {
      this._arr.length = 0;
    }

    /**
     * Comparer function for items
     * @type {Function}
     */

  }, {
    key: "dequeue",


    /**
     * Remove and return the item at the front of the set
     * @return {Frame} frame to return
     */
    value: function dequeue() {
      return this._arr.shift();
    }

    /**
     * Whether the set is empty
     * @type {Boolean}
     */

  }, {
    key: "enqueue",


    /**
     * Add an item to the end of the queue
     * @param {Frame} frame - frame to add
     * @return {undefined}
     */
    value: function enqueue(frame) {

      if (this.full) {
        return;
      }

      this._arr.push(frame);
    }

    /**
     * Filter the set by the given function; return true to keep
     * @param {Function} func - filter function
     * @return {FrameSet} filtered set
     */

  }, {
    key: "filter",
    value: function filter(func) {

      var fs = new FrameSet();

      fs._arr = this._arr.filter(func);
      fs._operation = this._operation;
      fs._maxSize = this._maxSize;
      fs._comparer = this._comparer;

      return fs;
    }

    /**
     * Item at the front of the set
     * @type {Frame}
     */

  }, {
    key: "remove",


    /**
     * Remove a given frame from the set
     * @param {Frame} frame - frame to remove
     * @return {undefined}
     */
    value: function remove(frame) {
      this._arr = this._arr.filter(function (f) {
        return f !== frame;
      });
    }

    /**
     * Number of items in the set
     * @type {Number}
     */

  }, {
    key: "sort",


    /**
     * Sorts the items in this queue according to the comparer
     * @return {undefined}
     */
    value: function sort() {
      this._arr.sort(this._comparer);
    }
  }, {
    key: "back",
    get: function get() {
      return this._arr[this.length - 1];
    }
  }, {
    key: "comparer",
    get: function get() {
      return this._comparer;
    }

    /**
     * Sets the comparer function for items
     * @param {Function} func - comparer function
     */
    ,
    set: function set(func) {
      this._comparer = func;
    }
  }, {
    key: "empty",
    get: function get() {
      return this.length === 0;
    }
  }, {
    key: "front",
    get: function get() {
      return this._arr[0];
    }

    /**
     * Whether the set is full
     * @type {Boolean}
     */

  }, {
    key: "full",
    get: function get() {
      return this.length >= this.maxLength;
    }

    /**
     * Maximum number of items this set can hold
     * @type {Number}
     */

  }, {
    key: "maxSize",
    get: function get() {
      return this._maxSize;
    }

    /**
     * Sets the maximum number of items this set can hold
     * @param {Number} ms - maximum size
     */
    ,
    set: function set(ms) {
      this._maxSize = ms;
    }
  }, {
    key: "size",
    get: function get() {
      return this._arr.length;
    }
  }]);

  return FrameSet;
}();

exports.default = FrameSet;