const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
    auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDkyNjNhODNjMjVhN2JjYjAxZThhYiIsImlhdCI6MTc3NjA4NzkyOSwiZXhwIjoxNzc2NjkyNzI5fQ.CrAItQIecUK9vMZiKhFWewJWQjDuGaPUTAKRpOHXKNM" },
});

socket.on("connect", () => {
    console.log("User1 connected");

    let messageF = "it works";
    setTimeout(() => {
        socket.emit("typing:start", {
            recipientId: "69dcee88a80861b64e926c35",
        });
    }, 2000);

});

socket.on("message:sent", (msg) => {
    console.log("User1 sent:", msg.content);
});

socket.on("message:receive", (msg) => {
    console.log("User1 received:", msg.content);
});