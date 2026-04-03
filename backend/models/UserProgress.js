const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  mountainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VocabMountain',
    required: true
  },
  currentDay: {
    type: Number,
    default: 1
  },
  wordStatuses: [{
    word: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['unknown', 'known', 'forgotten'],
      default: 'unknown'
    },
    dayLearned: {
      type: Number
    }
  }],
  settings: {
    closeDefinitionOnNavigation: {
      type: Boolean,
      default: false
    },
    centerDefinition: {
      type: Boolean,
      default: true
    },
    showPreviousDayColor: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

UserProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
