


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// https://project-full-stack-tawny.vercel.app/api/subjects


dotenv.config(); 





const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static files from the "uploads" folder

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to the "uploads" directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});
const upload = multer({ storage })



  

// MongoDB connection
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });



  const subjectSchema = new mongoose.Schema({
    course: String,
     bookname: String,
     author: String,
     edition: String,
     price: String,
     image: String,
     description: String,
     

  });
  
  const Subject = mongoose.model("Subject", subjectSchema);
 
  app.post("/api/subjects", upload.single('image'), async (req, res) => {
    try {

      // Extract form data from the request body
      const { course, bookname, author, edition, price, description } = req.body;
  
      // Extract file information from the request
      const image = req.file ? `/uploads/${req.file.filename}` : null; // Store the image path
  
      // Create a new Subject document
      const newPost = new Subject({
        course,
        bookname,
        author,
        edition,
        price,
        image,
        description,
      });
  
      // Save the new subject to the database
      const savedPost = await newPost.save();
  
      // Respond with the saved subject
      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Error creating post", error });
    }
  });



  // GET Route to get all subjects (with pagination limit)
app.get("/api/subjects", async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // default to page 1 and limit 10
  try {
    const subjects = await Subject.find()
      .skip((page - 1) * limit) // skip items for pagination
      .limit(parseInt(limit))   // limit number of items
      .exec();

    const totalSubjects = await Subject.countDocuments();

    res.status(200).json({
      totalSubjects,
      totalPages: Math.ceil(totalSubjects / limit),
      currentPage: parseInt(page),
      subjects,
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Error fetching subjects", error });
  }
});

// GET Route to get a single subject by ID
app.get("/api/subjects/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.status(200).json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    res.status(500).json({ message: "Error fetching subject", error });
  }
});

// PUT Route to update a subject by ID
app.put("/api/subjects/:id", upload.single('image'), async (req, res) => {
  try {
    const { course, bookname, author, edition, price, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedData = {
      course,
      bookname,
      author,
      edition,
      price,
      description,
      ...(image && { image })  // Only update the image if it's provided
    };

    const updatedSubject = await Subject.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updatedSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json(updatedSubject);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ message: "Error updating subject", error });
  }
});

// DELETE Route to delete a subject by ID
app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
    if (!deletedSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ message: "Error deleting subject", error });
  }
});





// Start the server
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


