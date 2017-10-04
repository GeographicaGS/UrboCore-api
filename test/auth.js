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

var request = require('supertest');
var app = require('../app.js');
var should = require('chai').should() //actually call the function;

var token;

function reqAccessToken(email) {

  return function(done) {
    var users =  app.get('config').test.users;

    var user = users.find(function(u) {
      return u.email === email;
    });

    if (!user) {
      throw new Error('Not found user ' + email);
    }

    request(app)
    .post('/auth/token/new')
    .set('Accept', 'application/json')
    .send(user)
    .expect('Content-Type', /json/)
    .expect(200)
    .expect(function(res) {
      token = res.body.token;
    })
    .end(done);
  }
}

function getAccessToken() {
  return token;
}

module.exports.reqAccessToken = reqAccessToken;
module.exports.getAccessToken = getAccessToken;
