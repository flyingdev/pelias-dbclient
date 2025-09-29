const { Client: ESClient } = require('@elastic/elasticsearch');
const { Client: OSClient } = require('@opensearch-project/opensearch');
const settings = require('pelias-config').generate();

module.exports = function() {
  if (process.env.PELIAS_OPENSEARCH === 'true') {
    // Prefer explicit env var
    let node = process.env.OPENSEARCH_NODE;

    // Fallback: build from pelias config
    if (!node && settings.esclient?.hosts?.[0]) {
      const { protocol, host, port } = settings.esclient.hosts[0];
      node = `${protocol}://${host}:${port}`;
    }

    if (!node) {
      throw new Error('No OpenSearch node URL found. Please set OPENSEARCH_NODE or configure esclient.hosts.');
    }

    return new OSClient({ node });
  }

  // Default: Elasticsearch client
  return new ESClient(settings.esclient || {});
};
