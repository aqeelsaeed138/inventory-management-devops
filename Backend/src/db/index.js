import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const { MONGODB_URI, DB_NAME } = process.env;

    // In Docker: MONGODB_URI already contains the database name
    // Format: mongodb://admin:admin123@mongodb:27017/inventaryDatabase?authSource=admin
    
    // In Local Dev: MONGODB_URI is just the host, DB_NAME is separate
    // Format: mongodb+srv://user:pass@cluster.mongodb.net + /inventaryDatabase
    
    let mongoURI;
    
    if (MONGODB_URI.includes('inventaryDatabase') || MONGODB_URI.includes('?authSource=admin')) {
      // Docker environment - URI already has database
      mongoURI = MONGODB_URI;
      console.log("🐳 Using Docker MongoDB");
    } else if (DB_NAME) {
      // Local development - append DB_NAME
      mongoURI = `${MONGODB_URI}/${DB_NAME}`;
      console.log("💻 Using Local/Atlas MongoDB");
    } else {
      throw new Error("MONGODB_URI or DB_NAME is missing in environment variables");
    }

    console.log("🔗 Connecting to MongoDB...");
    console.log("📍 URI:", mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials

    const connectionInstance = await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected successfully!");
    console.log("📍 DB Host:", connectionInstance.connection.host);
    console.log("🗄️  Database:", connectionInstance.connection.name);

  } catch (error) {
    console.error("❌ MongoDB connection failed!");
    console.error("Error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
};

export default connectDB;