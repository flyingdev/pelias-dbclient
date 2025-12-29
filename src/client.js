const { Client: ESClient } = require('elasticsearch');
const { Client: OSClient } = require('@opensearch-project/opensearch');
const peliasConfig = require('pelias-config').generate();

function getDatabaseConfig() {
  const config = peliasConfig.get('dbclient') || peliasConfig.get('esclient');
  
  if (!config) {
    throw new Error('Database configuration missing in pelias.json');
  }

  const engine = config.engine || (process.env.PELIAS_OPENSEARCH === 'true' ? 'opensearch' : 'elasticsearch');

  return { ...config, config, engine };
}
/**
 * Factory for creating a search client.
 */
module.exports = function createDbClient() {
  const { engine, config, hosts } = getDatabaseConfig();
  if (engine === 'opensearch') {
    if (!hosts || hosts.length == 0) {
      throw new Error(
        '[api] No node URL found. Please configure dbclient.hosts in pelias.json.'
      );
    }
    const hostConfig = hosts[0];
    const { protocol, host, port } = hostConfig;
    const node = `${protocol}://${host}:${port}`;

    console.log(`[dbclient] Using OpenSearch node: ${node}`);
    return new OSClient({ node });
  }

  // Default: Elasticsearch
  console.log('[dbclient] Using Elasticsearch config from pelias.json');
  return new ESClient(config || {});
};
