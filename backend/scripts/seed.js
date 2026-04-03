const mongoose = require('mongoose');
require('dotenv').config();
const VocabMountain = require('../models/VocabMountain');

const sampleWords = [
  {
    word: 'abound',
    definition: 'to exist in great quantities',
    synonyms: ['teem', 'overflow', 'proliferate'],
    examples: ['The forest abounds with wildlife.', 'Opportunities abound in this field.']
  },
  {
    word: 'adulterate',
    definition: 'to make impure by adding inferior materials',
    synonyms: ['contaminate', 'dilute', 'pollute'],
    examples: ['They adulterate the wine with water.', 'The product was adulterated with harmful chemicals.']
  },
  {
    word: 'abate',
    definition: 'to reduce in amount, degree, or intensity',
    synonyms: ['subside', 'diminish', 'lessen'],
    examples: ['The storm finally abated.', 'The pain will abate over time.']
  },
  {
    word: 'abstain',
    definition: 'to refrain from doing something',
    synonyms: ['refrain', 'forbear', 'desist'],
    examples: ['He decided to abstain from alcohol.', 'Many voters chose to abstain.']
  },
  {
    word: 'aloof',
    definition: 'distant, reserved, or indifferent',
    synonyms: ['distant', 'detached', 'reserved'],
    examples: ['She remained aloof from the group.', 'His aloof manner made him seem unfriendly.']
  },
  {
    word: 'admonish',
    definition: 'to warn or reprimand firmly',
    synonyms: ['reprimand', 'rebuke', 'scold'],
    examples: ['The teacher admonished the student.', 'He was admonished for his behavior.']
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing mountains
    await VocabMountain.deleteMany({});
    console.log('Cleared existing mountains');

    // Create sample vocab mountain
    const sampleMountain = new VocabMountain({
      name: 'Sample GRE Vocab Mountain',
      description: 'A sample vocabulary mountain with common GRE words',
      isDefault: true,
      totalDays: 34,
      groups: [
        {
          groupNumber: 1,
          words: sampleWords.slice(0, 2)
        },
        {
          groupNumber: 2,
          words: sampleWords.slice(2, 4)
        },
        {
          groupNumber: 3,
          words: sampleWords.slice(4, 6)
        }
      ]
    });

    await sampleMountain.save();
    console.log('Created sample vocab mountain:', sampleMountain.name);
    console.log('Mountain ID:', sampleMountain._id);

    await mongoose.connection.close();
    console.log('Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
