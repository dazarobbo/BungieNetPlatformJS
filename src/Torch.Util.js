/* globals Torch */
Torch.Util = class {

  /**
   * HTML encode a string
   * @param {String} str
   * @return {String}
   */
  static htmlEncode(str) {

    if(document) {
			return document.createElement("a").appendChild(
				document.createTextNode(str)).parentNode.innerHTML;
		}

		return str
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

  }

  /**
   * HTML decodes a string
   * @param {String} str
   * @return {String}
   */
  static htmlDecode(str) {

    if(document) {
      let a = document.createElement("s"); a.innerHTML = str;
      return a.textContent;
    }

    return str
      .replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
      })
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

  }

};
