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
