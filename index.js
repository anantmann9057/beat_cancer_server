import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { app } from "./app.js";
import { setupWebSocket } from "./websocket/websocket.js";

dotenv.config();

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Setup WebSocket functionality
setupWebSocket(wss);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`-----Server listening on port ${PORT}-----`);
  console.log(`-----WebSocket server is ready-----`);
});
