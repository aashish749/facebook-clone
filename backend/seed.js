import mongoose from "mongoose";

//this is hte seed file to populate the database with some initial data for testing and development purposes. It connects to the MongoDB database, clears existing data, and inserts sample users, posts, comments, and conversations.

import dotenv from "dotenv";
import connectDb from "./src/config/db.js";
import bcrypt from "bcryptjs";
import User from "./src/models/UserModel.js";
import Post from "./src/models/PostModel.js";
import Comment from "./src/models/CommentModel.js";
import Conversation from "./src/models/ConversationModel.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDb();

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Conversation.deleteMany({});

    // Create sample users
    // Hash passwords and create users
    const pass1 = await bcrypt.hash("password123", 10);
    const pass2 = await bcrypt.hash("password123", 10);

    const user1 = new User({
      username: "john_doe",
      email: "john.doe@example.com",
      passwordHash: pass1,
    });

    const user2 = new User({
      username: "jane_smith",
      email: "jane.smith@example.com",
      passwordHash: pass2,
    });

    // Save users to the database
    await user1.save();
    await user2.save();

    // Create sample posts
    const post1 = new Post({
      author: user1._id,
      text: "This is my first post!",
    });

    const post2 = new Post({
      author: user2._id,
      text: "Hello, world!",
    });

    // Save posts to the database
    await post1.save();
    await post2.save();

    // Create sample comments
    const comment1 = new Comment({
      author: user1._id,
      post: post1._id,
      text: "Great post!",
    });

    const comment2 = new Comment({
      author: user2._id,
      post: post1._id,
      text: "Thanks for sharing!",
    });

    // Save comments to the database
    await comment1.save();
    await comment2.save();

    // Create sample conversations
    const conversation1 = new Conversation({
      participants: [user1._id, user2._id],
    });

    // Save conversation to the database
    await conversation1.save();

    console.log("Seeding complete.");
    // Close mongoose connection
    mongoose.connection.close();
  } catch (error) {
    console.error("Error occurred while seeding data:", error);
  }
};

seedData();
