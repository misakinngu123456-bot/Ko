const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join-room', ({ username, room }) => {
        const cleanName = username.trim() || '名無し';
        const cleanRoom = room.trim().toLowerCase() || '自由広場';

        socket.username = cleanName;
        socket.room = cleanRoom;

        socket.join(cleanRoom);
        socket.to(cleanRoom).emit('system-message', `${cleanName} さんが入室しました`);
        socket.emit('joined-success', { username: cleanName, room: cleanRoom });

        updateRoomUsers(cleanRoom);
    });

    socket.on('chat-message', (data) => {
        if (!socket.room) return;
        io.to(socket.room).emit('chat-message', {
            id: socket.id,
            username: socket.username,
            message: data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        if (socket.room && socket.username) {
            io.to(socket.room).emit('system-message', `${socket.username} さんが退室しました`);
            updateRoomUsers(socket.room);
        }
    });

    function updateRoomUsers(roomName) {
        const clients = io.sockets.adapter.rooms.get(roomName);
        const count = clients ? clients.size : 0;
        io.to(roomName).emit('room-info', { userCount: count });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
