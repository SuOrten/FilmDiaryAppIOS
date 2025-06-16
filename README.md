# Movie Journal App

A React Native mobile application for tracking and managing your movie watching experience. Create lists, add reviews, and keep track of your favorite films.

## Features

- Register/Login
- Create and manage movie lists
- Search movies using TMDB API
- Add movies to lists
- Write and edit reviews
- Profile management
- Responsive and modern UI

## Tech Stack

- Frontend: React Native with Expo
- Backend: Node.js with Express
- Database: Microsoft SQL Server
- Movie Data: TMDB API

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Microsoft SQL Server
- Expo CLI
- TMDB API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/SuOrten/FilmDiaryAppIOS.git
cd FilmDiaryAppIOS
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. Set up environment variables:

Create `.env` file in the root directory:
```
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
EXPO_PUBLIC_BACKEND_URL=http://localhost:5001
```

Create `.env` file in the backend directory:
```
DB_SERVER=localhost
DB_NAME=MovieJournalDB
DB_INSTANCE=your_instance_name
PORT=5001
```

4. Set up the database:
- Run the SQL scripts in `backend/database.sql` to create the database and tables

5. Start the backend server:
```bash
cd backend
npm start
```

6. Start the frontend:
```bash
# In the root directory
npm start
```
