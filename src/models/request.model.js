const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestSchema = new mongoose.Schema({
  created: Date,
  author: { type: Schema.Types.ObjectId, ref: 'user' },
  receiver: { type: Schema.Types.ObjectId, ref: 'user' },
});

const request = mongoose.model("request", requestSchema);

module.exports = request;
