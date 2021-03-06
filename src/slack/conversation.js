'use strict';

const Promise = require('bluebird');
const EventEmitter = require('events');
const debug = require('debug')('slack:conversation');

class Conversation {

  /**
   * @Constructor
   *
   * @param {Object} websocket - Websocket instance.
   * @param {String=} user - User id.
   * @param {String} channel - Channel name.
   */
  constructor(websocket, channel, user) {
    debug('Initialize conversation.');
    this.websocket = websocket;
    this.eventEmitter = new EventEmitter();
    this.messageCount = 1;
    this.user = user;
    this.channel = channel;
    this.listen_();
  }


  destroy() {
    this.eventEmitter.removeAllListeners();
  }


  /**
   * @private
   * Listens the channel for user message.
   */
  listen_() {
    const that = this;

    debug('Listening for user message.');
    this.websocket.on('message', (raw) => {
      const response = JSON.parse(raw);

      if (that.user) {
        if (response.user === that.user) {
          that.eventEmitter.emit(response.type, response);
        }
      } else {
        that.eventEmitter.emit(response.type, response);
      }
    });
  }


  /**
   * Say something to a channel.
   *
   * @param {String} message - Message to say.
   *
   * @returns {Promise}
   */
  say(message) {
    let that = this;

    const opts = {
      id: this.messageCount,
      type: 'message',
      channel: this.channel,
      text: message
    };

    return new Promise((resolve, reject) => {
      debug('Send message initialize', opts.text);
      that.websocket.send(JSON.stringify(opts), (err) => {
        if (err) {
          debug('Send message failed due to', err.message);
          return reject(err);
        }

        that.messageCount += 1;

        debug('Send message successful');
        resolve();
      });
    });
  }


  /**
   * Asks the question and waits for the answer.
   * If format provided asks again until enforced replyPattern requirements met.
   *
   * @param {(string|Object)} opts - String, or object.
   * @param {string=} opts.text - Question.
   * @param {RegExp=} opts.replyPattern - Reply pattern as an instance of RegExp.
   * @param {(function|Promise)} cb - Callback. Has parameter `response`.
   *
   * @returns {Promise}
   */
  ask(opts, cb) {
    if (!opts) return Promise.reject(new Error('Unknown question object/string.'));

    /**
     * Opts can be an object or a string.
     */
    if (typeof(opts) == 'string') {
      opts = {
        text: opts
      };
    }

    /**
     * Add a reply pattern to check if the response fits your needs.
     */
    if (opts.replyPattern && !(opts.replyPattern instanceof RegExp)) {
      return Promise.reject(new Error('replyPattern is not valid. It should be an instance of RegExp.'));
    }

    let that = this;

    debug('Ask question to the user.');
    return this
      .say(opts.text)
      .then(() => {
        return new Promise((resolve) => {
          debug('Wait for a response.');
          that.eventEmitter.once('message', (response) => {
            debug('Response received', response.text);
            if (opts.replyPattern && opts.replyPattern.test(response.text)) {
              return resolve(response);
            }

            if (cb) {
              /**
               * Check if callback is promisified. If it's promisified, wait for it.
               */
              if (typeof cb.then === 'function') {
                return cb(response).then(() => {
                  return resolve(that.ask(opts, cb));
                });
              }

              cb(response);
            }

            resolve(response);
          });
        })
      });
  }


  /**
   * Asks an array of questions while waiting for the answer of each.
   *
   * @param {Object[]|string} opts - Array of opt objects.
   * @param {string} opts[].text - Question to be asked.
   * @param {string=} opts[].replyPattern - Reply pattern to be enforced.
   * @param {Function=} opts[].callback - Callback to call upon faulty replies.
   *
   * @returns {Promise}
   */
  askSerial(opts) {
    return Promise.mapSeries(opts, (opt) => {
      return that.ask(opt, opt.callback || null)
        .then((response) => {
          return response;
        });
    });
  }
}

module.exports = Conversation;
