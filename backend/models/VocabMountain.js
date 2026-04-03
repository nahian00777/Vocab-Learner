const mongoose = require('mongoose');

const VocabMountainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  totalDays: {
    type: Number,
    default: 34
  },
  groups: [{
    groupNumber: {
      type: Number,
      required: true
    },
    words: [{
      word: {
        type: String,
        required: true,
        trim: true
      },
      definition: {
        type: String,
        required: true
      },
      synonyms: [{
        type: String
      }],
      examples: [{
        type: String
      }]
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

VocabMountainSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('VocabMountain', VocabMountainSchema);
