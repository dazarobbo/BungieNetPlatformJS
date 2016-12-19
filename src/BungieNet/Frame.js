/**
 * Platform.Frame
 *
 * Instances of this class should be used in the Platform
 */
export default class Frame {

  /**
   *
   */
  constructor() {

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
  get id() {
    return this._id;
  }

  /**
   * Generates a global id value for a Frame
   * @return {Number} new frame id
   */
  static generateId() {
    Frame.id += 1;
    return Frame.id;
  }

}

/**
 * Static id variable to tag Frames with
 * @type {Number}
 */
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
