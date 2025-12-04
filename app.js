import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import seedData from './data/initData.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

    
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());



// Start the server
app.listen(PORT, async () => {
  // Initialize Database
  await seedData();
  console.log(`Server is running on http://localhost:${PORT}`);
});

