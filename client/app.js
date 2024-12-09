var Service = {};
Service.origin = window.location.origin;

Service.getAllRooms = function () {
    return fetch(Service.origin + '/chat')
        .then(async response => {
            if (response.status != 200) {
                return Promise.reject(new Error(await response.text())); //iii. In case of server-side error (i.e., the server returns a response that does not have HTTP status 200), the Promise should reject with a newly created Error containing any message from the server.

            }
            return await response.json();

        })
        .catch(error => {
            return Promise.reject(new Error(error.message)); //ii. In case of client-side error, the Promise should reject with the error that was caught.
        });
};

Service.addRoom = function (data) {
    return fetch(Service.origin + '/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Serialize data to JSON string
    })
        .then(async response => {
            if (!response.ok) {
                return Promise.reject(new Error(await response.text()));
            }
            return response.json(); // Return newly created room data
        })
        .catch(error => {
            return Promise.reject(error); // Return rejected promise if an error occurs
        });
};

Service.getLastConversation = function (roomId, before = Date.now()) {
    const url = `/chat/${encodeURIComponent(roomId)}/messages?before=${encodeURIComponent(before)}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch conversation: ${response.statusText}`);
            }
            return response.json();
        })
        .then(conversation => {
            console.log("Service: Received conversation from server:", conversation);
            return conversation;
        })
        .catch(err => {
            console.error("Error fetching conversation:", err);
            throw err;
        });
};

Service.getProfile = function () {
    return fetch(Service.origin + '/profile')
        .then(async response => {
            if (!response.ok) {
                return Promise.reject(new Error(await response.text()));
            }
            return await response.json();
        })
        .catch(error => {
            return Promise.reject(new Error(error.message));
        });
};

Service.getModels = function () {
    return fetch(Service.origin + '/models')
        .then(async response => {
            if (!response.ok) {
                return Promise.reject(new Error(await response.text()));
            }
            return await response.json();
        })
        .catch(error => {
            return Promise.reject(new Error(error.message));
        });
};



function* makeConversationLoader(room) {
    let lastTimestamp = room.timestamp;
    console.log("Initializing conversation loader for room:", room);

    room.canLoadConversation = true;

    while (room.canLoadConversation) {
        room.canLoadConversation = false;
        const before = lastTimestamp || Date.now();

        const fetchPromise = Service.getLastConversation(room.id, before)
            .then(conversation => {
                if (conversation) {
                    console.log("Fetched conversation:", conversation);
                    lastTimestamp = conversation.timestamp;
                    room.addConversation(conversation);
                    room.canLoadConversation = true;
                    return conversation;
                } else {
                    console.log("-----No more conversations to fetch------");
                    room.canLoadConversation = false;
                    return null;
                }
            })
            .catch(error => {
                console.error("Error fetching conversation:", error);
                room.canLoadConversation = true;
                return null;
            });

        yield fetchPromise;
    }

    yield Promise.resolve(null);
}


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
    username: "Unknown"
}

class ModelsView {
    constructor(models) {
        this.models = models;
        this.elem = createDOM(`
            <div class="content">
                <ul class="room-list"></ul>
            </div>
        `);

        // Store reference to the list element
        this.listElem = this.elem.querySelector('ul.room-list');
        this.redrawList();
    }

    redrawList() {
        emptyDOM(this.listElem);
        this.models.forEach(model => {
            const modelItem = createDOM(`
                <li class="room-item">
                    <a href="#/models/${model.name}">${model.name}</a>
                </li>
            `);
            this.listElem.appendChild(modelItem);
        });
    }
}


// Lobby View
class LobbyView {
    constructor(lobby) {
        this.lobby = lobby;
        this.elem = createDOM(`
            <div class="content">
                <ul class="room-list">
                    <li class="room-item">
                    <a href="#/chat/1"> Chatroom 1</a>
                    </li>
                    <li class="room-item">
                    <a href="#/chat/2"> Chatroom 2 </a>
                    </li>
                    <li class="room-item">
                    <a href="#/chat/3"> Chatroom 3 </a>
                    </li>
                    <li class="room-item">
                    <a href="#/chat/4"> Chatroom  4</a>
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

        this.buttonElem.addEventListener('click', (event) => {
            const roomName = this.inputElem.value.trim();
            const roomImage = 'default-image.png';

            // Call Service.addRoom with name and image data
            Service.addRoom({ name: roomName, image: roomImage, messages: [] })
                .then(newRoom => {
                    this.lobby.addRoom(newroom._id, newRoom.name, newRoom.image); // Only add room after server returns a successful response
                })
                .catch(error => {
                    return Promise.reject(new Error(error.message));
                });
        });

        this.lobby.onNewRoom = (room) => {
            const roomItem = createDOM(`
                <li class="room-item">
                    <a href="#/chat/${room.id}">${room.name}</a>
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
                    <a href='#/chat/${room.id}'>${room.name}</a>
                </li>
            `);
            this.listElem.appendChild(roomItem);
        });
    }
}

// ChatView
class ChatView {
    constructor(socket) {
        this.socket = socket;
        this.room = null;
        this.elem = createDOM(`
            <div class="content">
                <h4 class="room-name">Room-Name</h4>
                <div class="message-list"></div>
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

        // Event Listener to Send Message
        this.buttonElem.addEventListener('click', () => this.sendMessage());
        this.inputElem.addEventListener('keyup', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent newline
                this.sendMessage();     // Call sendMessage method
            }
        });

        // Event Listener for Scrolling
        this.chatElem.addEventListener('wheel', (event) => {
            if (!this.room) return;
        
            const isAtTop = this.chatElem.scrollTop === 0;
            const isScrollingUp = event.deltaY < 0;
            const canLoadMore = this.room.canLoadConversation;

            console.log("isAtTop:", isAtTop, "isScrollingUp:", isScrollingUp, "canLoadMore:", canLoadMore);
        
            if (isAtTop && isScrollingUp && canLoadMore) {
                const { value: promise, done } = this.room.getLastConversation.next();
                console.log("Promise:", promise, "Done:", done);
        
                if (!done && promise) {
                    promise.then(conversation => {
                        this.room.getLastConversation.next(conversation);
                    }).catch(error => {
                        console.error("Error in promise", error);
                        this.room.getLastConversation.next(null);
                    });
                }
            }
        });
        
    }

    sendMessage() {
        const messageText = this.inputElem.value.trim()
        if (messageText) {
            this.room.addMessage(profile.username, messageText);
            this.inputElem.value = '';
        }
        // Prepare the message to send to the server
        const messageToSend = {
            roomId: this.room.id,      // The current room's ID
            text: messageText           // The message text
        };

        // Serialize the message object as a JSON string and send it to the server via WebSocket
        this.socket.send(JSON.stringify(messageToSend));
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

        // Set up the onFetchConversation callback to load multiple messages at the top
        this.room.onFetchConversation = (conversation) => {
            const messages = conversation.messages;
            const previousScrollHeight = this.chatElem.scrollHeight;
        
            // Reverse the messages to maintain chronological order when prepending
            messages.slice().reverse().forEach(message => {
                const messageBox = this.createMessageBox(message);
                this.chatElem.insertBefore(messageBox, this.chatElem.firstChild);
            });
        
            const newScrollHeight = this.chatElem.scrollHeight;
            this.chatElem.scrollTop = newScrollHeight - previousScrollHeight;
        };
        
    }

    createMessageBox(message) {
        const isCurrentUser = message.username === profile.username;
        const messageClass = isCurrentUser ? 'message my-message' : 'message';
        const messageTextClass = isCurrentUser ? 'message-text' : 'message-model-text';
    
        const messageContainer = document.createElement('div');
        messageContainer.className = messageClass;
    
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'message-user';
        usernameSpan.textContent = message.username;
    
        const messageTextSpan = document.createElement('span');
        messageTextSpan.className = messageTextClass;
        messageTextSpan.textContent = message.text;

        messageContainer.appendChild(usernameSpan);
        messageContainer.appendChild(messageTextSpan);
    
        return messageContainer;
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
        this.canLoadConversation = true;
        this.getLastConversation = makeConversationLoader(this);
        this.getLastConversation.next(); // Start the generator
        
        this.timestamp = Date.now();

        console.log("getLastConversation next:", this.getLastConversation.next());
    }

    addMessage(username, text) {
        if (text.trim() === '') return;

        const newMessage = { username, text, };

        this.messages.push(newMessage);
        if (typeof this.onNewMessage === 'function') {
            this.onNewMessage(newMessage);
        }
    }

    addConversation(conversation) {
        // Prepend the messages to the beginning of the messages array
        this.messages = [...conversation.messages, ...this.messages];

        // Call the onFetchConversation callback if defined
        if (typeof this.onFetchConversation === 'function') {
            this.onFetchConversation(conversation);
        }
    }
}

class Lobby {
    constructor() {
        this.rooms = {}; // Set rooms to an empty object

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
class Models {
    constructor() {
        this.models = {}; // Set rooms to an empty object

    }

    getModel(roomId) {
        return this.rooms[roomId];
    }

}

function renderModelChat(modelName) {
    const pageView = document.querySelector('#page-view');

    // Create a chatroom for the model
    const modelChatElem = createDOM(`
        <div class="content">
            <h4 class="model-name">${modelName}</h4>
            <div class="message-list"></div>
            <div class="page-control">
                <textarea placeholder="Type your message"></textarea>
                <button>Send</button>
            </div>
        </div>
    `);

    const messageListElem = modelChatElem.querySelector('.message-list');
    const inputElem = modelChatElem.querySelector('textarea');
    const sendButtonElem = modelChatElem.querySelector('button');

    // Function to escape HTML special characters to prevent XSS attacks
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, function (tag) {
            const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return charsToReplace[tag] || tag;
        });
    }

    // Function to handle sending messages
    function sendMessage() {
        const inputString = inputElem.value.trim();
        if (inputString) {
            // Disable the send button and input box
            sendButtonElem.disabled = true;
            inputElem.disabled = true;

            // Add the user's message to the chat
            const userMessageElem = createDOM(`
                <div class="message my-message">
                    <span class="message-user">You:</span>
                    <span class="message-text">${escapeHTML(inputString)}</span>
                </div>
            `);
            messageListElem.appendChild(userMessageElem);
            inputElem.value = ''; // Clear the input field

            // Add the bot's typing indicator to the chat
            const typingIndicatorElem = createDOM(`
                <div class="message typing">
                    <span class="message-user">${modelName}:</span>
                    <span class="message-model-text">
                        <span class="typing-indicator">
                            <span></span><span></span><span></span>
                        </span>
                    </span>
                </div>
            `);
            messageListElem.appendChild(typingIndicatorElem);
            messageListElem.scrollTop = messageListElem.scrollHeight; // Scroll to the bottom

            // Record the start time
            const startTime = Date.now();

            fetch(`/query?input_string=${encodeURIComponent(inputString)}&model=${encodeURIComponent(modelName)}`)
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(await response.text());
                    }
                    return response.json();
                })
                .then((reply) => {
                    // Remove the typing indicator
                    messageListElem.removeChild(typingIndicatorElem);

                    // Calculate the response time
                    const endTime = Date.now();
                    const responseTime = ((endTime - startTime) / 1000).toFixed(2); // in seconds

                    // Extract answer and sources from the reply
                    const answer = reply.answer;
                    const sources = reply.sources;

                    // Format the sources as a list
                    const sourcesList = sources.map(source => `<li>${escapeHTML(source)}</li>`).join('');
                    const sourcesHTML = sources.length > 0 ? `<div class="sources"><strong>Sources:</strong><ul>${sourcesList}</ul></div>` : '';

                    // Add the bot's reply to the chat
                    const replyElem = createDOM(`
                        <div class="message">
                            <span class="message-user">${modelName}:</span>
                            <span class="message-model-text">
                                ${escapeHTML(answer)}
                                ${sourcesHTML}
                                <div class="response-time">Response time: ${responseTime} seconds</div>
                            </span>
                        </div>
                    `);
                    messageListElem.appendChild(replyElem);
                    messageListElem.scrollTop = messageListElem.scrollHeight; // Scroll to the bottom
                })
                .catch((error) => {
                    // Remove the typing indicator
                    messageListElem.removeChild(typingIndicatorElem);

                    console.error("Error querying model:", error);

                    // Optionally, display an error message in the chat
                    const errorMessageElem = createDOM(`
                        <div class="message error-message">
                            <span class="message-user">${modelName}:</span>
                            <span class="message-text">An error occurred. Please try again.</span>
                        </div>
                    `);
                    messageListElem.appendChild(errorMessageElem);
                })
                .finally(() => {
                    // Re-enable the send button and input box after fetch completes
                    sendButtonElem.disabled = false;
                    inputElem.disabled = false;
                    inputElem.focus(); // Focus back on the input box
                });
        }
    }

    // Add event listener to the send button
    sendButtonElem.addEventListener('click', () => {
        sendMessage();
    });

    // Add event listener for 'Enter' key in the input box
    inputElem.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent new line
            sendMessage();
        }
    });

    // Replace the current view with the model chat view
    emptyDOM(pageView);
    pageView.appendChild(modelChatElem);
}


function main() {

    // Create a WebSocket instance
    const socket = new WebSocket('ws://localhost:8000'); // Test server

    // Handle WebSocket connection errors
    socket.onopen = function () {
        console.log("WebSocket connection established");
    };

    socket.onerror = function (error) {
        console.error("WebSocket error: ", error);
    };

    socket.onclose = function () {
        console.log("WebSocket connection closed");
    };

    //add event listener on message:
    socket.addEventListener('message', function (event) {
        const messageData = JSON.parse(event.data); // Parse the message (JSON)

        const { roomId, username, text } = messageData;

        // Get the corresponding room
        const room = lobby.getRoom(roomId);
        if (room) {
            // Add the message to the Room
            room.addMessage(username, text);
        } else {
            console.error("Room not found for id: " + roomId);
        }
    });

    Service.getProfile()
        .then(user => {
            profile.username = user.username;
        })
        .catch(error => {
            console.error("Failed to get profile:", error);
        });

    var lobby = new Lobby();

    const lobbyView = new LobbyView(lobby);
    const chatView = new ChatView(socket);
    const profileView = new ProfileView();
    

   

    function renderRoute() {

        console.log(window.location.hash)
        const hash = window.location.hash.slice(2);  // Get the hash value, removing the leading '#'

        const pageView = document.querySelector('#page-view');

        if (hash === '') {
            emptyDOM(pageView);
            pageView.appendChild(lobbyView.elem);

        } else if (hash.startsWith('chat')) {
            const room_arr = hash.split('/');
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
        } else if (hash === 'models') {
            Service.getModels()
                .then(models => {
                    const modelsView = new ModelsView(models);
                    emptyDOM(pageView);
                    pageView.appendChild(modelsView.elem);
                })
                .catch(error => {
                    console.error("Failed to get models:", error);
                });
        }else if (hash.startsWith('model')) {
            const modelName = hash.split('/')[1];
            renderModelChat(modelName);
        }
    }

    // // Modify all anchor links to use hash-based navigation
    // document.querySelectorAll('a').forEach(anchor => {
    //     const href = anchor.getAttribute('href');
    //     if (!href.startsWith('#')) {
    //         anchor.href = `#${href}`;
    //     }
    // });


    let refreshLobby = function refreshLobby() {
        Service.getAllRooms().then(roomList => {
            roomList.forEach(room => {
                if (lobby.rooms[room._id]) {
                    // Room exists, update name and image
                    if (lobby.rooms[room._id].id == 'room-1') {
                        console.log("Refresh Lobby Messages: ", lobby.rooms[room._id].messages);
                    }
                    lobby.rooms[room._id].name = room.name;
                    lobby.rooms[room._id].image = room.image;
                } else {
                    // Room does not exist, add new room
                    lobby.addRoom(room._id, room.name, room.image, room.messages);
                }
            });
            lobbyView.redrawList(); // Redraw the lobby view
        }).catch(error => {
            console.error("Failed to refresh lobby:", error);
        });
    }

    // Attach renderRoute to window popstate event to handle url change
    window.addEventListener('popstate', renderRoute);
    window.addEventListener('load',renderRoute);

    // Initial rendering
    renderRoute();
    refreshLobby();
    setInterval(refreshLobby, 5000); // Refresh every 5 seconds

    // Testing Purposes
    cpen322.export(arguments.callee, { main, renderRoute, lobbyView, chatView, profileView, lobby, refreshLobby, socket, makeConversationLoader });
}

// Run the main function when the window loads
window.addEventListener('load', main);

