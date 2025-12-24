'use strict';

const configValidation = require('../src/configValidation');
const proxyquire = require('proxyquire').noCallThru();
const intercept = require('intercept-stdout');

module.exports.tests = {};

module.exports.tests.validate = function(test, common) {
  test('config without dbclient should throw error', function(t) {
    var config = {
      schema: {
        indexName: 'example_index'
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient" is required/, 'dbclient should exist');
    t.end();
  });

  test('config with invalid dbclient.engine should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'elasticsearch',
        hosts: [{ "protocol": "http", "host": "opensearch", "port": 9200 }]
      },
      schema: {
        indexName: 'example_index'
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient.engine" must be \[opensearch\]/, 'dbclient.engine should be "opensearch"');
    t.end();
  });

  test('config without dbclient.hosts should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch'
      },
      schema: {
        indexName: 'example_index'
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient.hosts" is required/, 'dbclient.hosts should exist');
    t.end();
  });

  test('config with invalid dbclient.hosts structure should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch',
        hosts: [{ "protocol": "http", "host": "opensearch" }]  // Missing port
      },
      schema: {
        indexName: 'example_index'
      }
    };

    // Expect an error to be thrown with the correct message
    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient.hosts\[0\].port" is required/, 'dbclient.hosts[0].port is required');
    t.end();
  });

  test('config with non-integer dbclient.port should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch',
        hosts: [{ "protocol": "http", "host": "opensearch", "port": 'not-a-number' }]  // Non-integer port
      },
      schema: {
        indexName: 'example_index'
      }
    };

    // Expect an error to be thrown with the correct message
    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient.hosts\[0\].port" must be a number/, 'dbclient.hosts[0].port should be a number');
    t.end();
  });

  test('config with non-string dbclient.host should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch',
        hosts: [{ "protocol": "http", "host": 123, "port": 9200 }]
      },
      schema: {
        indexName: 'example_index'
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient.hosts\[0\].host" must be a string/, 'dbclient.hosts.host should be a string');
    t.end();
  });

  test('config with invalid protocol should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch',
        hosts: [{ "protocol": "ftp", "host": "opensearch", "port": 9200 }]
      },
      schema: {
        indexName: 'example_index'
      }
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"dbclient.hosts\[0\].protocol" must be one of \[http, https\]/, 'dbclient.hosts.protocol should be either "http" or "https"');
    t.end();
  });

  test('config with valid engine and hosts should pass validation', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch',
        hosts: [{ "protocol": "http", "host": "opensearch", "port": 9200 }]
      },
      schema: {
        indexName: 'example_index'
      }
    };

    t.doesNotThrow(() => {
      proxyquire('../src/configValidation', {
        'dbclient': {
          Client: function() {
            return { indices: { exists: (indexName, cb) => { cb(false, true); } } };
          }
        }
      }).validate(config);
    }, 'valid config should not throw an error');
    t.end();
  });

  test('non-existent index should throw error', function(t) {
    var config = {
      dbclient: {
        engine: 'opensearch',
        hosts: [{ "protocol": "http", "host": "localhost", "port": 9200 }]
      },
      schema: {
        indexName: 'example_index'
      }
    };

    var stderr = '';

    // intercept/swallow stderr
    var unhook_intercept = intercept(function() {}, function(txt) { stderr += txt; return ''; });

    // Mock the behavior to throw an error explicitly
    t.throws(function() {
      proxyquire('../src/configValidation', {
        './client': function() {
          return {
            indices: {
              exists: ({index}, cb) => {
                cb(new Error(`opensearch index ${index} does not exist`));
              }
            }
          };
        }
      }).validate(config);
    }, /opensearch index example_index does not exist/, 'Should throw the error for non-existent index');

    t.ok(stderr.match(/ERROR: opensearch index example_index does not exist/));
    unhook_intercept();
    t.end();
  });

};
module.exports.all = function(tape, common) {
  function test(name, testFunction) {
    return tape('configValidation: ' + name, testFunction);
  }

  for (var testCase in module.exports.tests) {
    module.exports.tests[testCase](test, common);
  }
};
