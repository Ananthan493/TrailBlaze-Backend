import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';

dotenv.config();

const sampleCourses = [
  {
    title: "Introduction to AR Development",
    description: "Master the fundamentals of Augmented Reality development through hands-on projects and real-world applications",
    highlights: [
      "Learn WebXR and Three.js fundamentals from scratch",
      "Build real-world AR applications with practical examples",
      "Master AR device compatibility and environment setup",
      "Hands-on experience with 3D model manipulation",
      "Create interactive user experiences in AR",
      "Deploy cross-platform AR applications",
      "Optimize AR content for mobile devices",
      "Industry-standard development workflows"
    ],
    outcomes: [
      "Develop AR applications using WebXR",
      "Create and manipulate 3D content in AR",
      "Implement user interactions and gestures",
      "Handle AR scene management",
      "Debug and optimize AR applications",
      "Deploy cross-platform AR solutions"
    ],
    prerequisites: [
      "Basic JavaScript programming knowledge",
      "Understanding of HTML and CSS",
      "Familiarity with web development concepts",
      "Basic 3D geometry understanding"
    ],
    modules: [
      {
        title: "Getting Started with AR",
        description: "Understanding AR fundamentals and development environment setup",
        duration: 120,
        topics: [
          "Introduction to AR concepts",
          "Setting up development environment",
          "Understanding WebXR API",
          "Basic 3D concepts for AR",
          "AR device compatibility",
          "Your first AR scene"
        ]
      },
      {
        title: "3D Content in AR",
        description: "Working with 3D models and content in AR environments",
        duration: 180,
        topics: [
          "3D model formats and standards",
          "Loading and displaying 3D models",
          "Textures and materials",
          "Lighting in AR",
          "Animation basics",
          "Model optimization"
        ]
      },
      {
        title: "User Interactions",
        description: "Implementing interactive AR experiences",
        duration: 150,
        topics: [
          "Touch and gesture controls",
          "Ray casting and hit testing",
          "Object manipulation",
          "Custom AR interfaces",
          "Multi-touch interactions",
          "User feedback mechanisms"
        ]
      }
    ]
  },
  {
    title: "3D Modeling for AR Applications",
    description: "Take your AR skills to the next level with advanced concepts and real-time features",
    highlights: [
      "Master industry-standard 3D modeling tools",
      "Create optimized models for AR environments",
      "Learn UV mapping and texture optimization",
      "Implement real-time rendering techniques",
      "Develop animation fundamentals for AR",
      "Export and integrate models with AR platforms",
      "Performance optimization best practices",
      "Asset management for AR projects"
    ],
    outcomes: [
      "Build complex AR tracking systems",
      "Create collaborative AR experiences",
      "Integrate cloud services with AR",
      "Implement advanced animations",
      "Master AR scene optimization",
      "Deploy scalable AR applications"
    ],
    prerequisites: [
      "Basic AR development experience",
      "Strong JavaScript knowledge",
      "Experience with 3D graphics",
      "Understanding of WebXR",
      "Basic networking concepts"
    ],
    modules: [
      {
        title: "Advanced Tracking",
        description: "Master complex AR tracking and recognition systems",
        duration: 180,
        topics: [
          "Image tracking",
          "Surface detection",
          "3D object tracking",
          "Multiple target tracking",
          "Dynamic tracking systems",
          "Occlusion handling"
        ]
      },
      {
        title: "Real-time AR Features",
        description: "Implementing real-time features in AR applications",
        duration: 160,
        topics: [
          "Real-time data streaming",
          "Live object recognition",
          "Dynamic content updates",
          "Performance monitoring",
          "Memory management",
          "Error handling"
        ]
      },
      {
        title: "Enterprise AR",
        description: "Building enterprise-grade AR solutions",
        duration: 200,
        topics: [
          "Security considerations",
          "Scalability patterns",
          "Data management",
          "Custom tracking solutions",
          "Integration with existing systems",
          "Deployment strategies"
        ]
      }
    ]
  },
  {
    title: "Interactive AR Experiences",
    description: "Create powerful AR experiences optimized for mobile devices",
    highlights: [
      "Develop advanced gesture recognition systems",
      "Create multi-user AR experiences",
      "Implement real-time physics interactions",
      "Master spatial audio integration",
      "Build cloud-connected AR applications",
      "Advanced tracking and recognition systems",
      "AR UI/UX design principles",
      "Performance monitoring and optimization"
    ],
    outcomes: [
      "Develop mobile AR applications",
      "Optimize AR for mobile devices",
      "Handle device sensors and inputs",
      "Create responsive AR interfaces",
      "Implement offline capabilities",
      "Master mobile AR debugging"
    ],
    prerequisites: [
      "Mobile development basics",
      "Understanding of AR concepts",
      "JavaScript/TypeScript knowledge",
      "Basic 3D mathematics",
      "UI/UX design principles"
    ],
    modules: [
      {
        title: "Mobile AR Fundamentals",
        description: "Core concepts of mobile AR development",
        duration: 160,
        topics: [
          "Mobile AR frameworks",
          "Device capabilities",
          "Sensor integration",
          "Camera handling",
          "Resource management",
          "Performance optimization"
        ]
      },
      {
        title: "Advanced Mobile Features",
        description: "Implementing advanced mobile AR capabilities",
        duration: 180,
        topics: [
          "Location-based AR",
          "Persistent AR content",
          "Social features",
          "Custom shaders",
          "Advanced animations",
          "Native plugin integration"
        ]
      },
      {
        title: "Production and Deployment",
        description: "Preparing and deploying mobile AR applications",
        duration: 140,
        topics: [
          "Testing strategies",
          "Performance profiling",
          "App store requirements",
          "Analytics integration",
          "User feedback handling",
          "Version management"
        ]
      }
    ]
  },
  {
    title: "Mobile AR Development",
    description: "Create powerful AR experiences optimized for mobile devices",
    highlights: [
      "Build native AR applications for iOS and Android",
      "Optimize AR experiences for mobile hardware",
      "Implement efficient battery management",
      "Handle device-specific sensor integration",
      "Create offline-capable AR applications",
      "Master mobile UI/UX best practices",
      "Deploy to app stores successfully",
      "Monitor and analyze AR app performance"
    ],
    outcomes: [
      "Develop mobile AR applications",
      "Optimize AR for mobile devices",
      "Handle device sensors and inputs",
      "Create responsive AR interfaces",
      "Implement offline capabilities",
      "Master mobile AR debugging"
    ],
    prerequisites: [
      "Mobile development basics",
      "Understanding of AR concepts",
      "JavaScript/TypeScript knowledge",
      "Basic 3D mathematics",
      "UI/UX design principles"
    ],
    modules: [
      {
        title: "Mobile AR Fundamentals",
        description: "Core concepts of mobile AR development",
        duration: 160,
        topics: [
          "Mobile AR frameworks",
          "Device capabilities",
          "Sensor integration",
          "Camera handling",
          "Resource management",
          "Performance optimization"
        ]
      },
      {
        title: "Advanced Mobile Features",
        description: "Implementing advanced mobile AR capabilities",
        duration: 180,
        topics: [
          "Location-based AR",
          "Persistent AR content",
          "Social features",
          "Custom shaders",
          "Advanced animations",
          "Native plugin integration"
        ]
      },
      {
        title: "Production and Deployment",
        description: "Preparing and deploying mobile AR applications",
        duration: 140,
        topics: [
          "Testing strategies",
          "Performance profiling",
          "App store requirements",
          "Analytics integration",
          "User feedback handling",
          "Version management"
        ]
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
