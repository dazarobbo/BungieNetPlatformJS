/* globals BungieNet */
/**
 * Plugin base class for plugins
 */
BungieNet.Platform.Plugin = class {

  constructor() {

  }

  /**
   * Returns the function bound to a plugin to be invoked by the platform
   * @return {Function} - nop is returned if no handler is found
   */
  getDelegate(handlerName) {

    if(handlerName in this) {
      return this[handlerName];
    }

    return () => {
      //nop
    };

  }

};
