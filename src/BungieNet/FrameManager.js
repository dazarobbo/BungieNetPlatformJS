"use strict";

import Frame from "./Frame.js";

/**
 * Controls management over frames within a FrameSet
 */
export default class FrameManager {

  /**
   * @param {Platform.FrameSet} frameSet - reference to a FrameSet
   */
  constructor(frameSet) {
    this._frameSet = frameSet;
  }

  /**
   * Generate a FrameSet containing all waiting frames from the inner
   * FrameSet. NOTE: frames within the returned set are mutable!
   * @return {Platform.FrameSet}
   */
  getWaiting() {
    return this._frameSet.filter(f => {
      return f.state === Frame.state.waiting;
    });
  }

  /**
   * Generate a FrameSet containing all active frames from the inner
   * FrameSet. NOTE: frames within the returned set are mutable!
   * @return {Platform.FrameSet}
   */
  getActive() {
    return this._frameSet.filter(f => {
      return f.state === Frame.state.active;
    });
  }

  /**
   * @param {Platform.Frame} frame - frame to add
   */
  addFrame(frame) {
    this._frameSet.enqueue(frame);
  }

  /**
   * @param {Platform.Frame} frame - frame to remove
   */
  removeFrame(frame) {
    this._frameSet.remove(frame);
  }

  /**
   * Returns the "next" waiting frame
   * @return {Promise<Platform.Frame>}
   */
  getFrame() {

    const waitList = this.getWaiting();

    if(waitList.empty) {
      return null;
    }

    return waitList.front;

  }

};
