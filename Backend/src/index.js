import dotenv from "dotenv"
import { app } from "./app.js"
import connectDB from "./db/index.js"

// Only load .env file in development
// In Docker, all env vars come from docker-compose.yml
dotenv.config({
    path: "./.env"
})

app.on("error", (error) => 
    console.log("❌ Express App Error:", error)
)

console.log("🔧 Starting application...");
console.log("🌍 Environment:", process.env.NODE_ENV);
console.log("🔌 Port:", process.env.PORT);

connectDB()
.then(() => {
    app.listen(process.env.PORT || 5000, () => {
        console.log("✅ Server started successfully!");
        console.log("🚀 App is listening on port:", process.env.PORT || 5000);
    })
})
.catch((err) => {
    console.log("❌ DB connection failed. Err:", err);
    process.exit(1);
})