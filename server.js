const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    // 部屋（ルーム）への参加処理
    socket.on('join-room', ({ username, room }) => {
        const cleanName = username.trim() || '名無し';
        const cleanRoom = room.trim().toLowerCase() || '自由広場';

        socket.username = cleanName;
        socket.room = cleanRoom;

        socket.join(cleanRoom);

        // 他メンバーへ通知＆送信者に完了通知
        socket.to(cleanRoom).emit('system-message', `${cleanName} さんが入室しました`);
        socket.emit('joined-success', { username: cleanName, room: cleanRoom });

        // ルームの現在人数を更新
        updateRoomUsers(cleanRoom);
    });

    // メッセージのグループ配信
    socket.on('chat-message', (data) => {
        if (!socket.room) return;
        io.to(socket.room).emit('chat-message', {
            id: socket.id,
            username: socket.username,
            message: data.message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // 切断処理
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

// オンライン環境用のポート設定
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
