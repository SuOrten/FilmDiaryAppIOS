const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    encrypt: false,
    instanceName: process.env.DB_INSTANCE,
  }
};

// Test database connection
async function testConnection() {
  try {
    await sql.connect(config);
    console.log('Database connection successful');
    
    // Test query to check if Users table exists
    const result = await sql.query`
      SELECT TOP 1 * FROM Users
    `;
    console.log('Users table exists and is accessible');
    
    sql.close();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

// Test connection on server start
testConnection();

app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Register request received:', { username, email });
  
  try {
    await sql.connect(config);
    console.log('Connected to database');
    
    // Check if user already exists
    const checkResult = await sql.query`
      SELECT * FROM Users WHERE Email = ${email}
    `;
    
    if (checkResult.recordset.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await sql.query`
      INSERT INTO Users (Username, Email, Password)
      VALUES (${username}, ${email}, ${hashedPassword})
    `;
    console.log('User registered successfully');
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully' 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user',
      error: err.message 
    });
  } finally {
    sql.close();
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM Users WHERE Email = ${email}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.Password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.UserID, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      token,
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error logging in' });
  } finally {
    sql.close();
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected routes should use authenticateToken middleware
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { fullName, username, email, bio, favoriteGenres, profilePhoto } = req.body;
  console.log('Profile update request:', { userId: req.user.userId, fullName, username, email });
  try {
    await sql.connect(config);
    await sql.query`
      UPDATE Users
      SET
        FullName = ${fullName},
        Username = ${username},
        Email = ${email},
        Bio = ${bio},
        FavoriteGenres = ${favoriteGenres},
        ProfilePhoto = ${profilePhoto}
      WHERE UserID = ${req.user.userId}
    `;
    console.log('Profile updated successfully for user:', req.user.userId);
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  } finally {
    sql.close();
  }
});

// Create a new list for a user
app.post('/api/lists', authenticateToken, async (req, res) => {
  const { listName } = req.body;
  const userID = req.user.userId; // Token'dan userID al
  console.log('Creating new list:', { userID, listName });
  try {
    await sql.connect(config);
    console.log('Connected to database');
    
    const result = await sql.query`
      INSERT INTO Lists (UserID, ListName)
      VALUES (${userID}, ${listName});
      SELECT SCOPE_IDENTITY() AS ListID;
    `;
    console.log('List creation result:', result.recordset);
    
    res.status(201).json({ success: true, listID: result.recordset[0].ListID });
  } catch (err) {
    console.error('Create list error:', err);
    res.status(500).json({ success: false, message: 'Error creating list', error: err.message });
  } finally {
    sql.close();
  }
});

// Add a movie to a list (and to Movies table if it doesn't exist)
app.post('/api/lists/:listID/movies', authenticateToken, async (req, res) => {
  const { listID } = req.params;
  const { tmdbID, title, posterURL, releaseYear, overview } = req.body;
  try {
    await sql.connect(config);
    // 1. Insert movie if it doesn't exist
    let movieResult = await sql.query`
      SELECT MovieID FROM Movies WHERE TMDB_ID = ${tmdbID}
    `;
    let movieID;
    if (movieResult.recordset.length === 0) {
      const insertResult = await sql.query`
        INSERT INTO Movies (TMDB_ID, Title, PosterURL, ReleaseYear, Overview)
        VALUES (${tmdbID}, ${title}, ${posterURL}, ${releaseYear}, ${overview});
        SELECT SCOPE_IDENTITY() AS MovieID;
      `;
      movieID = insertResult.recordset[0].MovieID;
    } else {
      movieID = movieResult.recordset[0].MovieID;
    }
    // 2. Add to ListMovies
    await sql.query`
      INSERT INTO ListMovies (ListID, MovieID)
      VALUES (${listID}, ${movieID})
    `;
    res.status(201).json({ success: true, movieID });
  } catch (err) {
    console.error('Add movie to list error:', err);
    res.status(500).json({ success: false, message: 'Error adding movie to list', error: err.message });
  } finally {
    sql.close();
  }
});

// Fetch all lists for a user (with their movies)
app.get('/api/lists', authenticateToken, async (req, res) => {
  const userID = req.user.userId; // Token'dan userID al
  console.log('Fetching lists for user:', userID);
  try {
    await sql.connect(config);
    console.log('Connected to database');
    
    // Get all lists for the user
    const listsResult = await sql.query`
      SELECT * FROM Lists WHERE UserID = ${userID}
    `;
    console.log('Found lists:', listsResult.recordset);
    
    const lists = listsResult.recordset;
    // For each list, get its movies
    for (let list of lists) {
      console.log('Fetching movies for list:', list.ListID);
      const moviesResult = await sql.query`
        SELECT m.*, '' as Review
        FROM ListMovies lm
        JOIN Movies m ON lm.MovieID = m.MovieID
        WHERE lm.ListID = ${list.ListID}
      `;
      console.log('Found movies for list', list.ListID, ':', moviesResult.recordset);
      list.movies = moviesResult.recordset;
    }
    
    console.log('Sending response with lists:', lists);
    res.status(200).json({ success: true, lists });
  } catch (err) {
    console.error('Fetch lists error:', err);
    res.status(500).json({ success: false, message: 'Error fetching lists', error: err.message });
  } finally {
    sql.close();
  }
});

// Delete a list
app.delete('/api/lists/:listID', async (req, res) => {
  const { listID } = req.params;
  console.log('Attempting to delete list:', listID);
  try {
    await sql.connect(config);
    console.log('Connected to database');
    
    // First delete all movies in the list
    console.log('Deleting movies from list...');
    const deleteMoviesResult = await sql.query`
      DELETE FROM ListMovies WHERE ListID = ${listID}
    `;
    console.log('Movies deleted:', deleteMoviesResult.rowsAffected);
    
    // Then delete the list itself
    console.log('Deleting list...');
    const deleteListResult = await sql.query`
      DELETE FROM Lists WHERE ListID = ${listID}
    `;
    console.log('List deleted:', deleteListResult.rowsAffected);
    
    if (deleteListResult.rowsAffected[0] === 0) {
      console.log('No list found with ID:', listID);
      return res.status(404).json({ 
        success: false, 
        message: 'List not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'List deleted successfully',
      rowsAffected: deleteListResult.rowsAffected[0]
    });
  } catch (err) {
    console.error('Delete list error details:', {
      error: err.message,
      code: err.code,
      state: err.state,
      class: err.class,
      lineNumber: err.lineNumber,
      serverName: err.serverName,
      procName: err.procName
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting list', 
      error: err.message 
    });
  } finally {
    sql.close();
  }
});

// Delete a movie from a list
app.delete('/api/lists/:listID/movies/:movieID', authenticateToken, async (req, res) => {
  const { listID, movieID } = req.params;
  console.log('Attempting to delete movie:', movieID, 'from list:', listID);
  try {
    await sql.connect(config);
    console.log('Connected to database');
    
    const result = await sql.query`
      DELETE FROM ListMovies 
      WHERE ListID = ${listID} AND MovieID = ${movieID}
    `;
    console.log('Movie deleted from list:', result.rowsAffected);
    
    if (result.rowsAffected[0] === 0) {
      console.log('No movie found in list');
      return res.status(404).json({ 
        success: false, 
        message: 'Movie not found in list' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Movie removed from list successfully',
      rowsAffected: result.rowsAffected[0]
    });
  } catch (err) {
    console.error('Delete movie from list error details:', {
      error: err.message,
      code: err.code,
      state: err.state,
      class: err.class,
      lineNumber: err.lineNumber,
      serverName: err.serverName,
      procName: err.procName
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error removing movie from list', 
      error: err.message 
    });
  } finally {
    sql.close();
  }
});

// Save a review for a movie in a list
app.post('/api/lists/:listID/movies/:movieID/review', authenticateToken, async (req, res) => {
  const { listID, movieID } = req.params;
  const { review } = req.body;
  console.log('Saving review for movie:', movieID, 'in list:', listID);
  
  try {
    await sql.connect(config);
    console.log('Connected to database');
    
    const result = await sql.query`
      UPDATE ListMovies 
      SET Review = ${review}
      WHERE ListID = ${listID} AND MovieID = ${movieID}
    `;
    console.log('Review saved:', result.rowsAffected);
    
    if (result.rowsAffected[0] === 0) {
      console.log('No movie found in list');
      return res.status(404).json({ 
        success: false, 
        message: 'Movie not found in list' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Review saved successfully',
      rowsAffected: result.rowsAffected[0]
    });
  } catch (err) {
    console.error('Save review error details:', {
      error: err.message,
      code: err.code,
      state: err.state,
      class: err.class,
      lineNumber: err.lineNumber,
      serverName: err.serverName,
      procName: err.procName
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error saving review', 
      error: err.message 
    });
  } finally {
    sql.close();
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
