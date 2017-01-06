import Frame from "./Frame.js";

/**
 * Controls management over frames within a FrameSet
 */
export default class FrameManager {

  /**
   * @param {FrameSet} frameSet - reference to a FrameSet
   */
  constructor(frameSet) {
    this._frameSet = frameSet;
  }

  /**
   * @param {Frame} frame - frame to add
   * @return {undefined}
   */
  addFrame(frame) {
    this._frameSet.enqueue(frame);
  }

  /**
   * Generate a FrameSet containing all active frames from the inner
   * FrameSet. NOTE: frames within the returned set are mutable!
   * @return {FrameSet} frames currently active
   */
  getActive() {
    return this._frameSet.filter(f => f.state === Frame.state.active);
  }

  /**
   * Returns the "next" waiting frame
   * @return {Promise<Platform.Frame>} the next frame in the wait list
   */
  getFrame() {

    const waitList = this.getWaiting();

    if(waitList.empty) {
      return null;
    }

    return waitList.front;

  }

  /**
   * Generate a FrameSet containing all waiting frames from the inner
   * FrameSet. NOTE: frames within the returned set are mutable!
   * @return {FrameSet} frames currently waiting
   */
  getWaiting() {
    return this._frameSet.filter(f => f.state === Frame.state.waiting);
  }

  /**
   * @param {Frame} frame - frame to remove
   * @return {undefined}
   */
  removeFrame(frame) {
    this._frameSet.remove(frame);
  }

}
