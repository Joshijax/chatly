const { getConvoChats, saveChats } = require("./utils/firbase_utils.js");
const server = require("http").createServer();
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:8081", "https://serverchatly.herokuapp.com/"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("join", (conversationId) => {
    console.log(conversationId.user, "joined room", conversationId.id);
    socket.join(`conversation:${conversationId.id}`);
    const newMessage = {
      text: conversationId.user,
      type: "joined",
      user: conversationId.user,
      createdAt: new Date(),
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

  socket.on("isSocketInConversation", (conversationRoom, callback) => {
    const room = io.sockets.adapter.rooms.get(conversationRoom);
    if (room && room.has(socket.id)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on("message", async (data) => {
    const { conversationId, message, type, username } = data;
    // Save message to database
    // ...
    console.log("...sending");

    const newMessage = {
      text: message.text,
      type: type,
      user: username,
      createdAt: new Date(),
    };
    console.log(newMessage);
    await saveChats(newMessage, conversationId);
    io.to(`conversation:${conversationId}`).emit("newMessage", newMessage);
    io.to(`conversation:${conversationId}`).emit("typing", false);
  });

  socket.on("typing", (obj) => {
    socket.to(`conversation:${obj.id}`).emit("typing", obj);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
