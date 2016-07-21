BungieNet.Error = class extends ExtendableError{
  constructor(code, message = null, data = null){
    super(message);
    this.code = code;
    this.data = data;
  }
};

BungieNet.Error.codes = {
  codes: {
    no_cookie_by_name: 1,
    network_error: 2,
    no_csrf_token: 3,
    corrupt_response: 4,
    no_cookie_provider: 5
  }
};
