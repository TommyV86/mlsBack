const { MongoClient } = require('mongodb')

const dbURI =
  "mongodb+srv://MLS:mlsproject@projetmls.ohrb3.mongodb.net/test?authSource=admin&replicaSet=atlas-ghh06l-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true";

module.exports = { MongoClient, dbURI }