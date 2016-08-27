/**
 * BungieNet Platform middleware
 */
export class Torch {

  /**
   * @param {BungieNet.Platform} p
   */
  constructor(p) {
    this._platform = p;
  }

  /**
   * @type {BungieNet.Platform}
   */
  get platform() {
    return this._platform;
  }

  /**
   * @param {BungieNet.Platform}
   */
  set platform(p) {
    this._platform = p;
  }

  /**
   * @param  {Number} [page=1]
   * @return {Promise<Torch.Conversation[]>}
   */
  getConversations(page = 1) {
    return new Promise((resolve, reject) => {
      this._platform.getConversationsV5(page).then(resp => {

        let convs = resp.response.results.map(r => {

          let c = new Torch.Conversation(r.detail);

          //create a message object from the initial conversation
          //details and add it as a message of the conversation
          let m = new Torch.Message({
            body: r.detail.body,
            conversationId: r.detail.conversationId,
            dateSent: r.detail.lastMessageSent,
            isAutoResponse: r.detail.isAutoResponse,
            isDeleted: false, //hardcoded!
            memberFromId: r.detail.memberFromId,
            messageId: r.detail.lastMessageId
          });

          //get user details
          m.sender = new Torch.User(
            Object.values(resp.response.users)
              .find(u => u.membershipId === r.detail.memberFromId)
          );

          c.messages.push(m);

          return c;

        });

        return resolve(new Torch.Response(
          resp,
          {
            conversations: convs
          }
        ));

      }, reject);
    });
  }

  /**
   * @param  {String} id
   * @param  {Number} [page=1]
   * @return {Promise.<Torch.Conversation>}
   */
  getConversationThread(id, page = 1) {
    return new Promise((resolve, reject) => {
      this._platform.getConversationThread(id, page).then(resp => {

        let conv = new Torch.Conversation({
          conversationId: id
        });

        conv.messages = resp.response.results.map(m => {

          let msg = new Torch.Message(m);

          msg.sender = new Torch.User(
            Object.values(resp.response.users)
              .find(u => u.membershipId === m.memberFromId)
          );

          return msg;

        });

        return resolve(new Torch.Response(
          resp,
          {
            conversation: conv
          }
        ));

      }, reject);
    });
  }

  /**
   * @param  {String} id
   * @return {Promise.<Torch.Response>}
   */
  getConversationById(id) {
    return new Promise((resolve, reject) => {
      this._platform.getConversationByIdV2(id).then(resp => {



      });
    });
  }


}
