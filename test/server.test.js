// server.test.js
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import your Express app
const app = require('./server'); // Assuming your server file is named 'server.js'

describe('File Upload API', () => {
  it('should upload a file and return a fileId', async () => {
    const filePath = path.resolve(__dirname, 'test-image.jpg');
    const response = await request(app)
      .post('/upload')
      .attach('image', filePath);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fileId');
  });

  // Add more tests as needed...
});

