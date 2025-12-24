>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias OpenSearch database client

This module provides a Node.js stream for bulk-inserting documents into [OpenSearch](https://opensearch.org/).

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/dbclient.svg)](https://greenkeeper.io/)

## Install Dependencies


```bash
$ npm install
```

## Usage
This module returns “streamFactory” —a function that produces a transforming stream. The stream puts documents into opensearch during import pipeline. Note: this stream triggers finish event only after all documents are stored into opensearch.


```javascript
'use strict';

// some_importer.js
const streamify = require('stream-array');
const through = require('through2');
const Document = require('pelias-model').Document;
const dbMapper = require('pelias-model').createDocumentMapperStream;
const dbclient = require('pelias-dbclient');

const { Client } = require('@opensearch-project/opensearch'); 
const config = require('pelias-config').generate();

const timestamp = Date.now();

const client = new Client(config.dbclient);

const stream = streamify([1, 2, 3])
  .pipe(through.obj((item, enc, next) => {
    const uniqueId = [ 'docType', item ].join(':'); // documents with the same id will be updated
    const doc = new Document( 'sourceType', 'venue', uniqueId );
    doc.timestamp = timestamp;
    next(null, doc);
  }))
  .pipe(dbMapper())
  .pipe(dbclient());

stream.on('finish', () => {
  const options = {
    index: config.schema.indexName,
    body: {
      query: {
        bool: {
          must: [
            { term: { "source": "sourceType" } }
          ],
          must_not: [
            { term: { "timestamp": timestamp } }
          ]
        }
      }
    }
  };

  client.deleteByQuery(options).then(response => {
    console.log('The elements deleted are:', response.body.deleted);
  }).catch(err => {
    console.error('Error deleting documents:', err);
  });
});


```

## Contributing

Please fork and pull request against upstream master on a feature branch.

Pretty please; provide unit tests and script fixtures in the `test` directory.

### Running Unit Tests

```bash
$ npm test
```

### Continuous Integration

CI tests every release against all currently supported Node.js versions.
