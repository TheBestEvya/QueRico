import express, { Express } from "express";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoute';
import postRoutes from './routes/postRoute';
import userRoutes from './routes/userRoute';
import commentRoutes from './routes/commentRoute';
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import passport from './middleware/googleAuth'
import http from 'http';
import { initializeSocket } from '../src/services/socketIO'; // Import socketService

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server to handle socket.io
initializeSocket(server); // This will initialize the Socket.io functionality

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});
app.use(passport.initialize());
// Static files for images
app.use(express.static('public'));
// Routes
//TODO :: add all routes needed
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes)

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "http://localhost:3001", },],
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

// Connect to MongoDB

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    if (!process.env.MONGODB_URI) {
      reject("MONGODB_URI is not defined in .env file");
    } else {
      mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => {
          resolve(app);
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
};
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});
export default initApp;