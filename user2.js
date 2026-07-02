const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGNlZTg4YTgwODYxYjY0ZTkyNmMzNSIsImlhdCI6MTc3NjA4ODI5NiwiZXhwIjoxNzc2NjkzMDk2fQ.LnlKD1NMf9M7hoIfKdhpnIE3NEcuou4DQF09bvZBcgs" },
});

socket.on("connect", () => {
  console.log("User2 connected");
});

// socket.on("message:receive", (msg) => {
//   console.log("User2 received:", msg.content);
// });
socket.on("typing:start", ({ userId }) => {
  console.log(`${userId} is typing...`);
});