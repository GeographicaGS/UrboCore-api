'use strict';

var utils = require('../utils');
var log = utils.log();
var WebSocket = require('ws');

let instance = null;

class Socket {

  constructor(options) {
    if (!instance) {
      this.AUTH_INVALID_CODE = 1002;

      this._wss = new WebSocket.Server(options);
      log.info('Socket opened');

      this._wss.on('connection', (ws) => {
        log.debug('Client connected to the socket');
        ws.on('message', this._onReceive(ws));
      });

      instance = this;
    }

    return instance;
  }

  close() {
    this._wss.close();
    log.info('Socket closed');
  }

  // TODO: Here we need to implement the namespaces logic
  send(namespace, data) {
    var message = {
      namespace: namespace,
      data: data
    };

    message = JSON.stringify(message);

    this._wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, (err) => {
          if (err) {
            log.error('Couldn\'t deliver message to the socket');
            log.error(err);
          }
        });
      }
    });
  }

  // TODO: Here we need to implement the auth and the namespaces logic
  _onReceive(ws) {
    return (message) => {
      try {
        message = JSON.parse(message);  // Only accepts JSONs
        if (message.auth) {  // TODO: Enter here only if the user is not logged
          log.debug('auth');
          // TODO: An error here should execute `ws.close(this.AUTH_INVALID_CODE);`
        }

        if (message.subscribe) {
          log.debug('subscribe');
        }

        if (message.unsubscribe) {
          log.debug('unsubscribe');
        }

        log.debug(message);

      } catch (err) {
        log.error('Couldn\'t receive message from the socket');
        log.error(err);
      }
    };
  }

}

module.exports = Socket;
