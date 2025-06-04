# Movie Journal App

A mobile application for tracking and reviewing movies you've watched.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- SQL Server (Express or Developer Edition)
- React Native development environment

### Database Setup

1. Open SQL Server Management Studio (SSMS) or Azure Data Studio
2. Connect to your SQL Server instance
3. Open the `backend/database.sql` file and execute it to create the database and tables
4. Make sure you have a SQL Server user with appropriate permissions

### Backend Setup

1. Navigate to the `backend` directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Update the database connection settings in `server.js`:
   - Replace `'sa'` with your SQL Server username
   - Replace `'YourPassword'` with your SQL Server password

4. Start the backend server:
   ```
   node server.js
   ```

### Frontend Setup

1. Navigate to the project root directory
2. Install dependencies:
   ```
   npm install
   ```

3. Start the React Native app:
   ```
   npx react-native run-android
   ```
   or
   ```
   npx react-native run-ios
   ```

## Features

- User registration and login
- Profile management
- Movie search and details
- Add movies to watchlist
- Rate and review movies you've watched
- Track your movie watching history

## Project Structure

- `backend/` - Express.js server with SQL Server database
- `src/` - React Native frontend code
  - `screens/` - App screens
  - `navigation/` - Navigation configuration
  - `components/` - Reusable UI components
  - `services/` - API service functions 