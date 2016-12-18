"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Frame = require("./Frame.js");

var _Frame2 = _interopRequireDefault(_Frame);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Controls management over frames within a FrameSet
 */
var FrameManager = function () {

  /**
   * @param {Platform.FrameSet} frameSet - reference to a FrameSet
   */
  function FrameManager(frameSet) {
    _classCallCheck(this, FrameManager);

    this._frameSet = frameSet;
  }

  /**
   * Generate a FrameSet containing all waiting frames from the inner
   * FrameSet. NOTE: frames within the returned set are mutable!
   * @return {Platform.FrameSet}
   */


  _createClass(FrameManager, [{
    key: "getWaiting",
    value: function getWaiting() {
      return this._frameSet.filter(function (f) {
        return f.state === _Frame2.default.state.waiting;
      });
    }

    /**
     * Generate a FrameSet containing all active frames from the inner
     * FrameSet. NOTE: frames within the returned set are mutable!
     * @return {Platform.FrameSet}
     */

  }, {
    key: "getActive",
    value: function getActive() {
      return this._frameSet.filter(function (f) {
        return f.state === _Frame2.default.state.active;
      });
    }

    /**
     * @param {Platform.Frame} frame - frame to add
     */

  }, {
    key: "addFrame",
    value: function addFrame(frame) {
      this._frameSet.enqueue(frame);
    }

    /**
     * @param {Platform.Frame} frame - frame to remove
     */

  }, {
    key: "removeFrame",
    value: function removeFrame(frame) {
      this._frameSet.remove(frame);
    }

    /**
     * Returns the "next" waiting frame
     * @return {Promise<Platform.Frame>}
     */

  }, {
    key: "getFrame",
    value: function getFrame() {

      var waitList = this.getWaiting();

      if (waitList.empty) {
        return null;
      }

      return waitList.front;
    }
  }]);

  return FrameManager;
}();

exports.default = FrameManager;
;
//# sourceMappingURL=FrameManager.js.map