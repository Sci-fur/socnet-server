const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDkyNjNhODNjMjVhN2JjYjAxZThhYiIsImlhdCI6MTc3NjA4NzkyOSwiZXhwIjoxNzc2NjkyNzI5fQ.CrAItQIecUK9vMZiKhFWewJWQjDuGaPUTAKRpOHXKNM",
  },
});

socket.on("connect", () => {
  console.log("Connected as User 1");

  socket.emit("message:send", {
    recipientId: "69dcee88a80861b64e926c35",
    content: "Hello from User 1",
  });
});

socket.on("message:sent", (msg) => {
  console.log("Message sent:", msg);
});

socket.on("message:error", (err) => {
  console.log("Error:", err);
});