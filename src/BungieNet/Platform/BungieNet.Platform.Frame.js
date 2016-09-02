/* globals BungieNet */
/**
 * BungieNet.Platform.Frame
 *
 * Instances of this class should be used in the Platform queue/pool
 */
BungieNet.Platform.Frame = class {

  constructor(request = null, http = null, response = null, data = {}) {
    this._request = request;
    this._http = http;
    this._response = response;
    this._data = data;
    this._state = BungieNet.Platform.Frame.state.none;
  }

  get request() {
    return this._request;
  }

  set request(request) {
    this._request = request;
  }

  get http() {
    return this._http;
  }

  set http(http) {
    this._http = http;
  }

  get options() {
    return this._options;
  }

  get response() {
    return this._response;
  }

  set response(response) {
    this._response = response;
  }

  get state() {
    return this._state;
  }

  set state(state) {
    this._state = state;
  }

};

BungieNet.Platform.Frame.state = {
  none: 0,
  waiting: 1,
  active: 2
};
