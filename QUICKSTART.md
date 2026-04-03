# Quick Start Guide

## Step 1: Install MongoDB

Make sure you have MongoDB installed and running, or have a MongoDB Atlas account.

## Step 2: Configure Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Edit the `.env` file and add your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/vocab-mountain
   ```
   Or for MongoDB Atlas:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vocab-mountain?retryWrites=true&w=majority
   ```

4. (Optional) Seed the database with sample data:
   ```bash
   npm run seed
   ```

5. Start the backend server:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```

## Step 3: Configure Frontend

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```

   The app will automatically open at `http://localhost:3000`

## Step 4: Use the Application

1. If you ran the seed script, you'll see a "Sample GRE Vocab Mountain" on the home page
2. Click on it to start learning
3. Or create your own custom vocab mountain by clicking "Create New Mountain"
4. Add words to groups, navigate through them, and track your progress!

## Troubleshooting

- **MongoDB Connection Error**: Make sure MongoDB is running and the connection string in `.env` is correct
- **Port Already in Use**: Change the PORT in `.env` if 5000 is already in use
- **CORS Errors**: Make sure the backend is running before starting the frontend
