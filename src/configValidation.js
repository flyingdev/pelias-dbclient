const Joi = require('@hapi/joi');
const createDbClient = require('./client');

// Schema Configuration
// dbclient.statFrequency: populated by defaults if not overridden
const schema = Joi.object().keys({
  dbclient: Joi.object().required().keys({
    engine: Joi.string().valid('opensearch').required(),  // Ensure it only accepts 'opensearch'
    hosts: Joi.array().items(
      Joi.object().keys({
        protocol: Joi.string().valid('http', 'https').required(),
        host: Joi.string().required(),
        port: Joi.number().integer().min(1).required()  // Ensure port is a valid number
      })
    ).required()
  }),
  schema: Joi.object().keys({
    indexName: Joi.string().required()
  })
}).unknown(true);

module.exports = {
  validate: function validate(config) {
    const validate = schema.validate(config);
    if (validate.error) {
      throw new Error(validate.error.details[0].message);
    }

    // now verify that the index exists
    const dbclient = createDbClient();

    // callback that throws an error if the index doesn't exist
    const existsCallback = (error, exists) => {
      if (error) {
        console.error(`ERROR: Failed to check if OpenSearch index ${config.schema.indexName} exists.`);
        console.error('For full instructions on setting up Pelias, see http://pelias.io/install.html');
        throw error;
      }

      if (!exists) {
        console.error(`ERROR: OpenSearch index ${config.schema.indexName} does not exist`);
        console.error('You must use the pelias-schema tool (https://github.com/pelias/schema/) to create the index first');
        console.error('For full instructions on setting up Pelias, see http://pelias.io/install.html');
        throw new Error(`OpenSearch index ${config.schema.indexName} does not exist`);
      }
    };

    // can also be done with promises but it's hard to test mixing the paradigms
    dbclient.indices.exists({ index: config.schema.indexName }, existsCallback);
  }
};
