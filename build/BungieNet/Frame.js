"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Platform.Frame
 *
 * Instances of this class should be used in the Platform
 */
var Frame = function () {

  /**
   *
   */
  function Frame() {
    _classCallCheck(this, Frame);

    /**
     * Frame id to help identify it
     * @type {Number}
     */
    this._id = Frame.generateId();

    /**
     * The Platform instance this frame belongs to
     * @type {Platform}
     */
    this.platform = null;

    /**
     * The incoming service-level request
     * @type {Platform.Request}
     */
    this.request = null;

    /**
     * The finished service-level response
     * @type {Platform.Response}
     */
    this.response = null;

    /**
     * Object handling the request workflow
     * @type {Platform.PlatformRequest}
     */
    this.platformRequest = null;

    /**
     * @type {Platform.Frame.state}
     */
    this.state = Frame.state.none;

    /**
     * @type {Promise}
     */
    this.serviceResolve = null;

    /**
     * @type {Promise}
     */
    this.serviceReject = null;
  }

  /**
   * @return {Number} - frame id number
   */


  _createClass(Frame, [{
    key: "id",
    get: function get() {
      return this._id;
    }

    /**
     * Generates a global id value for a Frame
     * @return {Number} new frame id
     */

  }], [{
    key: "generateId",
    value: function generateId() {
      Frame.id += 1;
      return Frame.id;
    }
  }]);

  return Frame;
}();

/**
 * Static id variable to tag Frames with
 * @type {Number}
 */


exports.default = Frame;
Frame.id = 0;

/**
 * Enum of a Frame's possible states
 * @type {Object}
 */
Frame.state = {

  /**
   * None or unknown state
   * @type {Number}
   */
  none: 0,

  /**
   * Waiting for execution
   * @type {Number}
   */
  waiting: 1,

  /**
   * Actively executing
   * @type {Number}
   */
  active: 2,

  /**
   * Finished executing
   * @type {Number}
   */
  done: 3

};
//# sourceMappingURL=Frame.js.map