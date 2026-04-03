# Vocab Mountain

A vocabulary learning application inspired by GregMat's Vocab Mountain feature. This application allows users to learn vocabulary words through an interactive mountain-based system, track their progress, and create custom vocab mountains.

## Features

- **Interactive Word Learning**: Navigate through words, view definitions, mark words as known/forgotten
- **Progress Tracking**: Track your progress by day and word status
- **Custom Vocab Mountains**: Create your own vocab mountains with custom words and groups
- **Word Management**: Add and remove words from any group
- **Settings**: Customize your learning experience with various settings
- **Speech Synthesis**: Listen to word pronunciations
- **Filtering & Sorting**: Filter words by status and sort alphabetically

## Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Styling**: Custom CSS with modern gradient design

## Project Structure

```
Vocab Learner/
├── backend/
│   ├── models/
│   │   ├── VocabMountain.js
│   │   └── UserProgress.js
│   ├── routes/
│   │   ├── mountains.js
│   │   ├── words.js
│   │   └── progress.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VocabMountain.js
│   │   │   ├── VocabMountain.css
│   │   │   ├── MountainList.js
│   │   │   ├── MountainList.css
│   │   │   ├── CreateMountain.js
│   │   │   └── CreateMountain.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (if needed)
   - Edit `.env` and add your MongoDB connection string:
     ```
     MONGODB_URI=your-mongodb-connection-string-here
     PORT=5000
     ```
   - For local MongoDB: `mongodb://localhost:27017/vocab-mountain`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/vocab-mountain?retryWrites=true&w=majority`

4. (Optional) Seed the database with sample data:
   ```bash
   npm run seed
   ```
   This will create a sample vocab mountain with some example words.

5. Start the backend server:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Usage

1. **Create a Vocab Mountain**: Click "Create New Mountain" on the home page
2. **Add Words**: Navigate to a mountain and click "Add Word" in any group
3. **Learn Words**: Click on words to view definitions, use navigation buttons to move between words
4. **Track Progress**: Mark words as "I knew this" (G) or "I forgot this" (R)
5. **Filter Words**: Use the filter dropdown to show only known, forgotten, or unknown words
6. **Reset Progress**: Use reset buttons to reset individual words, days, or everything

## API Endpoints

### Mountains
- `GET /api/mountains` - Get all vocab mountains
- `GET /api/mountains/:id` - Get a specific mountain
- `POST /api/mountains` - Create a new mountain
- `PUT /api/mountains/:id` - Update a mountain
- `DELETE /api/mountains/:id` - Delete a mountain

### Words
- `POST /api/words/:mountainId/:groupNumber` - Add a word to a group
- `PUT /api/words/:mountainId/:groupNumber/:wordIndex` - Update a word
- `DELETE /api/words/:mountainId/:groupNumber/:wordIndex` - Delete a word

### Progress
- `GET /api/progress/:mountainId` - Get user progress
- `PATCH /api/progress/:mountainId/day` - Update current day
- `PATCH /api/progress/:mountainId/word-status` - Update word status
- `PATCH /api/progress/:mountainId/reset-word` - Reset a word
- `PATCH /api/progress/:mountainId/reset-day` - Reset a day
- `PATCH /api/progress/:mountainId/reset-all` - Reset all progress
- `PATCH /api/progress/:mountainId/settings` - Update settings

## Environment Variables

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (default: 5000)

## Notes

- The application uses a single-user model. For multi-user support, you would need to add authentication.
- Word statuses are stored per mountain, allowing different progress for different vocab mountains.
- The color scheme uses a modern gradient design with purple/blue tones, different from the original GregMat design.

## License

ISC
