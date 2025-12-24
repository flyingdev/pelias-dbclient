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
 *
 * ⚠️ Config note:
 * We reuse the existing `esclient` block from pelias.json for both Elasticsearch
 * and OpenSearch. This avoids introducing a new `osclient` key.
 * If Pelias were being designed from scratch today, a dedicated `osclient` key
 * would likely be cleaner — but `esclient` works for both backends.
 *
 * Selection rules:
 * - If PELIAS_OPENSEARCH=true → use OpenSearch
 *   - Prefer OPENSEARCH_NODE env var
 *   - Else fall back to esclient.hosts[0] in pelias.json
 * - Else → use Elasticsearch with full esclient config
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
