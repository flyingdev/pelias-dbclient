const elasticsearch = require('elasticsearch');

module.exports = function(){
  return new elasticsearch.Client( settings.esclient || {} );
};

const { Client: ESClient } = require('@elastic/elasticsearch');
const { Client: OSClient } = require('@opensearch-project/opensearch');
const settings = require('pelias-config').generate();

// Switch based on config or environment
let client;
if (process.env.PELIAS_OPENSEARCH === 'true') {
  client = new OSClient(settings.esclient || {});
} else {
  client = new ESClient( settings.esclient || {} );
}

module.exports = client;
