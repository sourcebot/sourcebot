'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();

chai.use(sinonChai);
chai.use(chaiAsPromised);

const Promise = require('bluebird');
const EventEmitter = require('events');
const WSInstance = require('../../src/slack/ws');
const Request = require('../../src/slack/request');
const ws = require('ws');

class MockWebSocket {
  constructor(url) {}

  on(input, callback) {
    callback();
  }
  send(text, callback) {
    callback();
  }
}

describe('Websocket Properties', () => {
  beforeEach(() => {
    this.websocket = new MockWebSocket();

    sinon.spy(this.websocket, 'on');
    sinon.spy(this.websocket, 'send');

    this.request = new Request('EXAMPLE_TOKEN');
    this.instance = new WSInstance('ws://echo.websocket.org/', this.request);
  });

  it('should throw error on missing url or request instance', () => {
    const instance = () => {
      let core = new WSInstance();
    };

    instance.should.Throw(Error)
  });

  it('should throw error on missing request instance', () => {
    const instance = () => {
      let core = new WSInstance('https://github.com/sourcebot/sourcebot');
    };

    instance.should.throw(Error);
  });

  it('should have a valid ws instance', () => {
    return this.instance
      .connect()
      .then((bot) => {
        bot.should.be.an.instanceof(WSInstance);
        bot.websocket.should.exist;
      });
  });

  it('should return websocket instance on getSocketInstance', () => {
    return this.instance
      .connect()
      .then((bot) => {
        bot.should.exist;
        bot.getSocketInstance().should.be.an.instanceof(ws);
      });
  });

  it('should send a message and bump count', () => {
    let that = this;

    return this.instance
      .connect()
      .then((bot) => {
        bot.websocket = that.websocket;
        bot.messageCount.should.equal(1);

        bot.send({
          text: 'Hello world',
          channel: 'TEST_CHANNEL'
        });

        bot.messageCount.should.equal(2);
        bot.websocket.send.should.calledOnce;
      });
  });

  it('should reject if an error occured while sending a message', () => {
    let that = this;

    return this.instance
      .connect()
      .then((bot) => {
        that.websocket.send = (message, callback) => {
          callback(new Error());
        };

        bot.websocket = that.websocket;
        bot.messageCount.should.equal(1);

        bot.send({
          text: 'Hello world',
          channel: 'TEST_CHANNEL'
        }).should.be.rejected;

        bot.messageCount.should.not.equal(2);
      });
  });

  it('should start conversation properly', () => {
    return this.instance
      .connect()
      .then((bot) => {
        bot.startConversation.should.exist;
        bot.conversations.should.be.an.instanceof(Array);
        bot.conversations.should.have.length(0);

        return bot
          .startConversation('CHANNEL', 'USER')
          .then((conversation) => {
            bot.conversations.should.have.length(1);

            conversation.channel.should.equal(bot.conversations[bot.conversations.length - 1].channel);
            conversation.user.should.equal(bot.conversations[bot.conversations.length - 1].user);
          });
      });
  });

  it('should not start conversation if it already exist', () => {
    return this.instance
      .connect()
      .then((bot) => {
        bot.conversations.should.have.length(0);

        return bot
          .startConversation('CHANNEL', 'USER')
          .then((conversation) => {
            bot.conversations.should.have.length(1);

            return bot.startConversation('CHANNEL', 'USER').should.be.rejected;
          });
      });
  })
});
