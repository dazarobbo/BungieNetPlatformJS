/* globals BungieNet */
/**
 *
 */
BungieNet.Platform.FrameManager = class {

  constructor(frameSet) {
    this._frameSet = frameSet;
  }

  addFrame(frame) {
    this._frameSet.enqueue(frame);
  }

  getFrame() {

    if(this._frameSet.getWaiting().empty) {
      return Promise.resolve(null);
    }

    let frame = this._frameSet.getWaiting().front;

    return Promise.resolve(frame);

  }

};
