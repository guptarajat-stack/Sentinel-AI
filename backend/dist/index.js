"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
// Load environment configuration
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5000;
// Enable CORS and middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
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
