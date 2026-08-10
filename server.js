const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// チャット履歴の保持（メモリ上）
let chatHistory = [];

io.on('connection', (socket) => {

    // 接続時にこれまでのチャット履歴を送信
    socket.emit('init-history', chatHistory);

    // メッセージ送信時
    socket.on('send-message', (data) => {
        const msgData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: data.name ? data.name.trim() : '名無し',
            text: data.text ? data.text.trim() : '',
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            socketId: socket.id
        };

        if (msgData.text !== '') {
            chatHistory.push(msgData);
            // 直近100件のみ保持
            if (chatHistory.length > 100) chatHistory.shift();

            // 全員に配信
            io.emit('new-message', msgData);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`LINE Clone Server running on port ${PORT}`));
