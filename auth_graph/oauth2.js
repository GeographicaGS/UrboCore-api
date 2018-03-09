// Copyright 2017 Telefónica Digital España S.L.
// 
// This file is part of UrboCore API.
// 
// UrboCore API is free software: you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// UrboCore API is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
// General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with UrboCore API. If not, see http://www.gnu.org/licenses/.
// 
// For those usages not covered by this license please contact with
// iot_support at tid dot es

'use strict';

var querystring = require('querystring');
var https = require('https');
var http = require('http');
var URL = require('url');

exports.OAuth2 = function(client_id, client_secret, base_site, authorize_path, access_token_path, callback_url, custom_headers) {
  this.client_id = client_id;
  this.client_secret = client_secret;
  this.base_site = base_site;
  this.authorize_url = authorize_path || '/oauth2/authorize';
  this.access_token_url = access_token_path || '/oauth2/token';
  this.callback_url = callback_url;
  this.access_token_name = 'access_token';
  this.auth_method = 'Basic';
  this.custom_headers = custom_headers || {};
}

exports.OAuth2.prototype.setAccessTokenName = function (name) {
  this.access_token_name = name;
}

exports.OAuth2.prototype.getAccessTokenUrl = function() {
  return this.base_site + this.access_token_url;
}

// Build the authorization header. In particular, build the part after the colon.
// e.g. Authorization: Bearer <token>  # Build "Bearer <token>"
exports.OAuth2.prototype.buildAuthHeader= function() {
  var key = this.client_id + ':' + this.client_secret;
  var base64 = (new Buffer(key)).toString('base64');
  return this.auth_method + ' ' + base64;
};

exports.OAuth2.prototype.request= function(method, url, headers, post_body, access_token, callback) {

  var http_library= https;
  var parsedUrl= URL.parse( url, true );
  if (parsedUrl.protocol === 'https:' && !parsedUrl.port) {
    parsedUrl.port= 443;
  }

  // As this is OAUth2, we *assume* https unless told explicitly otherwise.
  if (parsedUrl.protocol !== 'https:') {
    http_library = http;
  }

  var realHeaders = {};
  for (var key in this.custom_headers) {
    realHeaders[key] = this.custom_headers[key];
  }
  if (headers) {
    for (var key in headers) {
      realHeaders[key] = headers[key];
    }
  }
  realHeaders['Host'] = parsedUrl.host;

  //realHeaders['Content-Length']= post_body ? Buffer.byteLength(post_body) : 0;
  if (access_token && !('Authorization' in realHeaders)) {
    if (!parsedUrl.query) parsedUrl.query= {};
    parsedUrl.query[this.access_token_name]= access_token;
  }

  var queryStr = querystring.stringify(parsedUrl.query);
  if (queryStr)
    queryStr =  '?' + queryStr;
  var options = {
    host:parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,
    method: method,
    headers: realHeaders
  };

  this.executeRequest( http_library, options, post_body, callback );
}

exports.OAuth2.prototype.executeRequest= function( http_library, options, post_body, callback ) {
  var allowEarlyClose = options.host && options.host.match('.*google(apis)?.com$');
  var callbackCalled = false;
  function passBackControl( response, result ) {
    if (!callbackCalled) {
      callbackCalled = true;
      if (response.statusCode !== 200 && (response.statusCode !== 301) && (response.statusCode !== 302) ) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(null, result, response);
      }
    }
  }

  var result= '';

  var request = http_library.request(options, function (response) {
    response.on('data', function (chunk) {
      result += chunk
    });
    response.on('close', function (err) {
      if (allowEarlyClose) {
        passBackControl( response, result );
      }
    });
    response.addListener('end', function () {
      passBackControl( response, result );
    });
  });
  request.on('error', function(e) {
    callbackCalled= true;
    callback(e);
  });

  if (options.method === 'POST' && post_body) {
    request.write(post_body);
  }
  request.end();  
}

exports.OAuth2.prototype.getAuthorizeUrl= function(response_type) {
  response_type = response_type || 'code';
  return this.base_site + this.authorize_url + '?response_type=' + response_type + '&client_id=' + this.client_id +  '&state=xyz&redirect_uri=' + this.callback_url;
}

exports.OAuth2.prototype.getOAuthAccessToken= function(code, callback) {
  var post_data = 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + this.callback_url;
  var post_headers= {
    'Authorization': this.buildAuthHeader(),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': post_data.length,
  };

  this.request('POST', this.getAccessTokenUrl(), post_headers, post_data, null, function(error, data) {
    if (error) {
      callback(error);
    } else {
      var results;
      try {
        // As of http://tools.ietf.org/html/draft-ietf-oauth-v2-07
        // responses should be in JSON...
        results = JSON.parse(data);
      } catch (e) {
        // .... However both Facebook + Github currently use rev05 of the spec
        // and neither seem to specify a content-type correctly in their response headers :(
        // clients of these services will suffer a *minor* performance cost of the exception
        // being thrown
        results = querystring.parse(data);
      }
      callback(null, results);
    }
  });
}

exports.OAuth2.prototype.get= function(url, access_token, callback) {
  this.request('GET', url, {}, '', access_token, callback);
}