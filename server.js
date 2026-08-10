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

// チャット履歴の保持
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
            socketId: socket.id,
            readCount: 0, // 既読人数
            readUsers: []  // 既読したユーザーのリスト
        };

        if (msgData.text !== '') {
            chatHistory.push(msgData);
            if (chatHistory.length > 100) chatHistory.shift();

            // 送信者に通知 ＆ 他のユーザーに配信
            io.emit('new-message', msgData);
        }
    });

    // 既読通知を受け取ったとき
    socket.on('read-message', (data) => {
        const { msgId, userName } = data;
        const targetMsg = chatHistory.find(m => m.id === msgId);

        if (targetMsg && !targetMsg.readUsers.includes(userName) && targetMsg.name !== userName) {
            targetMsg.readUsers.push(userName);
            targetMsg.readCount = targetMsg.readUsers.length;

            // 全員に既読数の更新を通知
            io.emit('update-read-count', {
                msgId: targetMsg.id,
                readCount: targetMsg.readCount
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`LINE Clone Server running on port ${PORT}`));
