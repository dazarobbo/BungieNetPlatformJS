"use strict";

/**
 * FrameSet
 *
 * By default, this set will act in FIFO mode. If custom, set the operation
 * type to custom and set a comparer function
 *
 * @param {Number} [maxSize = -1] - maximum size of the set, -1 is no limit
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FrameSet = function () {
  function FrameSet() {
    var maxSize = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

    _classCallCheck(this, FrameSet);

    this._arr = [];
    this._maxSize = maxSize;
    this._comparer = null;
  }

  /**
   * Iterate over the inner array
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
     * Clear all items in the set
     */

  }, {
    key: "clear",
    value: function clear() {
      this._arr.length = 0;
    }

    /**
     * Add an item to the end of the queue
     * @param {Platform.Frame} frame
     */

  }, {
    key: "enqueue",
    value: function enqueue(frame) {

      if (this.full) {
        return;
      }

      this._arr.push(frame);
    }

    /**
     * Remove and return the item at the front of the set
     * @return {Platform.Frame}
     */

  }, {
    key: "dequeue",
    value: function dequeue() {
      return this._arr.shift();
    }

    /**
     * Item at the front of the set
     * @type {Platform.Frame}
     */

  }, {
    key: "remove",


    /**
     * Remove a given frame from the set
     * @param {Platform.Frame} frame
     */
    value: function remove(frame) {
      this._arr = this._arr.filter(function (f) {
        return f !== frame;
      });
    }

    /**
     * Comparer function for items
     * @type {Function}
     */

  }, {
    key: "sort",


    /**
     * Sorts the items in this queue according to the comparer
     */
    value: function sort() {
      this._arr.sort(this._comparer);
    }
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
  }, {
    key: "front",
    get: function get() {
      return this._arr[0];
    }

    /**
     * Item at the back of the set
     * @type {Platform.Frame}
     */

  }, {
    key: "back",
    get: function get() {
      return this._arr[this.length - 1];
    }

    /**
     * Whether the set is empty
     * @type {Boolean}
     */

  }, {
    key: "empty",
    get: function get() {
      return this.length === 0;
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
     * Number of items in the set
     * @type {Number}
     */

  }, {
    key: "size",
    get: function get() {
      return this._arr.length;
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
     * @param  {Number} ms
     */
    ,
    set: function set(ms) {
      this._maxSize = ms;
    }
  }, {
    key: "comparer",
    get: function get() {
      return this._comparer;
    }

    /**
     * Sets the comparer function for items
     * @param  {Function} func
     */
    ,
    set: function set(func) {
      this._comparer = func;
    }
  }]);

  return FrameSet;
}();

exports.default = FrameSet;
;
//# sourceMappingURL=FrameSet.js.map