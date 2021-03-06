![SourceBot Framework](https://avatars0.githubusercontent.com/u/21346235?v=3&s=200)

SourceBot
==

[![David](https://img.shields.io/david/sourcebot/sourcebot.svg)](https://david-dm.org/sourcebot/sourcebot)
[![Code Climate](https://codeclimate.com/github/sourcebot/sourcebot/badges/gpa.svg)](https://codeclimate.com/github/sourcebot/sourcebot)
[![Build Status](https://travis-ci.org/sourcebot/sourcebot.svg?branch=master)](https://travis-ci.org/sourcebot/sourcebot)
[![Coverage Status](https://coveralls.io/repos/github/sourcebot/sourcebot/badge.svg)](https://coveralls.io/github/sourcebot/sourcebot)
[![Greenkeeper badge](https://badges.greenkeeper.io/sourcebot/sourcebot.svg)](https://greenkeeper.io/)


SourceBot is a platform independent chat bot framework. It aims to connect Facebook Messenger, Slack and Skype with the same code.

Benefits of SourceKit:
- Uses EcmaScript 6 class architecture.
- Easily debuggable.
- Uses Promises, catches uncaught exceptions on the way.

In order to install:

```
npm install sourcebot --save
```

In order to debug (Example):
```
DEBUG=* node index.js
```
* For Windows: Before running the app, run this command in order to debug: ```set Debug=slack:core,slack:websocket,slack:conversation```

[![sourcebot_cmd.jpg](https://s14.postimg.org/o7rf82ki9/sourcebot_cmd.jpg)](https://postimg.org/image/bt4n7qszx/)

Examples
==

### Typical 'hello world':

```javascript
let SlackCore = require('sourcebot').Slack;
let SlackBot = new SlackCore({
  token: 'xoxb-17065016470-0O9T0P9zSuMVEG8yM6QTGAIB'
});


SlackBot
  .connect()
  .then((bot) => {
    bot
      .listen('hello', (response) => {
        bot.send({
          channel: response.channel,
          text: 'world'
        });
      })
  })
  .catch((err) => console.error(err.message))
```

### An example conversation:

```javascript
SlackBot
  .connect()
  .then((bot) => {
    bot
      .listen(new RegExp('start convo', 'i'), (response) => {

        bot
          .startConversation(response.channel, response.user)
          .then((conversation) => {
            return conversation
              .ask('How are you?')
              .then((reply) => {
                return conversation
                  .say('Good!')
                  .then(() => {
                    return conversation.ask('What are you doing now?')
                  })
                  .then((response) => {
                    return conversation.askSerial(['What?', 'Where?', 'When?']);
                  })
              })
          });
      })
  }).catch((err) => console.error(err.message));
```

### An example private conversation


```javascript
SlackBot
  .connect()
  .then((bot) => {
    bot
      .listen(new RegExp('start convo', 'i'), (response) => {
        bot
          .startPrivateConversation(response.user)
          .then((conversation) => {
            conversation
              .ask('Hello world')
              .then((response) => {
                conversation.say('You said ' + response.text);
              })
          })
      })
  }).catch((err) => console.error(err.message));

```

### Query Slack's API

```javascript
SlackBot
  .connect()
  .then((bot) => {
    bot
      .listen(new RegExp('start convo', 'i'), (response) => {

        SlackBot
          .requestSlack()
          .getChannelInfo(response.channel)
          .then((channelInfo) => {
            bot.send({
              channel: response.channel,
              text: 'Wow, wow, wow! We have ' + channelInfo.channel.members.length + ' users in here!'
            });

            const tasks = channelInfo.channel.members.map((member) => {
              return SlackBot.requestSlack().getUserInfo(member)
            });

            Promise
              .all(tasks)
              .then((users) => {
                users.forEach((item) => {
                  bot.send({
                    channel: response.channel,
                    text: 'Welcome <@' + item.user.id +'|' + item.user.name +'>, I\'ve missed you!'
                  });
                })
              })
          })
      })
  }).catch((err) => console.error(err.message));
```

#### Ask series of questions



```javascript
SlackBot
  .connect()
  .then((bot) => {
    bot
      .listen(new RegExp('start convo', 'i'), (response) => {

        bot
          .startConversation(response.channel, response.User)
          .then((conversation) => {
            return conversation
              .askSerial([
                {
                  text: 'How are you?',
                  replyPattern: new RegExp('\\bfine\\b', 'i') //Asks until the given response contains 'fine'.
                },
                {
                  text: 'Where are you?',
                  replyPattern: new RegExp('\\bistanbul\\b', 'i'),
                  callback: (faultyReply) => { //Fires up if the response does not contain 'istanbul'.
                    return conversation.say('Please indicate your city.');
                  }
                }
              ]).then((responses) => {
                console.log(responses);
              });
          });
      })
  }).catch((err) => console.error(err.message));
```



Methods
===
#### SlackBot
* ```constructor(opts)```
   * Constructs the SlackCore class with ```opts.token```
   * If ```opts.debug``` is defined, SlackBot will enter in debug mode.
* ```connect()```
   * Connects to Slack Web API
* ```requestSlack()```
   * Returns Slack API endpoint.
        * ```rtmStart()```
        * ```getChannelInfo(channelId)```
        * ```getUserInfo(userId)```
        * ```openDirectMessageChannel(userId)```

#### Bot
* ```listen(message, callback)```
  * Listens for the message. The message can be an instance of RegExp or a plain String. Returns promise containing the response.
* ```send(opts)```
  * Sends a message to specified channel, Takes ```opts``` object as a parameter containing text and channel fields. Returns empty promise.
* ```startConversation(channelName, userId)```
  * Starts a conversation with the specified user in a specified channel. Takes user's slack id and the id of the channel. Returns promise containing a ```conversation``` object.
* ```startPrivateConversation(user)```
  * Starts private conversation between a user. Returns promise containing a ```conversation``` object.
* ```disconnect()```
  * Disconnects and removes all event listeners.

#### Conversation
* ```ask(opts||message, callback)```
  * Sends the given ```opts``` Object or  ```question``` String and waits for a response. If ```opts.replyPattern``` is provided asks until the RegExp test succeeds, fires callback upon faulty replies with the ```faultyReply```. Returns a promise containing the ```response```.
  * ```let opts = {text: 'Question', replyPattern: new RegExp('')}```
* ```say(message)```
  * Sends the given String ```message```. Returns empty promise.
* ```askSerial(opts)```
  * Behaves same as ```ask()``` but this method takes an array of objects that are asked sequentially.
```javascript
let opts = {
   text: 'Question',
   replyPattern: new RegExp(''),
   callback: (faultyReply) => {
     return Promise.resolve()
   }
 }
```


The MIT License
===
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
