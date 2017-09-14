'use strict';

var request = require('supertest');
var app = require('../app.js');

describe('MAIN', function() {
  it('respond with URBO API', function(done) {
    request(app).get('/').expect('URBO API v1', done);
  });
});
