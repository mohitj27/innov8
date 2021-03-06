const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Promise = require('bluebird');
Promise.promisifyAll(mongoose);
const deepPopulate = require('mongoose-deep-populate')(mongoose);

//= ===Result Schmea====
var resultSchema = new Schema({
  examTakenDate: {
    type: String,
    required: true,
  },
  testId: {
    type: String,
    default: -1,
  },

  mTotal: {
    type: String,
    required: true,
    default: '-1',
  },
  marks: { type: String, default: -1, },
  nCorrectAns: {
    type: String,
    required: true,
    default: '-1',
  },

  nIncorrectAns: {
    type: String,
    required: true,
    default: '-1',
  },

  nQuestionsAnswered: {
    type: String,
    required: true,
    default: '-1',
  },

  nQuestionsUnanswered: {
    type: String,
    required: true,
    default: '-1',
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
  },

});

resultSchema.plugin(deepPopulate);

// Result model
module.exports = mongoose.model('Result', resultSchema);
