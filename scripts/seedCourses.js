import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

dotenv.config();

const sampleCourses = [
  {
    title: "Introduction to Web Development",
    description: "Learn the basics of HTML, CSS, and JavaScript",
    learningStyles: ["visual", "reading"],
    difficulty: "beginner",
    status: "published",
    category: "Web Development",
    content: [
      {
        type: "text",
        title: "HTML Basics",
        data: "HTML is the foundation of web development..."
      }
    ]
  },
  {
    title: "AR/VR Fundamentals",
    description: "Introduction to Augmented and Virtual Reality",
    learningStyles: ["visual", "kinesthetic"],
    difficulty: "beginner",
    status: "published",
    category: "AR/VR",
    content: [
      {
        type: "ar",
        title: "3D Models Basics",
        arModel: "sample-model.glb"
      }
    ]
  },
  {
    title: "Python Programming",
    description: "Learn Python from scratch",
    learningStyles: ["reading", "kinesthetic"],
    difficulty: "beginner",
    status: "published",
    category: "Programming",
    content: [
      {
        type: "text",
        title: "Variables and Data Types",
        data: "Python is a versatile programming language..."
      }
    ]
  }
];

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Insert new courses
    const createdCourses = await Course.insertMany(sampleCourses);
    console.log('Added sample courses:', createdCourses);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding courses:', error);
    process.exit(1);
  }
};

seedCourses();
