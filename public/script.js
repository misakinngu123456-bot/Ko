const socket = io();

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatBody = document.getElementById('chat-body');
const displayRoomName = document.getElementById('display-room-name');
const userCountSpan = document.getElementById('user-count');

joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim() || '自由広場';

    if (!username) {
        alert('お名前を入力してください！');
        usernameInput.focus();
        return;
    }

    socket.emit('join-room', { username, room });
});

socket.on('joined-success', (data) => {
    displayRoomName.textContent = `# ${data.room}`;
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    chatBody.innerHTML = '';
    messageInput.focus();
});

socket.on('room-info', (data) => {
    userCountSpan.textContent = `オンライン: ${data.userCount}人`;
});

leaveBtn.addEventListener('click', () => {
    location.reload();
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (msg) {
        socket.emit('chat-message', { message: msg });
        messageInput.value = '';
    }
});

socket.on('system-message', (text) => {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = text;
    chatBody.appendChild(div);
    scrollToBottom();
});

socket.on('chat-message', (data) => {
    const isMine = data.id === socket.id;

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isMine ? 'mine' : 'other'}`;

    if (!isMine) {
        const nameDiv = document.createElement('div');
        nameDiv.className = 'sender-name';
        nameDiv.textContent = data.username;
        wrapper.appendChild(nameDiv);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble';
    bubbleDiv.textContent = data.message;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'msg-time';
    timeSpan.textContent = data.time;

    contentDiv.appendChild(bubbleDiv);
    contentDiv.appendChild(timeSpan);
    wrapper.appendChild(contentDiv);

    chatBody.appendChild(wrapper);
    scrollToBottom();
});

function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}
