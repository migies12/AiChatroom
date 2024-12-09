const { MongoClient, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v6.3 - [API Documentation](http://mongodb.github.io/node-mongodb-native/6.3/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		const client = new MongoClient(mongoUrl);

		client.connect()
		.then(() => {
			console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
			resolve(client.db(dbName));
		}, reject);
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = async function() {
    try {
        const db = await this.connected; // Wait for the database connection
        const chatrooms = await db.collection('chatrooms').find().toArray(); // Directly await the result
        return chatrooms; // Return the chatrooms array
    } catch (err) {
        console.error("Error retrieving chatrooms:", err); // Log the error
        throw err; // Rethrow the error for further handling if needed
    }
}

Database.prototype.getRoom = async function(room_id) {
    try {
        const db = await this.connected; // Wait for the database connection

        // Check if room_id is a valid ObjectId
        let queryId;
        if (ObjectId.isValid(room_id)) {
            queryId = new ObjectId(room_id); // Convert to ObjectId if valid
        } else {
            queryId = room_id; // Assume it's a string
        }

        // Query the 'chatrooms' collection
        const room = await db.collection('chatrooms').findOne({ _id: queryId }); // Await the result

        return room || null; // Return the found room or null if not found
    } catch (err) {
        console.error("Error retrieving chatroom:", err); // Log the error
        throw err; // Rethrow the error for further handling if needed
    }
}



Database.prototype.addRoom = async function(room) {
    // Ensure the room has a name

    if (!room.name) {
        throw new Error("Room name is required."); // Reject if name is missing
    }

    try {
        const db = await this.connected; // Wait for the database connection
        const result = await db.collection('chatrooms').insertOne(room); // Insert the room into the collection
        
        // Attach the generated _id from MongoDB to the room object directly
        room._id = result.insertedId;

        // Return the room object itself, with the newly added _id
        return room;
    } catch (err) {
        console.error("Error adding room:", err); // Log the error
        throw err; // Rethrow the error for further handling if needed
    }
}




// In Database.js

Database.prototype.getLastConversation = function(room_id, before = Date.now()) {
    return new Promise(async (resolve, reject) => {
        // Validate room_id
        if (!room_id) {
            return reject(new Error("room_id is required."));
        }

        try {
            const db = await this.connected; // Ensure database connection

            // Query for conversations with the specified room_id and timestamp condition
            const conversation = await db.collection('conversations')
                .find({ room_id: room_id, timestamp: { $lt: Number(before) } })
                .sort({ timestamp: -1 }) // Sort by timestamp descending
                .limit(1) // Only get the most recent conversation before 'before'
                .toArray();

            // Resolve with the found conversation or null if none was found
            resolve(conversation[0] || null);
        } catch (err) {
            console.error("Error retrieving last conversation:", err);
            reject(new Error("Failed to retrieve last conversation from the database."));
        }
    });
}



// In Database.js

Database.prototype.addConversation = function(conversation) {
    return new Promise(async (resolve, reject) => {
        // Validate the conversation object and its fields
        if (!conversation || typeof conversation !== 'object') {
            return reject(new Error("Conversation must be a valid object."));
        }

        const { room_id, timestamp, messages } = conversation;
        if (!room_id || !timestamp || !messages || !Array.isArray(messages)) {
            return reject(new Error("Conversation requires room_id, timestamp, and messages (array)."));
        }

        try {
            const db = await this.connected; // Wait for an active database connection
            const result = await db.collection('conversations').insertOne(conversation); // Insert conversation into the collection

            // Attach the generated _id from MongoDB to the conversation object directly
            conversation._id = result.insertedId;

            // Resolve the Promise with the updated conversation object (including the new _id)
            resolve(conversation);
        } catch (err) {
            console.error("Error adding conversation:", err);
            reject(new Error("Failed to add conversation to the database."));
        }
    });
}

Database.prototype.getUser = function(username) {
    if (!username) {
        throw new Error("Username is required."); // Reject if username is missing
    }
    return new Promise(async (resolve, reject) => {
        try {
            const db = await this.connected; // Wait for the database connection
            const user = await db.collection("users").findOne({ username }); // Query for the user
            if (!user) {
                return resolve(null); // Resolve with null if user not found
            }
            resolve(user); // Return the user object
        } catch (err) {
            console.error("Error retrieving user:", err); // Log the error
            reject(err); // Reject the promise with the error
        }
    });
};


Database.prototype.getModels = async function() {
    try {
        const db = await this.connected; // Wait for the database connection
        const chatrooms = await db.collection('models').find().toArray(); // Directly await the result
        return chatrooms; // Return the chatrooms array
    } catch (err) {
        console.error("Error retrieving chatrooms:", err); // Log the error
        throw err; // Rethrow the error for further handling if needed
    }
}

Database.prototype.getModel = function(modelname) {
    if (!modelname) {
        throw new Error("Model Name is required."); // Reject if username is missing
    }
    return new Promise(async (resolve, reject) => {
        try {
            const db = await this.connected; // Wait for the database connection
            const model = await db.collection("models").findOne({ modelname }); // Query for the user
            if (!model) {
                return resolve(null); // Resolve with null if user not found
            }
            resolve(model); // Return the user object
        } catch (err) {
            console.error("Error retrieving user:", err); // Log the error
            reject(err); // Reject the promise with the error
        }
    });
};





module.exports = Database;
