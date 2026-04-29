import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = () => {
  // Mongoose 7+ no longer supports `useNewUrlParser` / `useUnifiedTopology` options.
  // Return the connection promise so callers can await the connection.
  return mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
};

export default connectDb;
