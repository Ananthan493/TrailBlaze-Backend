import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

dotenv.config();

const predefinedCourses = [
  {
    title: "Fundamentals of AR Development",
    description: "Learn the basics of Augmented Reality development with hands-on projects",
    category: "AR/VR",
    difficulty: "beginner",
    learningStyles: ["visual", "kinesthetic"],
    status: "published",
    content: [
      {
        type: "text",
        title: "Introduction to AR",
        content: "Understanding AR fundamentals and use cases"
      },
      {
        type: "ar",
        title: "First AR Model",
        arModel: "basic-cube.glb"
      }
    ]
  },
  {
    title: "3D Modeling for AR Applications",
    description: "Master 3D modeling techniques for AR applications",
    category: "AR/VR",
    difficulty: "intermediate",
    learningStyles: ["visual", "kinesthetic"],
    status: "published",
    content: [
      {
        type: "video",
        title: "3D Modeling Basics",
        duration: 45
      }
    ]
  },
  {
    title: "Interactive AR Experiences",
    description: "Create engaging AR experiences with user interaction",
    category: "AR/VR",
    difficulty: "advanced",
    learningStyles: ["visual", "kinesthetic"],
    status: "published",
    content: [
      {
        type: "ar",
        title: "Interactive AR Demo",
        arModel: "interactive-model.glb"
      }
    ]
  }
];

const seedPredefinedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Course.insertMany(predefinedCourses);
    console.log('Added predefined courses successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding predefined courses:', error);
    process.exit(1);
  }
};

seedPredefinedCourses();
