import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import path from "path";
import dotenv from 'dotenv';

import { fileURLToPath } from "url";



dotenv.config();

// Initialize app
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes
app.use(express.urlencoded({ extended: true }));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Subject Schema (updated)
const subjectSchema = new mongoose.Schema({
  course: { type: String, required: true },
  bookname: { type: String, required: true },
  author: { type: String, required: true },
  edition: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Subject = mongoose.model('Subject', subjectSchema);

// Multer configuration for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST route: Add a new subject (course)
// app.post('/api/subjects', upload.single('image'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'Image file is required.' });
//   }

//   const { course, bookname, author, edition, price, description } = req.body;

//   if (!course || !bookname || !author || !edition || !price || !description) {
//     return res.status(400).json({ message: 'All fields are required.' });
//   }

//   const parsedPrice = parseFloat(price);
//   if (isNaN(parsedPrice)) {
//     return res.status(400).json({ message: 'Price must be a valid number.' });
//   }

//   const newSubject = new Subject({
//     course,
//     bookname,
//     author,
//     edition,
//     price: parsedPrice,
//     description,
//     image: req.file.buffer,
//     contentType: req.file.mimetype,
//   });
app.post('/api/subjects', upload.single('image'), async (req, res) => {
  const { course, bookname, author, edition, price, description } = req.body;
  let image = '';

  if (req.file) {
    image = `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`;
  }

  try {
    const subject = new Subject({
      course,
      bookname,
      author,
      edition,
      price,
      description,
      image,
    });

    await subject.save();
    res.status(201).send('Subject created');
  } catch (err) {
    res.status(500).send("Error creating subject");
  }

  try {
    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(400).json({ message: 'Error creating subject', error });
  }

});


// GET route: Get all subjects (with optional limit)
app.get('/api/subjects', async (req, res) => {
  try {
    const limit = Number(req.query.limit);
    const subjects = limit ? await Subject.find().limit(limit) : await Subject.find();
    res.status(200).json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects', err });
  }
});

// GET route: Get a single subject by ID
app.get('/api/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const base64Image = subject.image.toString('base64');
    res.json({
      ...subject.toObject(),
      image: `data:${subject.contentType};base64,${base64Image}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject', error });
  }
});

// PUT route: Update an existing subject
app.put('/api/subjects/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = req.body;

    if (req.file) {
      updates.image = req.file.buffer;
      updates.contentType = req.file.mimetype;
    }

    const updatedSubject = await Subject.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedSubject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.status(200).json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subject', error });
  }
});

// DELETE route: Delete a subject by ID
app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
    if (!deletedSubject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.status(200).json({ message: `Subject with ID ${req.params.id} deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject', error });
  }
});

// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
