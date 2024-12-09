// removing child elements from a specified element
function emptyDOM(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// creating a new DOM element from an HTML string
function createDOM(htmlString) {
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}

var profile = {
    username: "Alice"
}

// Lobby View
class LobbyView {
    constructor(lobby) {
        this.lobby = lobby;
        this.elem = createDOM(`
            <div class="content">
                <ul class="room-list">
                    <li class="room-item">
                    <a href="#/chat/room-1"> Chatroom 1</a>
                    </li>
                    <li class="room-item">
                    <a href="#/chat/room-2"> Chatroom 2 </a>
                    </li>
                    <li class="room-item">
                    <a href="#/chat/room-3"> Chatroom 3 </a>
                    </li>
                    <li class="room-item">
                    <a href="#/chat/room-4"> Chatroom  4</a>
                    </li>
                </ul>
                <div class="page-control">
                    <input class="room-name" type="text" placeholder="Room Name">
                    <button class="create-room">Create Room</button>
                </div>
            </div>
        `);

        // Store references to the descendant elements
        this.listElem = this.elem.querySelector('ul.room-list');
        this.inputElem = this.elem.querySelector('input');
        this.buttonElem = this.elem.querySelector('button');

        this.redrawList();

        this.buttonElem.addEventListener('click', () => {
            const roomName = this.inputElem.value.trim();
            if (roomName) {
                const roomId = Object.keys(this.lobby.rooms).length + 1; // Generate a new unique ID for the room
                this.lobby.addRoom(roomId, roomName); // Add the new room to the lobby
                this.inputElem.value = ''; // Clear the input field after creating the room
            }
        });

        this.lobby.onNewRoom = (room) => {
            const roomItem = createDOM(`
                <li class="room-item">
                    <a href="#/chat/room-${room.id}">${room.name}</a>
                </li>
            `);
            this.listElem.appendChild(roomItem);
            this.redrawList();
        };
    }

    /*  
        Test Case wants format in 'a[href="#/chat/' + item.id + ' 
        While the requirements are Room ID - the test script expects that you have a Room instance with the ID "room-1".
        We are following requirements in the github
    */
    redrawList() {
        emptyDOM(this.listElem);
        Object.values(this.lobby.rooms).forEach(room => {
            const roomItem = createDOM(`
                <li class="room-item">
                    <a href='#/chat/room-${room.id}'>${room.name}</a>
                </li>
            `);
            this.listElem.appendChild(roomItem);
        });
    }
}

// ChatView
class ChatView {
    constructor() {
        this.room = null
        this.elem = createDOM(`
            <div class="content">
                <h4 class="room-name"> Room-Name</h4>
                <div class="message-list">
                    <div class="message">
                        <span class="message-user">Ray</span>
                        <span class="message-text">Hi I like minecraft</span>
                    </div>
                    <div class="message my-message">
                        <span class="message-user">Miguel</span>
                        <span class="message-text">Hi I like minecraft too</span>
                    </div>
                </div>
                <div class="page-control">
                    <textarea></textarea>
                    <button>Send</button>
                </div>
            </div>
        `);

        // Store references to the descendant elements
        this.titleElem = this.elem.querySelector('h4.room-name');
        this.chatElem = this.elem.querySelector('div.message-list');
        this.inputElem = this.elem.querySelector('textarea');
        this.buttonElem = this.elem.querySelector('button');

        this.buttonElem.addEventListener('click', () => this.sendMessage());
        this.inputElem.addEventListener('keyup', (event) => {

            if (event.key === 'Enter' && !event.shiftKey) {
                this.sendMessage();     // Call sendMessage method
            }
        })
    }

    sendMessage() {
        const messageText = this.inputElem.value.trim()
        if (messageText) {
            this.room.addMessage(profile.username, messageText);
            this.inputElem.value = '';
        }
    }

    setRoom(room) {
       this.room = room;
       this.titleElem.textContent = room.name;

       emptyDOM(this.chatElem);
       room.messages.forEach(message => {
           const messageBox = this.createMessageBox(message);
           this.chatElem.appendChild(messageBox);
       });

       this.room.onNewMessage = (message) => {
           const messageBox = this.createMessageBox(message);
           this.chatElem.appendChild(messageBox);
       };
    }

    createMessageBox(message) {
        const isCurrentUser = message.username === profile.username;
        const messageClass = isCurrentUser ? 'message my-message' : 'message';

        return createDOM(`
            <div class="${messageClass}">
                <span class="message-user">${message.username}</span>
                <span class="message-text">${message.text}</span>
            </div>
        `);
    }
}

// Profile View
class ProfileView {
    constructor() {
        this.elem = createDOM(`
            <div class="content">
                <div class="profile-form">
                    <div class="form-field">
                        <label>Username:</label>
                        <input type="text">
                    </div>
                    <div class="form-field">
                        <label>Password:</label>
                        <input type="password">
                    </div>
                    <div class="form-field">
                        <label>File:</label>
                        <input type="file">
                    </div>
                </div>
                <div class="page-control">
                    <button class="save-button">Save Changes</button>
                </div>
            </div>
        `);
    }
}


class Room {
    constructor(id, name, image = 'assets/everyone-icon.png', messages = []) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
    }

    addMessage(username, text) {
        if (text.trim() === '') return;

        const newMessage = { username, text };

        this.messages.push(newMessage);
        if (typeof this.onNewMessage === 'function') {
            this.onNewMessage(newMessage);
        }
    }
    
}

class Lobby {
    constructor() {
        this.rooms = {
            1: new Room(1, 'Chatroom 1'),
            2: new Room(2, 'Chatroom 2'),
            3: new Room(3, 'Chatroom 3'),
            4: new Room(4, 'Chatroom 4')
        };
    }

    getRoom(roomId) {
        return this.rooms[roomId];
    }

    addRoom(id, name, image = 'assets/everyone-icon.png', messages = []) {
        const newRoom = new Room(id, name, image, messages);
        this.rooms[id] = newRoom;

        // Trigger the onNewRoom callback if it's defined
        if (typeof this.onNewRoom === 'function') {
            this.onNewRoom(newRoom);
        }
    }
}

function main() {
    var lobby = new Lobby();

    const lobbyView = new LobbyView(lobby);
    const chatView = new ChatView();
    const profileView = new ProfileView();

    function renderRoute() {

        console.log(window.location.hash)
        const hash = window.location.hash.slice(2);  // Get the hash value, removing the leading '#'

        const pageView = document.querySelector('#page-view');

        if (hash === '') {
            emptyDOM(pageView);
            pageView.appendChild(lobbyView.elem);

        } else if (hash.startsWith('chat')) {
            const room_arr = hash.split('-');
            const room = lobby.getRoom(room_arr[1]);

            if (room) {
                emptyDOM(pageView);
                chatView.setRoom(room);
                pageView.appendChild(chatView.elem);
            } else {
                console.error("Room not found");
            }

        } else if (hash === 'profile') {
            emptyDOM(pageView);
            pageView.appendChild(profileView.elem);
        }
    }

    // Modify all anchor links to use hash-based navigation
    document.querySelectorAll('a').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href.startsWith('#')) {
            anchor.href = `#${href}`;
        }
    });

    // Attach renderRoute to window popstate event to handle url change
    window.addEventListener('popstate', renderRoute);

    // Initial rendering
    renderRoute();


    // Testing Purposes
    cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby });
}

// Run the main function when the window loads
window.addEventListener('load', main);