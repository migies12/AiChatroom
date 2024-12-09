/* --- Imports --- */
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const crypto = require('crypto');
const cpen322 = require('./cpen322-tester.js');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const messageBlockSize = 10;

/* --- MongoDB Setup --- */
const mongoUrl = "mongodb://localhost:27017/cpen322-messenger"
const dbName = 'cpen322-messenger';
const db = new Database(mongoUrl, dbName);

db.status().then(status => {
    if (status.error) {
        console.error("Failed to connect to MongoDB:", status.error);
    } else {
        console.log(`[MongoClient] Connected to ${mongoUrl}/${dbName}`);
    }
}).catch(console.error);

/* --- Express App Setup --- */
const host = 'localhost';
const port = 3000;

let app = express();
app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

const chatrooms = [
    { id: "1", name: 'General Chat', image: 'general.png' },
    { id: "2", name: 'Gaming Lounge', image: 'gaming.png' },
    { id: "3", name: 'Study Group', image: 'study.png' }
];
const messages = {};

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

function isCorrectPassword(password, saltedHash) {
    // Extract the salt from the first 20 characters of saltedHash
    const salt = saltedHash.substring(0, 20);

    // Get the remaining 44 characters which are the base64 encoded SHA256 hash
    const storedHash = saltedHash.substring(20);

    // Concatenate the salt with the provided password
    const saltedPassword = password + salt;

    // Compute the SHA256 hash of the salted password
    const hash = crypto.createHash('sha256').update(saltedPassword).digest('base64');

    // Compare the computed hash with the stored hash
    return hash === storedHash;
}

async function initializeMessages() {
    try {
        const rooms = await db.getRooms(); // Get chatrooms from the database
        rooms.forEach(room => {
            messages[room._id.toString()] = []; // Initialize empty array for each room using _id
        });
    } catch (error) {
        console.error('Error initializing messages:', error);
    }
}

function sanitizeText(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Call the initializeMessages function
initializeMessages().then(() => {
    console.log('Messages object initialized:', messages);
}).catch(err => {
    console.error('Failed to initialize messages:', err);
});

/* --- WebScoket ---*/
const broker = new WebSocketServer({ port: 8000 });

broker.on('connection', (ws, request) => {
    console.log('New client connected');

    // Step 1: Read cookies from request headers
    const cookies = request.headers.cookie;
    if (!cookies) {
        console.log('No cookies found, closing connection.');
        ws.close();
        return;
    }

    const token = cookies.split('; ').find(cookie => cookie.startsWith('cpen322-session='));
    if (!token) {
        console.log('Session token not found in cookies, closing connection.');
        ws.close();
        return;
    }

    const sessionToken = token.split('=')[1];

    const username = sessionManager.getUsername(sessionToken);
    if (!username) {
        console.log('Invalid session token, closing connection.');
        ws.close();
        return;
    }

    ws.username = username;
    ws.on('message', async (message) => {
        let parsedMessage;

        try {
            parsedMessage = JSON.parse(message);
        } catch (err) {
            console.error('Failed to parse message:', err);
            ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
            return;
        }

        let { roomId, text } = parsedMessage;
        if (!roomId || !text ) {
            console.error('Invalid message format');
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
            return;
        }

        text = sanitizeText(text)

        const username = ws.username;
        const newMessage = { username, text};

        if (!messages[roomId]) {
            messages[roomId] = [];
        }

        console.log("\n ------ Before pushing new message ------ : \n", messages[roomId]);
        messages[roomId].push(newMessage);

        // Check if messages array has reached the block size
        if (messages[roomId].length === messageBlockSize) {
            const sortedMessages = messages[roomId].slice();//.sort((a, b) => a.timestamp - b.timestamp);

            // Create a new conversation block with the accumulated messages
            const conversation = {
                room_id: roomId,
                timestamp: Date.now(), // Use UNIX time in milliseconds
                messages: sortedMessages
            };

            try {
                // Save the conversation block to the database
                await db.addConversation(conversation);

                // Clear the messages array for this room after saving
                messages[roomId] = [];
            } catch (err) {
                console.error(`Failed to save conversation for room ${roomId}:`, err);
                // Keep the messages array intact in case of error
            }
        }

        // Broadcast the new message to all clients except the sender
        broker.clients.forEach((client) => {
            if (client !== ws && client.readyState === client.OPEN) {
                client.send(JSON.stringify({ roomId, username, text }));
            }
        });
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

/* --- Session Manager --- */
const sessionManager = new SessionManager();
const clientApp = 'client';

app.use('/login', express.static(path.join(__dirname, clientApp, 'login.html')));
app.use('/login.html', express.static(path.join(__dirname, clientApp, 'login.html')));
app.use('/style.css', express.static(path.join(__dirname, clientApp, 'style.css')));
app.use('/images', express.static(path.join(__dirname, clientApp, 'images')));
app.use('/lib', express.static(path.join(__dirname, clientApp, 'lib')));

app.use('/login.html', express.static(path.join(__dirname, clientApp, 'login.html')));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Fetch user data from the database
        const user = await db.getUser(username);

        if (!user) {
            console.log('User not found');
            return res.redirect('/login');
        }
        console.log('User found:', user);
        console.log('Password:', password);

        // Check if the password is correct
        if (isCorrectPassword(password, user.password)) {
            console.log('Password is correct');
            // Create a session and redirect to the home page
            sessionManager.createSession(res, username);
            console.log('Session created, redirecting to /');
            return res.redirect('/');
        } else {
            console.log('Incorrect password');
            return res.redirect('/login');
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Internal Server Error');
    }
});

/* --- Apply session middleware to protected routes --- */
app.use(sessionManager.middleware);


app.get('/profile', (req, res) => {
    res.json({ username: req.username });
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, clientApp, 'index.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, clientApp, 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, clientApp, 'index.html'));
});
app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, clientApp, 'app.js'));
});
app.get('/logout', (req, res) => {
    sessionManager.deleteSession(req);
    res.clearCookie('cpen322-session');
    res.redirect('/login');
});

app.route('/chat')
    .get(async function(req, res) {
        try {
            // Fetch chatrooms from the database
            const chatrooms = await db.getRooms(); // Use getRooms to retrieve rooms

            const response = chatrooms.map(room => ({
                _id: room._id.toString(), // Use _id as string for the ID
                name: room.name,
                image: room.image,
                messages: messages[room._id.toString()] || [] // Use toString to match keys in messages object
            }));

            res.json(response); // Send the response as JSON
        } catch (error) {
            console.error('Error fetching chatrooms:', error);
            res.status(500).json({ error: 'Error retrieving chat rooms' });
        }
    })
	.post(async function(req, res) {
        const { name, image, req_messages } = req.body; // Destructure incoming data

        // Validate: name is required
        console.log('Adding new room:', name, image, req_messages);
        if (!name) {
            return res.status(400).json({ message: "Room name is required" }); // 400 Bad Request
        }

        // Create a new room object
        const newRoom = {
            name: name,
            image: image || 'default-image.png', // Set default image if none provided
            messages: req_messages || [] // Set default empty array if none provided
        };


        try {
            // Add the new room to the database using db.addRoom
            const addedRoom = await db.addRoom(newRoom);

            // Initialize an empty message array for this room
            messages[addedRoom._id.toString()] = addedRoom.messages;
            console.log('Added room:', addedRoom);
            // Respond with the newly created room
            res.status(200).json(addedRoom); // 201 Created
        } catch (error) {
            console.error('Error adding room:', error);
            // Send appropriate HTTP response based on the error
            res.status(500).json({ message: error.message }); // 500 Internal Server Error
        }
    });

/* --- AI Model --- */   

app.route('/models')
.get(async function(req, res) {
    try {
        // Fetch chatrooms from the database
        const models = await db.getModels(); // Use getRooms to retrieve rooms

        const response = models.map(model => ({
            name: model.name,
        }));

        console.log(response)

        res.json(response); // Send the response as JSON
    } catch (error) {
        console.error('Error fetching chatrooms:', error);
        res.status(500).json({ error: 'Error retrieving chat rooms' });
    }
})

app.route('/model')
.get(async function(req, res) {
    try {
        // Fetch chatrooms from the database
        const models = await db.getModels(); // Use getRooms to retrieve rooms

        const response = models.map(model => ({
            name: model.name,
        }));

        res.json(response); // Send the response as JSON
    } catch (error) {
        console.error('Error fetching chatrooms:', error);
        res.status(500).json({ error: 'Error retrieving chat rooms' });
    }
})

// New GET endpoint for retrieving a specific model room by name
app.get('/model/:model_name', async (req, res) => {
    const { model_name } = req.params; // Get room_id from request parameters

    const model = await db.getRoom(model_name.trim()); // Use the getRoom method

    try {

        if (model) {
            res.json(model); // Send the found room as JSON
        } else {
            // Room not found, return 404
            res.status(404).json({ error: `Room ${room_id} was not found` });
        }
    } catch (error) {
        console.error('Error retrieving room:', error);
        res.status(500).json({ error: 'Error retrieving the room' });
    }
});

// http://localhost:3000/query?input_string=What is the mark breakdown for CPEN 320 course such as Active and constructive participation on the forum counts towards participation marks&model=Syllabus
app.get('/query', (req, res) => {
    const inputString = req.query.input_string; // Get input_string from query parameter
    const model = req.query.model; // Get model from query parameter'

    console.log(inputString)
    console.log(model)

    // Validate input_string
    if (!inputString) {
        return res.status(400).json({ error: 'input_string is required' });
    }

    // Validate model parameter
    const validModels = ['Martin', 'Miguel', 'Course', 'Syllabus'];
    if (!model || !validModels.includes(model)) {
        return res.status(400).json({ error: `Invalid or missing model. Valid options are: ${validModels.join(', ')}` });
    }

    // Spawn a Python process to run query.py
    const pythonProcess = spawn('python3', ['llm/query.py', inputString, model]);

    let result = '';

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Python script failed to execute' });
        }
        try {
            console.log('Python output:', result);
            const output = JSON.parse(result);
            res.status(200).json(output);
        } catch (err) {
            console.error('Failed to parse Python output:', err);
            res.status(500).json({ error: 'Failed to parse Python output' });
        }
    });
});
    

// New GET endpoint for retrieving a specific chat room by room_id
app.get('/chat/:room_id', async (req, res) => {
    const { room_id } = req.params; // Get room_id from request parameters

    try {
        const room = await db.getRoom(room_id.trim()); // Use the getRoom method

        if (room) {
            res.json(room); // Send the found room as JSON
        } else {
            // Room not found, return 404
            res.status(404).json({ error: `Room ${room_id} was not found` });
        }
    } catch (error) {
        console.error('Error retrieving room:', error);
        res.status(500).json({ error: 'Error retrieving the room' });
    }
});

app.get('/chat/:room_id/messages', async (req, res) => {
    const { room_id } = req.params;
    const before = req.query.before ? parseInt(req.query.before, 10) : Date.now();

    if (!room_id) {
        return res.status(400).json({ error: "room_id is required in the URL." });
    }

    try {
        // Retrieve the last conversation based on room_id and optional 'before' timestamp
        const conversation = await db.getLastConversation(room_id, before);

        // If no conversation found, respond with 404
        if (!conversation) {
            return res.status(404).json({ error: "No conversation found." });
        }

        // Send the found conversation as a response
        res.status(200).json(conversation);
    } catch (err) {
        console.error("Error fetching conversation:", err);
        res.status(500).json({ error: "An error occurred while fetching the conversation." });
    }
});

app.use((err, req, res, next) => {
    console.error("Error handler called with error:", err);
    if (err instanceof SessionManager.Error) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ error: err.message });
        } else {
            return res.redirect('/login');
        }
    }
    return res.status(500).send('An error occurred 500');
});

app.listen(port, () => {
    console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, { app });
cpen322.export(__filename, { chatrooms, messages, broker, db, messageBlockSize, isCorrectPassword, sessionManager});
