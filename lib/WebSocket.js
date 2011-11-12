/*!
 * WebSocket
 * Copyright(c) 2011 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */

var util = require('util')
  , events = require('events')
  , http = require('http')
  , crypto = require('crypto')
  , url = require('url')
  , fs = require('fs')
  , Sender = require('./Sender')
  , Receiver = require('./Receiver');

/**
 * Constants
 */

var protocolPrefix = "HyBi-";
var protocolVersion = 13;

/**
 * WebSocket implementation
 */

function WebSocket(address, options) {
    var serverUrl = url.parse(address);
    if (!serverUrl.host) throw 'invalid url';
    
    options = options || {};
    options.origin = options.origin || null;
    options.protocolVersion = options.protocolVersion || protocolVersion;
    if (options.protocolVersion != 8 && options.protocolVersion != 13) {
        throw 'unsupported protocol version';
    }

    var key = new Buffer(protocolPrefix + options.protocolVersion).toString('base64');
    var shasum = crypto.createHash('sha1');
    shasum.update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
    var expectedServerKey = shasum.digest('base64');

    var requestOptions = {
        port: serverUrl.port || 80,
        host: serverUrl.hostname,
        path: serverUrl.path || '/',
        headers: {
            'Connection': 'Upgrade',
            'Upgrade': 'websocket',
            'Sec-WebSocket-Version': options.protocolVersion,
            'Sec-WebSocket-Key': key
        }
    };
    if (options.origin) {
        if (options.protocolVersion < 13) requestOptions.headers['Sec-WebSocket-Origin'] = options.origin;
        else requestOptions.headers.origin = options.origin;
    }
    var req = http.request(requestOptions);
    req.end();
    this._socket = null;
    this._state = 'connecting';
    var self = this;
    req.on('upgrade', function(res, socket, upgradeHead) {
        if (self._state == 'disconnected') {
            // client disconnected before server accepted connection
            self.emit('disconnected');
            socket.end();
            return;
        }
        var serverKey = res.headers['sec-websocket-accept'];
        if (typeof serverKey == 'undefined' || serverKey !== expectedServerKey) {
            self.emit('error', 'invalid server key');
            socket.end();
            return;
        }
        
        self._socket = socket;
        socket.setTimeout(0);
        socket.setNoDelay(true);
        socket.on('close', function() {
            self._state = 'disconnected';
            self.emit('disconnected');
        });

        var receiver = new Receiver();
        socket.on('data', function (data) {
            receiver.add(data);
        });

        self._sender = new Sender(socket);
        receiver.on('text', function (data, flags) {
            flags = flags || {};
            self.emit('data', data, flags);
        });
        receiver.on('binary', function (data, flags) {
            flags = flags || {};
            flags.binary = true;
            self.emit('data', data, flags);
        });

        self._state = 'connected';
        self.emit('connected');
    });
}

/**
 * Inherits from EventEmitter.
 */

util.inherits(WebSocket, events.EventEmitter);

WebSocket.prototype.close = function(data, options) {
    if (this._state != 'connected') throw 'not connected';
    try {
        this._sender.close(data, options);
        this.terminate();    
    }
    catch (e) {
        this.emit('error', e);
    }
}

WebSocket.prototype.ping = function(data, options) {
    if (this._state != 'connected') throw 'not connected';
    try {
        this._sender.ping(data, options);
    }
    catch (e) {
        this.emit('error', e);
    }
}

WebSocket.prototype.pong = function(data, options) {
    if (this._state != 'connected') throw 'not connected';
    try {
        this._sender.pong(data, options);
    }
    catch (e) {
        this.emit('error', e);
    }
}

WebSocket.prototype.send = function(data, options, cb) {
    if (this._state != 'connected') throw 'not connected';
    if (!data) throw 'cannot send empty data';
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }
    options = options || {};
    options.fin = true;
    if (data instanceof fs.ReadStream) {
        sendStream.bind(this, data, options, cb)();
    }
    else {
        try {
            this._sender.send(data, options, cb);
        }
        catch (e) {
            this.emit('error', e);
        }        
    }
}

WebSocket.prototype.stream = function(options, cb) {
    if (this._state != 'connected') throw 'not connected';
    if (typeof options === 'function') {
        cb = options;
        options = {};
    }
    var self = this;
    var send = function(data, final) {
        options.fin = final === true;
        self._sender.send(data, options);
        if (!final) process.nextTick(cb.bind(null, send));
    }
    process.nextTick(cb.bind(null, send));
}

WebSocket.prototype.terminate = function() {
    if (this._socket) {
        this._socket.end();
        this._socket = null;
    }
    else if (this._state == 'connecting') {
        this._state = 'disconnected';
    }
}

module.exports = WebSocket;

/**
 * Entirely private apis, 
 * which may or may not be bound to a sepcific WebSocket instance.
 */

function sendStream(data, options, cb) {
    var self = this;
    data.on('data', function(data) {
        try {
            options.fin = false;
            self._sender.send(data, options);
        }
        catch (e) {
            self.emit('error', e);
        }
    });
    data.on('end', function() {
        try {
            options.fin = true;
            self._sender.send(null, options);
            if (typeof cb === 'function') cb(null);
        }
        catch (e) {
            self.emit('error', e);
        }            
    });
}