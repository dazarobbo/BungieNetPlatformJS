/**
 * Base class for custom error types
 * @see http://stackoverflow.com/a/32749533/570787
 */
class ExtendableError extends Error {
  constructor(message) {

    super(message);
    this.name = this.constructor.name;
    this.message = message;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
    else {
      this.stack = (new Error(message)).stack;
    }

  }
}
