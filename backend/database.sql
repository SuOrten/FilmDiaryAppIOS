-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'MovieJournalDB')
BEGIN
    CREATE DATABASE MovieJournalDB;
END
GO

-- Use the database
USE MovieJournalDB;
GO

-- Create Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL,
        Email NVARCHAR(100) NOT NULL UNIQUE,
        Password NVARCHAR(100) NOT NULL,
        ProfilePhoto NVARCHAR(255),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Movies table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Movies')
BEGIN
    CREATE TABLE Movies (
        MovieID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(100) NOT NULL,
        ReleaseYear INT,
        Director NVARCHAR(100),
        Genre NVARCHAR(50),
        PosterURL NVARCHAR(255),
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create UserMovies table (for tracking movies watched by users)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserMovies')
BEGIN
    CREATE TABLE UserMovies (
        UserMovieID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        MovieID INT NOT NULL,
        Rating INT CHECK (Rating >= 1 AND Rating <= 10),
        Review NVARCHAR(MAX),
        WatchedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (MovieID) REFERENCES Movies(MovieID)
    );
END
GO

-- Create Watchlist table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Watchlist')
BEGIN
    CREATE TABLE Watchlist (
        WatchlistID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        MovieID INT NOT NULL,
        AddedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (MovieID) REFERENCES Movies(MovieID)
    );
END
GO

-- Create Lists table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lists')
BEGIN
    CREATE TABLE Lists (
        ListID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        ListName NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END
GO

-- Create ListMovies table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ListMovies')
BEGIN
    CREATE TABLE ListMovies (
        ListMovieID INT IDENTITY(1,1) PRIMARY KEY,
        ListID INT NOT NULL,
        MovieID INT NOT NULL,
        Review NVARCHAR(MAX),
        AddedDate DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ListID) REFERENCES Lists(ListID),
        FOREIGN KEY (MovieID) REFERENCES Movies(MovieID)
    );
END
GO

-- Add Review column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ListMovies') AND name = 'Review')
BEGIN
    ALTER TABLE ListMovies ADD Review NVARCHAR(MAX);
END
GO

PRINT 'Database and tables created successfully!';