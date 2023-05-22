const express = require("express");
const app = express();
const { getConvoChats, saveChats } = require("./utils/firbase_utils.js");
const openai = require("openai");
const { Timestamp } = require("firebase/firestore");

// const io = require("socket.io")(server, {
//   cors: {
//     // origin: ["http://localhost:8080", "http://localhost:8081", "https://serverchatly.herokuapp.com/"],
//     origin: "*",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   },
// });

const cors = require("cors");

app.use(cors());

const server = require("http").createServer(app);

const { Server } = require("socket.io");

app.get("/", (req, res) => {
  res.write("<h1> Chat server is running");
  res.end();
});

app.use(cors());

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(204);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  origins: "*:*",
  matchOriginProtocol: true,
});

// const io = new Server(server)

let customerSockets = [];
let agentSockets = [];

io.on("connection", (socket) => {
  console.log("Client connectedd");

  // Emit the list of agent sockets to the Vue.js client
  socket.emit("getAgents", agentSockets);

  // Emit the list of customers sockets to the Vue.js client
  socket.emit("getCustomers", customerSockets);

  // Add connected user to the appropriate array
  socket.on("userType", (userType) => {
    console.log(userType);
    if (userType.role === "agent") {
      userType.socketId = socket.id;
      agentSockets.push(userType);
      console.log("agent Connect", userType);
      io.emit("agentCount", agentSockets);
    } else if (userType === "customer") {
      customerSockets.push(socket.id);
      console.log("customer Connect", socket.id);
      io.emit("customerCount", customerSockets);
    }
  });

  socket.on("join", (conversationId) => {
    console.log(conversationId.user, "joined room", conversationId.id);
    socket.join(`conversation:${conversationId.id}`);
    const newMessage = {
      text: conversationId.user,
      type: "joined",
      user: conversationId.user,
      createdAt: Timestamp.now(),
    };
    console.log(
      io.sockets.adapter.rooms.get(`conversation:${conversationId.id}`)
    );
    io.to(`conversation:${conversationId.id}`).emit("joined", newMessage);
  });

  socket.on("leave", (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("requestAssistance", (data) => {
    io.sockets.emit("assistanceRequested", data);
    console.log(`Assistance requested: ${data}`);
  });

  socket.on("requestAccepted", (data) => {
    io.sockets.emit("requestAccepted", data);
    io.to(`conversation:${data.conversationId}`).emit("requestAccepted", data);
    io.sockets.emit("requestAcceptedAgent", data);
    console.log(`requestAccepted: ${data}`);
  });

  socket.on("isSocketInConversation", (conversationRoom, callback) => {
    const room = io.sockets.adapter.rooms.get(conversationRoom);
    if (room && room.has(socket.id)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on("message", async (data) => {
    const { conversationId, message, type, username, isUser } = data;
    // Save message to database
    // ...
    console.log("...sending");

    const newMessage = {
      text: message.text,
      type: type,
      user: username,
      createdAt: Timestamp.now(),
      isUser,
      conversationId,
    };
    console.log(newMessage);
    await saveChats(newMessage, conversationId);
    io.to(`conversation:${conversationId}`).emit("newMessage", newMessage);
    io.to(`conversation:${conversationId}`).emit("typing", false);
  });

  // Handle incoming voice messages from the client
  socket.on("voiceMessage", async (data) => {
    const { conversationId, type, message, username, isUser } = data;

    // Save the voice message to the database
    const newMessage = {
      text: message,
      type: type,
      user: username,
      createdAt: Timestamp.now(),
      isUser,
      conversationId,
    };
    await saveChats(newMessage, conversationId);

    // Broadcast the voice message to all clients in the conversation room
    io.to(`conversation:${conversationId}`).emit("newMessage", newMessage);
  });

  socket.on("image", async (data) => {
    const { conversationId, type, message, username, isUser } = data;
    // Save the voice message to the database
    const newMessage = {
      text: message,
      type: type,
      user: username,
      createdAt: Timestamp.now(),
      isUser,
      conversationId,
    };
    await saveChats(newMessage, conversationId);
    io.to(`conversation:${conversationId}`).emit("newMessage", newMessage);
  });

  socket.on("typing", (obj) => {
    socket.to(`conversation:${obj.id}`).emit("typing", obj);
  });

  socket.on("timeUp", (obj) => {
    console.log("time up from server");
    socket.to(`conversation:${obj}`).emit("timeUp", obj);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");

    // Remove disconnected user from the appropriate array
    const agentIndex = agentSockets.findIndex(
      (agent) => agent.socketId === socket.id
    );
    if (agentIndex !== -1) {
      agentSockets.splice(agentIndex, 1);
      io.emit("agentCount", agentSockets.length);
    } else {
      const customerIndex = customerSockets.indexOf(socket.id);
      if (customerIndex !== -1) {
        customerSockets.splice(customerIndex, 1);
        io.emit("customerCount", customerSockets.length);
      }
    }
  });
});

// server.listen(3000, () => {
//   console.log("Server listening on port 3000");
// });

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${server.address().port}`);
});
