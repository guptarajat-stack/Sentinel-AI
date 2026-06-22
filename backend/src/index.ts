import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";

// Load environment configuration
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Enable CORS and middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Authentication Routes
app.use("/api/auth", authRoutes);

// Real-time Dashboard socket events
io.on("connection", (socket) => {
  console.log(`[Socket] client connected: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`[Socket] client disconnected: ${socket.id}`);
  });
});

// Primary Test Endpoints
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Incidents mock routes
app.get("/api/incidents", (req, res) => {
  res.status(200).json([
    { id: 1, title: "Brute Force SSH", severity: "HIGH", status: "NEW", sourceIp: "192.168.1.254" },
    { id: 2, title: "SQL Injection", severity: "HIGH", status: "INVESTIGATING", sourceIp: "10.0.10.99" }
  ]);
});

// Agents alert hook
app.post("/api/agents/alert", (req, res) => {
  const alert = req.body;
  console.log(`[Backend API] <<< Alert received from Agent: ${alert.rule_name}`);
  
  // Forward to all frontend connections via socket
  io.emit("new-alert", alert);
  
  res.status(201).json({ status: "ACK", alertReceived: alert });
});

server.listen(PORT, () => {
  console.log(`[Server] SOC Backend running on port ${PORT}`);
});
