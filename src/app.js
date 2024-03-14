const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 } // 1MB limit
}).single('image'); // 'image' is the field name of the file input

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database.');
    // Create a table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY,
        uuid TEXT NOT NULL,
        status TEXT,
        filename TEXT,
        thumbnail TEXT
      );`
    );
  }
});

// Handle POST request for uploading image and creating thumbnail
app.post('/upload', (req, res) => {
  const fileId = uuidv4(); // Generate unique identifier for the file
  db.run('INSERT INTO images (uuid, status) VALUES (?, ?)', [fileId, 'uploading'], (err) => {
    if (err) {
      console.error('Error inserting data into database:', err);
      return res.status(500).json({ message: 'Error inserting data into database.' });
    }
  });

  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      db.run('UPDATE images SET status = ? WHERE uuid = ?', ['upload_failed', fileId]);
    }

    if (!req.file) {
      db.run('UPDATE images SET status = ? WHERE uuid = ?', ['upload_failed', fileId]);
    }

    try {
      const thumbnailFilename = req.file.filename.replace(/\.(jpg|jpeg|png)$/i, '_thumb.$1');
      sharp(req.file.path)
        .resize({ width: 100, height: 100 })
        .toFile(path.resolve('./uploads', thumbnailFilename))
        .then(() => {
          // Insert file information into the database
          db.run('UPDATE images SET thumbnail = ?, status = ? WHERE uuid = ?', [thumbnailFilename, 'done', fileId]);
        });
    } catch (err) {
      console.error('Error creating thumbnail:', err);
      db.run('UPDATE images SET status = ? WHERE uuid = ?', ['thumbnail_failed', fileId]);
    }
  });
  return res.json({
    message: 'File upload in progress', 
    jobId: fileId
  });
});

// Define GET endpoint to retrieve job information
app.get('/jobs', (req, res) => {
  // Query all images from the database
  db.all('SELECT uuid AS job_id, status FROM images', (err, rows) => {
    if (err) {
      console.error('Error retrieving data from database:', err);
      return res.status(500).json({ message: 'Error retrieving data from database.' });
    }
    res.json(rows); // Send the list of images with their UUIDs and status
  });
});

// Handle GET request for retrieving image data from the database
app.get('/images/:uuid', (req, res) => {
  const { uuid } = req.params;
  db.get('SELECT * FROM images WHERE uuid = ?', [uuid], (err, row) => {
    if (err) {
      console.error('Error retrieving data from database:', err);
      return res.status(500).json({ message: 'Error retrieving data from database.' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Image not found.' });
    }
    const imagePath = path.join('.', 'uploads', row.thumbnail);
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image file not found.' });
    }
    // Read the file and send it as the response
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        console.error('Error reading image file:', err);
        return res.status(500).json({ message: 'Error reading image file.' });
      }
      res.setHeader('Content-Type', 'image/jpeg'); // Adjust the content type if needed
      res.send(data);
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

