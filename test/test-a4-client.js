 // Set up the onFetchConversation callback to load multiple messages at the top
    this.room.onFetchConversation = (messages) => {
        // Record the current scroll height before adding new messages
        const previousScrollHeight = this.chatElem.scrollHeight;

        // Render the new conversation messages at the top
        messages.forEach(message => {
            const messageBox = this.createMessageBox(message);
            this.chatElem.prepend(messageBox);
        });

        // Calculate the new scroll height after rendering
        const newScrollHeight = this.chatElem.scrollHeight;

        // Adjust the scroll position to keep the view consistent
        this.chatElem.scrollTop += newScrollHeight - previousScrollHeight;
    };// override addEventListener to cache listener callbacks for testing
const __tester = {
	listeners: [],
	timers: [],
	exports: new Map(),
	defaults: {
		testRoomId: 'room-1',
		image: 'assets/everyone-icon.png',
		webSocketServer: 'ws://localhost:8000'
	},
	oldAddEventListener: HTMLElement.prototype.addEventListener,
	newAddEventListener: function (type, listener, ...options){
		__tester.listeners.push({
			node: this,
			type: type,
			listener: listener,
			invoke: evt => listener.call(this, evt)
		});
		return __tester.oldAddEventListener.call(this, type, listener, ...options);
	},
	oldSetInterval: window.setInterval,
	newSetInterval: function (func, delay, ...args){
		__tester.timers.push({
			type: 'Interval',
			func: func,
			delay: delay
		});
		return __tester.oldSetInterval.call(this, func, delay, ...args);
	},
	export: (scope, dict) => {
		if (!__tester.exports.has(scope)) __tester.exports.set(scope, {});
		Object.assign(__tester.exports.get(scope), dict);
	},
	setDefault: (key, val) => { __tester.defaults[key] = val; }
};
HTMLElement.prototype.addEventListener = __tester.newAddEventListener;
WebSocket.prototype.addEventListener = __tester.newAddEventListener;
window.setInterval = __tester.newSetInterval;
window['cpen322'] = { export: __tester.export, setDefault: __tester.setDefault };

window.addEventListener('load', () => {
	const a = 'a4';
	// from a3 onwards, test servers are used to emulate server behavior
	const originalFetch = window.fetch;
	const safeFetch = (resource, init) => originalFetch(resource, init)
		.then(resp => (resp.status === 200 ? resp.text().then(text => text ? JSON.parse(text) : text) : resp.text().then(text => Promise.reject(new Error(text)))))

	const words = ["Alligator","Alpaca","Ant","Antelope","Ape","Armadillo","Badger","Beaver","Beetle","Buffalo","Camel","Cattle","Cheetah","Chimpanzee","Chinchilla","Clam","Crab","Crocodile","Deer","Dog","Dolphin","Donkey","Ferret","Fox","Giraffe","Gnat","Goldfish","Gorilla","Grasshopper","Hamster","Hare","Hedge Dog","Hornet","Hound","Jackal","Jellyfish","Kangaroo","Lizard","Llama","Manatee","Marten","Mole","Moose","Mosquito","Muskrat","Octopus","Ox","Oyster","Pig","Platypus","Porcupine","Puppy","Rabbit","Rat","Reindeer","Sardine","Snake","Spider","Squirrel","Swan","Trout","Turtle","Wasp","Water Buffalo","Weasel","Woodchuck","Yak","Zebra"];
	const selectRandom = (list) => list[Math.floor(list.length * Math.random())];
	const makeTestMessage = () => ({ username: selectRandom(words), text: Math.random().toString() });
	const makeTestRoom = () => new Room(
		Math.random().toString(),
		'Team ' + selectRandom(words),
		__tester.defaults.image,
		[{
			username: Math.random().toString(),
			text: Math.random().toString()
		}, {
			username: Math.random().toString(),
			text: Math.random().toString()
		}]);
	const makeTestConversation = (room_id, timestamp) => ({
		room_id: room_id,
		timestamp: timestamp,
		messages: Array.from({ length: 10 }, _ => makeTestMessage())
	});

	const remoteFunc = (func, ...args) => safeFetch('cpen322/' + a, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ func, args })
	});

	// checks whether 2 objects are "equivalent" - that is, not identical by reference, but equal by value
	const isEquivalent = (a, b) => {
		if (typeof a === 'undefined') return typeof b === 'undefined';
		if (a === null) return b === null;

		let proto = Object.getPrototypeOf(a);
		if (proto === Object.getPrototypeOf(b)){
			if (proto === Boolean.prototype
				|| proto === Number.prototype
				|| proto === String.prototype){
				return a === b;
			}
			else if (proto === Array.prototype){
				return a.length === b.length && a.reduce((acc, e, i) => acc && isEquivalent(e, b[i]), true);
			}
			else {
				let keys = Object.keys(a).sort();
				return isEquivalent(keys, Object.keys(b).sort())
					&& keys.reduce((acc, k, i) => acc && isEquivalent(a[k], b[k]), true);
			}
		}
		else return false;
	};

	/* tests */
	const tests = [{
		id: '1',
		description: 'Setting up Database',
		maxScore: 1,
		run: async () => {

			let result = {
				id: 1,
				score: 0,
				comments: []
			};

			print('(Server) Checking if "mongodb" NPM module is installed');
			let installed = await remoteFunc('checkRequire', 'mongodb');
			if (installed.error){
				result.comments.push(printError('"mongodb" module was not installed at the server: ' + installed.error));
			}
			else {
				result.score += 0.25;
				printOK('require("mongodb") worked');

				try {
					print('(Server) Trying to access "db" in server.js');
					let db = await remoteFunc('getGlobalObject', 'db');

					if (!db){
						result.comments.push(printError('"db" object in server.js was not found/exported'));
					}
					else {

						print('(Server) Checking if "db" is a Database instance');
						let isDatabase = await remoteFunc('checkObjectType', 'db', './Database.js/');

						if (isDatabase){
							result.score += 0.25;
							printOK('"db" is a Database instance');

							print('(Server) Checking if "db" is connected');
							let mongoStatus = await remoteFunc('callObjectByString', 'db.status');

							if (mongoStatus.error !== null){
								result.comments.push(printError('"db" is not connected to a MongoDB service: ' + mongoStatus.error.message));
							}
							else {
								result.score += 0.5;
								printOK('"db" is connected to a MongoDB service at ' + mongoStatus.url + '/' + mongoStatus.db);
							}
						}
						else {
							result.comments.push(printError('"db" object is not a "Database" instance'));
						}

					}
				}
				catch (err){
					result.comments.push(printError(err.message));
				}
			}

			return result;

		}
	},{
		id: '2',
		description: 'Reading Chat Rooms from the Database',
		maxScore: 5,
		run: async () => {
			let result = {
				id: 2,
				score: 0,
				comments: []
			};

			// we assume `db` is available
			try {
				print('(Server) Checking "Database.prototype.getRooms" implementation (by calling "db.getRooms")');
				let rooms = await remoteFunc('callObjectByString', 'db.getRooms');

				// it resolved to something
				result.score += 0.5;

				if (!(rooms instanceof Array)){
					if (rooms === null){
						result.comments.push(printError('"db.getRooms" should resolve to an Array. Test script got: null'));
					}
					else if (typeof rooms === 'undefined'){
						result.comments.push(printError('"db.getRooms" should resolve to an Array. Test script got: undefined'));
					}
					else {
						result.comments.push(printError('"db.getRooms" should resolve to an Array. Test script got: ' + Object.getPrototypeOf(rooms).constructor.name));
					}
				}
				else {
					result.score += 0.5;
					printOK('"db.getRooms" resolved to an Array');
					
					print('(Server) Checking signature of objects returned by "db.getRooms" (expecting at least 2 rooms to exist in the database)');
					if (rooms.length > 1){
						let hasObjects = rooms.slice(0, 2).reduce((acc, item) => {
							if (!item._id){
								result.comments.push(printError('The object in the array returned by "db.getRooms" is missing "_id" property'));
							}
							else if (!item.name){
								result.comments.push(printError('The object in the array returned by "db.getRooms" is missing "name" property'));
							}
							else if (!item.image){
								result.comments.push(printError('The object in the array returned by "db.getRooms" is missing "image" property'));
							}
							else {
								return acc && true;
							}
							return false;
						}, true);

						if (hasObjects){
							result.score += 0.5;
							printOK('The objects in the array has the right properties');
						}
						
						// Now that db.getRooms is okay, we can test the rest

						// we assume `messages` is available
						try {
							print('(Server) Checking if "messages" was initialized after calling "db.getRooms"');
							let messages = await remoteFunc('getGlobalObject', 'messages');

							let initialized = rooms.reduce((acc, item) => acc && messages[item._id] && messages[item._id] instanceof Array, true);
							if (initialized){
								result.score += 0.5;
								printOK('"messages" has an array for each room in the database');

								// compare result of GET /chat with db.getRooms
								// we assume /chat specs are correct w.r.t. a3.
								print('(Server) Checking if "/chat" GET endpoint was updated to use the database');
								try {
									let chatResponse = await safeFetch('/chat');
									let merged = rooms.map(room => Object.assign({ messages: messages[room._id] }, room));

									if (isEquivalent(merged, chatResponse)){
										result.score += 0.5;
										printOK('GET "/chat" endpoint returns the objects from "db.getRooms", combined with the "messages" object (as per A3 specs)');
									}
									else {
										result.comments.push(printError('Array returned at the GET "/chat" endpoint should be the result of "db.getRooms" combined with the "messages" object (as per A3 specs)'));
									}
								}
								catch (err){
									result.comments.push(printError('Error while checking GET "/chat" endpoint: ' + err.message));
								}

							}
							else {
								result.comments.push(printError('"messages" in server.js was not initialized as expected'));
							}
						}
						catch (err){
							result.comments.push(printError('Error while checking "messages" in server.js: ' + err.message));
						}
					}
					else {
						result.comments.push(printError('Test script expects at least 2 rooms for testing'));
					}
				}
			}
			catch (err){
				if (err.message.indexOf('timed out') > -1){
					result.comments.push(printError('"db.getRooms" did not resolve to anything (test timed out after waiting for 5 seconds)'));
				}
				else {
					result.comments.push(printError('Error upon calling "db.getRooms" in server.js: ' + err.message));
				}
			}

			// we assume `db` is available
			try {
				print('(Server) Checking "Database.prototype.getRoom" implementation (by calling "db.getRoom")');
				let room = await remoteFunc('callObjectByString', 'db.getRoom', __tester.defaults.testRoomId);

				// it resolved to something
				result.score += 0.5;
				printOK('"db.getRoom" resolved to an object');

				print('(Server) Checking signature of object returned by "db.getRoom"');
				if (!room._id){
					result.comments.push(printError('The object returned by "db.getRoom" is missing "_id" property'));
				}
				else if (room._id !== __tester.defaults.testRoomId){
					result.comments.push(printError('The "_id" of the object returned by "db.getRoom" does not match the requested room id'));
				}
				else if (!room.name){
					result.comments.push(printError('The object returned by "db.getRoom" is missing "name" property'));
				}
				else if (!room.image){
					result.comments.push(printError('The object returned by "db.getRoom" is missing "image" property'));
				}
				else {
					result.score += 0.5;
					printOK('The object has the right properties');

					// check GET /chat/:room_id endpoint
					print('(Server) Checking if "/chat/:room_id" GET endpoint was defined');
					try {
						let response = await safeFetch('/chat/' + __tester.defaults.testRoomId);

						if (isEquivalent(room, response)){
							result.score += 1;
							printOK('GET "/chat/:room_id" endpoint returns the object from "db.getRoom(room_id)"');
						}
						else {
							result.comments.push(printError('Object returned by "db.getRoom" is not equivalent to the object returned at the GET "/chat/:room_id" endpoint'));
						}
					}
					catch (err){
						result.comments.push(printError('Error while checking GET "/chat/:room_id" endpoint: ' + err.message));
					}

					// check GET /chat/:room_id Error 404
					print('(Server) Checking if "/chat/:room_id" GET endpoint returns HTTP error code');
					try {
						let response = await originalFetch('/chat/' + Math.random());
						if (response.status !== 404){
							result.comments.push(printError('GET "/chat/:room_id" endpoint should return HTTP Status 404 if the requested room does not exist'));
						}
						else {
							result.score += 0.5;
							printOK('GET "/chat/:room_id" endpoint returns HTTP 404 if room does not exist');
						}
					}
					catch (err){
						result.comments.push(printError('Unexpected error while checking GET "/chat/:room_id" endpoint error handling: ' + err.message));
					}
				}
			}
			catch (err){
				if (err.message.indexOf('timed out') > -1){
					result.comments.push(printError('"db.getRoom" did not resolve to anything (test timed out after waiting for 5 seconds)'));
				}
				else {
					result.comments.push(printError('Error upon calling "db.getRoom" in server.js: ' + err.message));
				}
			}

			return result;
		}
	},{
		id: '3',
		description: 'Writing Chat Room to the Database',
		maxScore: 3,
		run: async () => {
			let result = {
				id: 3,
				score: 0,
				comments: []
			};

			// we assume `db` is available, and db.getRoom is implemented
			try {
				let testRoom = makeTestRoom();

				print('(Server) Checking "Database.prototype.addRoom" implementation (by calling "db.addRoom")');
				let room = await remoteFunc('callObjectByString', 'db.addRoom', {
					name: testRoom.name,
					image: testRoom.image
				});

				// it resolved to something
				result.score += 0.25;
				printOK('"db.addRoom" resolved to an object');

				print('(Server) Checking signature of object returned by "db.addRoom"');
				if (!room._id){
					result.comments.push(printError('The object returned by "db.addRoom" is missing "_id" property'));
				}
				else if (!room.name){
					result.comments.push(printError('The object returned by "db.addRoom" is missing "name" property'));
				}
				else if (room.name !== testRoom.name){
					result.comments.push(printError('The "name" of the object returned by "db.addRoom" does not match the "name" requested to be added'));
				}
				else if (!room.image){
					result.comments.push(printError('The object returned by "db.addRoom" is missing "image" property'));
				}
				else if (room.image !== testRoom.image){
					result.comments.push(printError('The "image" of the object returned by "db.addRoom" does not match the "image" requested to be added'));
				}
				else {
					result.score += 0.5;
					printOK('The object has the right properties');

					print('(Server) Checking if the test room was added to the database (by calling "db.getRoom")');
					let added = await remoteFunc('callObjectByString', 'db.getRoom', room._id);

					if (isEquivalent(added, room)){
						result.score += 0.5;
						printOK('Got the room object added by "db.addRoom" by calling "db.getRoom"');

						// create the corresponding messages array,
						// because it's not handled by the student's app (we bypassed it by calling db.addRoom directly)
						await remoteFunc('setObjectByString', `messages["${room._id}"]`, []);
					}
					else {
						result.comments.push(printError('The object returned by "db.getRoom" is different from the object added by "db.addRoom"', "Added:", room, "Got:", added));
					}

					// check if addRoom checks the "name" field
					try {
						await remoteFunc('callObjectByString', 'db.addRoom', {});

						result.comments.push(printError('"db.addRoom" should reject if "name" field is missing'));
					}
					catch (err){
						result.score += 0.25;
						printOK('"db.addRoom" rejects with Error when given invalid argument');
					}

					// check POST /chat endpoint
					print('(Server) Checking if "/chat" POST endpoint was updated to use the database');

					testRoom = makeTestRoom();

					room = await safeFetch('/chat/', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ name: testRoom.name, image: testRoom.image })
					});

					printOK('POST "/chat" returned an object');

					print('(Server) Checking if the test room was added to the database (by calling "db.getRoom")');
					added = await remoteFunc('callObjectByString', 'db.getRoom', room._id);

					if (isEquivalent(added, room)){
						result.score += 0.5;
						printOK('Got the room object added via POST "/chat" endpoint by calling "db.getRoom"');
					}
					else {
						result.comments.push(printError('The object returned by "db.getRoom" is different from the object added by POST /chat'));
					}

					print('(Server) Checking if the `messages` object is still updated');
					let messages = await remoteFunc('getObjectByString', 'messages["' + room._id + '"]');

					if (isEquivalent(messages, [])){
						result.score += 0.5;
						printOK('messages["' + room._id + '"] was assigned an empty array');
					}
					else {
						result.comments.push(printError('An empty array should be assigned to messages["' + room._id + '"] in server.js', 'You have: ', messages));
					}

					// check POST /chat endpoint Error 400
					print('(Server) Checking if "/chat" POST endpoint returns HTTP 400 on bad request (already done in A3, but the behaviour should be kept)');
					room = await originalFetch('/chat/', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ image: testRoom.image })
					});

					if (room.status !== 400){
						result.comments.push(printError('Server should return HTTP status 400 when request is not formatted properly'));
					}
					else {
						result.score += 0.5;
						printOK('POST "/chat" endpoint returns HTTP 400 if the request body does not have required fields');
					}

				}
			}
			catch (err){
				if (err.message.indexOf('timed out') > -1){
					result.comments.push(printError('"db.addRoom" did not resolve to anything (test timed out after waiting for 5 seconds)'));
				}
				else {
					result.comments.push(printError('Error upon calling "db.addRoom" in server.js: ' + err.message));
				}
			}

			return result;
		}
	},{
		id: '4',
		description: 'Reading/Writing Message Blocks',
		maxScore: 7,
		run: async () => {
			let result = {
				id: 4,
				score: 0,
				comments: []
			};

			// we assume `db` is available, and db.getRoom is implemented
			try {
				print('(Server) Checking "Database.prototype.addConversation" implementation (by calling "db.addConversation")');
				let testConversation = makeTestConversation(__tester.defaults.testRoomId, Date.now() - 86400000);
				let conversation = await remoteFunc('callObjectByString', 'db.addConversation', testConversation);

				// it resolved to something
				result.score += 0.25;
				// printOK('"db.addConversation" resolved to an object');

				if (!conversation._id){
					result.comments.push(printError('The object returned by "db.addConversation" is missing "_id" property'));
				}
				else {
					let _id = conversation._id;
					delete conversation._id;	// temporarily detach _id to test equivalency
					let equiv = isEquivalent(testConversation, conversation);
					conversation._id = _id;

					if (equiv){
						result.score += 0.5;
						printOK('"db.addConversation" resolves to the conversation object added');

						// check if addCoversation checks the required fields
						try {
							await remoteFunc('callObjectByString', 'db.addConversation', {
								timestamp: testConversation.timestamp,
								messages: testConversation.messages
							});

							result.comments.push(printError('"db.addConversation" should reject if "room_id" field is missing'));
						}
						catch (err){
							result.score += 0.25;
							printOK('"db.addConversation" rejects with Error when "room_id" field is missing');
						}

						try {
							await remoteFunc('callObjectByString', 'db.addConversation', {
								room_id: testConversation.room_id,
								messages: testConversation.messages
							});

							result.comments.push(printError('"db.addConversation" should reject if "timestamp" field is missing'));
						}
						catch (err){
							result.score += 0.25;
							printOK('"db.addConversation" rejects with Error when "timestamp" field is missing');
						}

						try {
							await remoteFunc('callObjectByString', 'db.addConversation', {
								room_id: testConversation.room_id,
								timestamp: testConversation.timestamp
							});

							result.comments.push(printError('"db.addConversation" should reject if "messages" field is missing'));
						}
						catch (err){
							result.score += 0.25;
							printOK('"db.addConversation" rejects with Error when "messages" field is missing');
						}

						// addConversation is ok, test the rest
						try {


							print('(Server) Checking "Database.prototype.getLastConversation" implementation (by calling "db.getLastConversation")');
							conversation = await remoteFunc('callObjectByString', 'db.getLastConversation', __tester.defaults.testRoomId, testConversation.timestamp + 2000);

							// it resolved to something
							result.score += 0.25;
							// printOK('"db.getLastConversation" resolved to an object');

							testConversation._id = _id; 	// attach _id to test equivalency
							let equiv = isEquivalent(testConversation, conversation);

							if (equiv){
								result.score += 0.75;
								printOK('"db.getLastConversation" resolves to the object added by "db.addConversation"');

								print('(Server) Checking if "db.getLastConversation" returns a conversation with timestamp strictly less than "before"');
								let prevConversation = await remoteFunc('callObjectByString', 'db.getLastConversation', conversation.room_id, conversation.timestamp);

								if (isEquivalent(prevConversation, conversation) || prevConversation.timestamp === conversation.timestamp){
									result.comments.push(printError('Object returned by "db.getLastConversation" has the same timestamp as the "before" query parameter'));
								}
								else {
									result.score += 0.25;
								}

							}
							else {
								result.comments.push(printError('Object returned by "db.getLastConversation" is not equivalent to the object added by "db.addConversation"', '\nAdded: ', testConversation, 'Got: ', conversation));
							}

							try {
								print('(Server) Trying to access "messageBlockSize" in server.js');
								let blockSize = await remoteFunc('getGlobalObject', 'messageBlockSize');
								if (typeof blockSize !== 'number'){
									throw new Error('"messageBlockSize" should be a number');
								}
								else {
									result.score += 0.5;
									printOK('"messageBlockSize" is ' + blockSize);
								}

								print('(Server) Checking if "message" event handler for "WebSocket" was updated to add message blocks');

								// get the messages[testRoomId] array to compare it later
								let roomMessages = await remoteFunc('getObjectByString', `messages['${__tester.defaults.testRoomId}']`);


								// generate some test messages
								let testMessages = Array.from({ length: blockSize - roomMessages.length }, _ => Object.assign({ roomId: __tester.defaults.testRoomId }, makeTestMessage()));
								let receivedMessages = [];

								// create test client websockets, and defer containers to
								// emit signals indicating the completion of async operations
								let clientA = new WebSocket(__tester.defaults.webSocketServer),
									clientB = new WebSocket(__tester.defaults.webSocketServer);

								let deferA = {}, deferB = {};

								clientA.addEventListener('message', evt => deferA.resolve(JSON.parse(evt.data)));
								clientB.addEventListener('message', evt => deferB.resolve(JSON.parse(evt.data)));

								await delay(500);	// wait a bit to ensure the sockets are connected

								// async loop to send messages until conversation block is created
								print('(Server) Sending ' + testMessages.length + ' test messages');
								await forEachAsync.call(testMessages, async (m, i) => {
									let received = await new Promise((resolve, reject) => {
										if (i % 2 === 0){
											deferB.resolve = resolve;
											deferB.reject = reject;
											clientA.send(JSON.stringify(m));
										}
										else {
											deferA.resolve = resolve;
											deferA.reject = reject;
											clientB.send(JSON.stringify(m));
										}
									});
									receivedMessages.push(received);
								}, null, 25);
								
								//print message comaprisons
								print('Test Messages: ', testMessages);
								print('Received Messages: ', receivedMessages);

								// check if the messages are forwarded by the broker properly
								if (!isEquivalent(testMessages, receivedMessages)){

									result.comments.push(printError(`Test Messages: ${testMessages} vs. Messages: ${receivedMessages}\nThe ${testMessages.length} test messages sent by the test WebSocket client does not match the ${receivedMessages.length} messages received`, '\nSent:', testMessages, '\nReceived:', receivedMessages));
								}
								else {
									result.score += 0.25; 	// this is basically free score - just making sure they didn't break functionality from a3
									printOK('"broker" still working correctly');

									// check that the conversation block was added
									// (we assume db.getLastConversation works)
									let added = await remoteFunc('callObjectByString', 'db.getLastConversation', __tester.defaults.testRoomId);

									if (added && added.messages instanceof Array){
										if (!isEquivalent(testMessages, added.messages.slice(roomMessages.length).map(item => Object.assign(item, { roomId: __tester.defaults.testRoomId })))){
											result.comments.push(printError(`Test Messages: ${testMessages} vs. Messages: ${receivedMessages}\nThe ${testMessages.length} test messages sent by the test WebSocket client does not match the ${receivedMessages.length} messages received`, '\nSent:', testMessages, '\nReceived:', receivedMessages));
										}
										else {
											result.score += 1;
											printOK('"message" event handler for "WebSocket" adds conversation object when the "messages["'+__tester.defaults.testRoomId+'"]" cache grows to "messageBlockSize"');

											// finally, check that messages is empty
											roomMessages = await remoteFunc('getObjectByString', `messages['${__tester.defaults.testRoomId}']`);

											if (roomMessages.length > 0){
												result.comments.push(printError('messages["'+__tester.defaults.testRoomId+'"] array should be cleared after the messages are saved in the database'));
											}
											else {
												result.score += 0.5;
												printOK('messages["'+__tester.defaults.testRoomId+'"]" array is cleared');
											}

										}
									}
									else {
										result.comments.push(printError('Could not retrieve the last conversation added for room ' + __tester.defaults.testRoomId));
									}
								}
							}
							catch (err){
								result.comments.push(printError(err.message));
							}

							// check GET /chat/:room_id/messages
							print('(Server) Checking if "/chat/:room_id/messages" GET endpoint was defined');
							let response = await safeFetch('/chat/' + __tester.defaults.testRoomId + '/messages?before=' + (2000 + testConversation.timestamp));

							if (isEquivalent(conversation, response)){
								result.score += 1;
								printOK('GET /chat/:room_id/messages returns the same object as db.getLastConversation');
							}
							else {
								result.comments.push(printError('Object returned at the GET "/chat/:room_id/messages" endpoint is not equivalent to the object returned by "db.getLastConversation"', '\nfrom GET endpoint:', response, '\nfrom db.getLastConversation:', conversation));
							}

							print('(Client) Checking "Service.getLastConversation" in app.js');
							if (!(Service.getLastConversation && Service.getLastConversation instanceof Function)){
								result.comments.push(printError('"Service.getLastConversation" is not defined'));
							}
							else {
								let data = await Service.getLastConversation(__tester.defaults.testRoomId, 2000 + testConversation.timestamp);
								if (isEquivalent(conversation, data)){
									result.score += 1;
									printOK('"Service.getLastConversation" returns the same object as "db.getLastConversation"');
								}
								else {
									result.comments.push(printError('Object returned by "Service.getLastConversation" is not equivalent to the object returned by "db.getLastConversation"'));
								}
							}
						}
						catch (err){
							if (err.message.indexOf('timed out') > -1){
								result.comments.push(printError('"db.getLastConversation" did not resolve to anything (test timed out after waiting for 5 seconds)'));
							}
							else {
								result.comments.push(printError('Error upon calling "db.getLastConversation" in server.js: ' + err.message));
							}
						}

					}
					else {
						result.comments.push(printError('Object returned by "db.addConversation" is not equivalent to the Object passed to it', '\nAdded: ', testConversation, '\nReturned: ', conversation));
					}
				}
			}
			catch (err){
				if (err.message.indexOf('timed out') > -1){
					result.comments.push(printError('"db.addConversation" did not resolve to anything (test timed out after waiting for 5 seconds)'));
				}
				else {
					result.comments.push(printError('Error upon calling "db.addConversation" in server.js: ' + err.message));
				}
			}

			return result;
		}
	},{
		id: '5.1',
		description: 'Generator function',
		maxScore: 5,
		run: async () => {
			let result = {
				id: 5.1,
				score: 0,
				comments: []
			};

			print('(Client) Checking "addConversation" method of "Room"');
			if (!(Room.prototype.addConversation && Room.prototype.addConversation instanceof Function)){
				result.comments.push(printError('"addConversation" function not found on "Room.prototype"'));
			}
			else {
				result.score += 0.25;

				let testConversation = makeTestConversation(Math.random().toString(), Date.now());
				let testRoom = makeTestRoom();
				testRoom.messages = [];

				await new Promise((resolve, reject) => {
					let callCount = 0;
					testRoom.onFetchConversation = conversation => {
						if (callCount === 0){
							if (isEquivalent(conversation, testConversation)){
								result.score += 0.5;
								printOK('"onFetchConversation" was called inside "addConversation" method');
							}
							else {
								result.comments.push(printError('Object passed to "onFetchConversation" callback is not equivalent to the object passed to "addConversation"', '\naddConversation was called with: ', testConversation, '\nonFetchConversation got: ', conversation));
							}
							resolve();
							callCount ++;
						}
						else {
							result.comments.push(printError('"onFetchConversation" was called more than once inside "addConversation" method'));
							result.score += -0.25;
						}
					}
					testRoom.addConversation(testConversation);

					reject(new Error('"onFetchConversation" was never invoked'));
				});

				if (isEquivalent(testConversation.messages, testRoom.messages)){
					result.score += 0.5;
					printOK('Messages in the conversation object were added to "messages"');
				}
				else {
					result.comments.push(printError('"messages" passed to "addConversation" method does not match the "messages" in the test room instance', '\nIn conversation:', testConversation.messages, '\nIn room:', testRoom.messages));
				}
			}

			print('(Client) Checking "makeConversationLoader"');
			if (!(makeConversationLoader && makeConversationLoader instanceof Function)){
				result.comments.push(printError('"makeConversationLoader" is not defined in app.js (in the global context)'));
			}
			else {
				// check makeConversationLoader is a GeneratorFunction
				let dummyGenFunc = function*(){ yield true };
				let GeneratorFunction = Object.getPrototypeOf(dummyGenFunc).constructor;

				if (Object.getPrototypeOf(makeConversationLoader) !== GeneratorFunction.prototype){
					result.comments.push(printError('"makeConversationLoader" should be declared as a generator function'));
				}
				else {
					result.score += 0.25;
					printOK('"makeConversationLoader" is a Generator Function');

					let testRoom = makeTestRoom();
					testRoom.messages = [];

					let originalGetLastConversation = Service.getLastConversation;

					// we will return conversation block 3 times
					let defer = {}, prev = {}, callCount = 0;
					Service.getLastConversation = (room_id, before) => new Promise((resolve, reject) => {
						defer.resolve = resolve;
						defer.reject = reject;
						defer.args = { room_id, before };
						callCount += 1;
					});

					// override addConversation method to observe
					testRoom.addConversation = conv => {
						defer.conversation = conv;
					};

					print('(Client) Creating a Generator = "TestGen" by calling "makeConversationLoader" with a test room object');
					let calledAt = Date.now();
					let getLastConversation = makeConversationLoader(testRoom);

					await delay(250);
					
					await (async () => {
						print('(Client) Calling "TestGen.next" first time');
						let iter = getLastConversation.next();

						// check canLoadConversation property
						if (testRoom.canLoadConversation !== false){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to false before calling Service.getLastConversation"));
						}
						else {
							result.score += 0.25;
							printOK('"canLoadConversation" was set to false before calling Service.getLastConversation');
						}

						// check arguments
						if (defer.args.room_id !== testRoom.id){
							result.comments.push(printError(`Expected Service.getLastConversation to be called with the given room's id. Given room id = ${testRoom.id}, Service.getLastConversation was called with room id = ${defer.args.room_id})`));
						}
						else {
							result.score += 0.25;
							printOK('"Service.getLastConversation" was called with the given room id');
						}

						// difference in student's timestamp and our timestamp should be less than 1ms max
						if (!defer.args.before) defer.args.before = Date.now();

						if (Math.abs(calledAt - defer.args.before) > 1){
							result.comments.push(printError("When calling TestGen.next() for the first time, the 'before' query parameter should be a timestamp earlier than the first message of the given room (e.g., timestamp when the room instance was created)."));
						}
						else {
							result.score += 0.25;
							printOK('"Service.getLastConversation" was called with the current timestamp');
						}

						// generate a new test conversation
						let testConversation = makeTestConversation(testRoom.id, defer.args.before - 3600000);


						defer.resolve(testConversation);

						let outConversation = await iter.value;

						// check if conversation was added
						if (!isEquivalent(defer.conversation, testConversation)){
							result.comments.push(printError("Expected room.addConversation to be called with the conversation object resolved from Service.getLastConversation"));
						}
						else {
							result.score += 0.25;
							printOK('"room.addConversation" was called with the conversation resolved from Service.getLastConversation');
						}

						// expect canLoadConversation to be true now
						if (testRoom.canLoadConversation !== true){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to true after Service.getLastConversation resolves to a conversation object"));
						}
						else {
							result.score += 0.25;
							printOK('"room.canLoadConversation" was set to true after Service.getLastConversation resolved');
						}

						// finally, check that iterator is not done yet
						if (iter.done){
							result.comments.push(printError('"TestGen" should not be done yet because "Service.getLastConversation" resolved to a conversation object'));
						}
						else {
							result.score += 0.25;
							printOK('"TestGen" can load more data as expected');
						}

						prev.args = defer.args;
						prev.conversation = testConversation;

					})();
					
					await (async () => {
						print('(Client) Calling "TestGen.next" second time');
						let iter = getLastConversation.next();

						// check canLoadConversation property
						if (testRoom.canLoadConversation !== false){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to false before calling Service.getLastConversation"));
						}	

						// check arguments
						if (defer.args.room_id !== testRoom.id){
							result.comments.push(printError("Expected Service.getLastConversation to be called with the given room's id"));
						}

						// difference in student's timestamp and our timestamp should be less than 1ms max
						if (defer.args.before !== prev.conversation.timestamp){
							result.comments.push(printError("Expected the 'before' query parameter to be the previous conversation's timestamp when calling for the second time"));
						}
						else {
							result.score += 0.25;
							printOK('"Service.getLastConversation" was called with the previous conversation timestamp');
						}

						// generate a new test conversation
						let testConversation = makeTestConversation(testRoom.id, defer.args.before - 3600000);

						defer.resolve(testConversation);

						let outConversation = await iter.value;

						// check if conversation was added
						if (!isEquivalent(defer.conversation, testConversation)){
							result.comments.push(printError("Expected room.addConversation to be called with the conversation object resolved from Service.getLastConversation"));
						}


						// expect canLoadConversation to be true now
						if (testRoom.canLoadConversation !== true){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to true after Service.getLastConversation resolves to a conversation object"));
						}


						// finally, check that iterator is not done yet
						if (iter.done){
							result.comments.push(printError('"TestGen" should not be done yet because "Service.getLastConversation" resolved to a conversation object'));
						}
						else {
							result.score += 0.25;
							printOK('"TestGen" can load more data as expected');
						}

						prev.args = defer.args;
						prev.conversation = testConversation;

					})();

					await (async () => {
						print('(Client) Calling "TestGen.next" third time');
						let iter = getLastConversation.next();

						// check canLoadConversation property
						if (testRoom.canLoadConversation !== false){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to false before calling Service.getLastConversation"));
						}

						// check arguments
						if (defer.args.room_id !== testRoom.id){
							result.comments.push(printError("Expected Service.getLastConversation to be called with the given room's id"));
						}


						// difference in student's timestamp and our timestamp should be less than 1ms max
						if (defer.args.before !== prev.conversation.timestamp){
							result.comments.push(printError("Expected the 'before' query parameter to be the previous conversation's timestamp when calling for the third time"));
						}
						else {
							result.score += 0.25;
							printOK('"Service.getLastConversation" was called with the previous conversation timestamp');
						}

						// generate a new test conversation
						let testConversation = makeTestConversation(testRoom.id, defer.args.before - 3600000);

						defer.resolve(testConversation);

						let outConversation = await iter.value;

						// check if conversation was added
						if (!isEquivalent(defer.conversation, testConversation)){
							result.comments.push(printError("Expected room.addConversation to be called with the conversation object resolved from Service.getLastConversation"));
						}


						// expect canLoadConversation to be true now
						if (testRoom.canLoadConversation !== true){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to true after Service.getLastConversation resolves to a conversation object"));
						}


						// finally, check that iterator is not done yet
						if (iter.done){
							result.comments.push(printError('"TestGen" should not be done yet because "Service.getLastConversation" resolved to a conversation object'));
						}
						else {
							result.score += 0.25;
							printOK('"TestGen" can load more data as expected');
						}

						prev.args = defer.args;
						prev.conversation = testConversation;

					})();

					await (async () => {
						print('(Client) Calling "TestGen.next" fourth time');
						let iter = getLastConversation.next();

						// check canLoadConversation property
						if (testRoom.canLoadConversation !== false){
							result.comments.push(printError("Expected room object's 'canLoadConversation' property to be set to false before calling Service.getLastConversation"));
						}


						// check arguments
						if (defer.args.room_id !== testRoom.id){
							result.comments.push(printError("Expected Service.getLastConversation to be called with the given room's id"));
						}


						// difference in student's timestamp and our timestamp should be less than 1ms max
						if (defer.args.before !== prev.conversation.timestamp){
							result.comments.push(printError("Expected the 'before' query parameter to be the previous conversation's timestamp when calling for the third time"));
						}
						else {
							printOK('"Service.getLastConversation" was called with the previous conversation timestamp');
						}

						// return null to end the generator loop
						defer.resolve(null);

						let outConversation = await iter.value;

						// expect canLoadConversation to stay false
						if (testRoom.canLoadConversation !== false){
							result.comments.push(printError("Room object's 'canLoadConversation' property should remain false when Service.getLastConversation resolves to null"));
						}
						else {
							result.score += 0.5;
							printOK('"room.canLoadConversation" remains false after Service.getLastConversation resolved to null');
						}

						// finally, check that iterator finishes after calling next again
						iter = getLastConversation.next();

						if (!iter.done){
							result.comments.push(printError('"TestGen" should be done after calling next() one last time, because "Service.getLastConversation" resolved to null'));
						}
						else {
							result.score += 0.25;
							printOK('"TestGen" is done as expected');

							if (callCount !== 4){
								result.comments.push(printError('Expected "Service.getLastConversation" to be called 4 times in total, but was called ' + callCount + ' times'));
							}
							else {
								result.score += 0.25;
							}
						}
					})();

					// restore the original function
					Service.getLastConversation = originalGetLastConversation;
				}
			}

			return result;
		}
	}, {
		id: '5.2',
		description: 'Infinite scroll',
		maxScore: 3,
		run: async () => {
			let result = {
				id: 5.2,
				score: 0,
				comments: []
			};

			print('(Client) Checking "Room" class constructor modifications');
			let testRoom = makeTestRoom();

			print('(Client) Checking "canLoadConversation" property of a "Room" instance');
			if (!(testRoom.canLoadConversation && typeof testRoom.canLoadConversation === 'boolean')){
				result.comments.push(printError('"canLoadConversation" property of a "Room" instance should be set to true'));
			}
			else {
				if (testRoom.canLoadConversation !== true){
					result.comments.push(printError('"canLoadConversation" property of a "Room" instance should be set to true'));
				}
				else {
					result.score += 0.25;
					printOK('"canLoadConversation" is true');
				}
			}

			print('(Client) Checking "getLastConversation" property of a "Room" instance');
			if (!testRoom.getLastConversation){
				result.comments.push(printError('"getLastConversation" property of a "Room" instance is not defined'));
			}
			else {
				if (Object.getPrototypeOf(testRoom.getLastConversation) !== makeConversationLoader.prototype){
					result.comments.push(printError('"getLastConversation" property of a "Room" should be a Generator returned by "makeConversationLoader"'));
				}
				else {
					result.score += 0.25;
					printOK('"getLastConversation" is a Generator');

					// check if the room was passed as the argument
					// assuming the generator implementation is correct
					let originalGetLastConversation = Service.getLastConversation;
					print('(Client) Checking if "makeConversationLoader" was called by passing the Room instance');

					try {
						let roomId = await new Promise((resolve, reject) => {
							Service.getLastConversation = (room_id, before) => {
								resolve(room_id);
								return Promise.resolve(null);
							};
							testRoom.getLastConversation.next();
							setTimeout(() => reject(new Error('Timed out after calling "room.getLastConversation.next" and waiting for "Service.getLastConversation" to be called')), 1000);
						});

						if (roomId === testRoom.id){
							result.score += 0.25;
							printOK('"makeConversationLoader" was called with the Room instance');
						}
						else {
							result.comments.push(printError('"makeConversationLoader" was not called with the Room instance - Service.getLastConversation received room_id = ' + roomId));
						}
					}
					catch (err){
						result.comments.push(printError(err.message));
					}
					finally {
						Service.getLastConversation = originalGetLastConversation;
					}
				}
			}

			print('(Client) Checking "ChatView" class modifications - this requires "lobby" and "chatView" to be exported');

			// check if scoped variables were exported for testing
			let mainScope = __tester.exports.get(main);
			if (!mainScope){
				result.comments.push(printError('Unable to test: local variables inside "main" were not exported'));
			}
			else {
				// check lobby and chatView variable
				if (!mainScope['lobby']){
					result.comments.push(printError('local variable "lobby" inside "main" was not found/exported'));
				}
				else if (!mainScope['chatView']){
					result.comments.push(printError('local variable "chatView" inside "main" was not found/exported'));
				}
				else {
					let testRoom = mainScope['lobby'].rooms[__tester.defaults.testRoomId];
					let chatView = mainScope['chatView'];

					// navigate to test room
					let originalGetLastConversation = testRoom.getLastConversation;
					let originalMessages = testRoom.messages;
					let originalCanLoad = testRoom.canLoadConversation;
					testRoom.messages = Array.from({ length: 20 + Math.round(15 * Math.random()) }, _ => makeTestMessage());

					let originalHash = window.location.hash;
					window.location.hash = '#/chat/' + __tester.defaults.testRoomId;

					if (originalHash === window.location.hash){
						chatView.setRoom(testRoom);
					}

					try {

						print('(Client) Checking "wheel/mousewheel" event listener on "this.chatElem"');
						let found = __tester.listeners.find(elem => (elem.node === chatView.chatElem && (elem.type === 'wheel' || elem.type === 'mousewheel')));
						if (!found){
							result.comments.push(printError('Could not find a "wheel/mousewheel" event listener on the "chatElem" property of a ChatView instance'));
						}
						else {
							result.score += 0.25;
							printOK('Found a "' + found.type + '" event listener');

							// check event trigger condition
							let event;

							// enumerate 8 different cases
							let p1 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => {
										resolve();
										return {
											value: Promise.resolve(null),
											done: true
										}
									}
								};
								chatView.chatElem.scrollTop = 0;
								testRoom.canLoadConversation = true;
								event = new WheelEvent('wheel', {
									deltaY: -1
								});
								found.invoke(event);
								setTimeout(() => reject(new Error('"room.getLastConversation" was not called')), 100);
							});

							let p2 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when scrollTop > 0'))
								};
								chatView.chatElem.scrollTop = 1;
								testRoom.canLoadConversation = true;
								event = new WheelEvent('wheel', {
									deltaY: -1
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							let p3 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when "canLoadConversation" is false'))
								};
								chatView.chatElem.scrollTop = 0;
								testRoom.canLoadConversation = false;
								event = new WheelEvent('wheel', {
									deltaY: -1
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							let p4 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when "canLoadConversation" is false'))
								};
								chatView.chatElem.scrollTop = 1;
								testRoom.canLoadConversation = false;
								event = new WheelEvent('wheel', {
									deltaY: -1
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							let p5 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when WheelEvent deltaY >= 0'))
								};
								chatView.chatElem.scrollTop = 0;
								testRoom.canLoadConversation = true;
								event = new WheelEvent('wheel', {
									deltaY: 0
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							let p6 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when WheelEvent deltaY >= 0'))
								};
								chatView.chatElem.scrollTop = 1;
								testRoom.canLoadConversation = true;
								event = new WheelEvent('wheel', {
									deltaY: 0
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							let p7 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when WheelEvent deltaY >= 0'))
								};
								chatView.chatElem.scrollTop = 0;
								testRoom.canLoadConversation = false;
								event = new WheelEvent('wheel', {
									deltaY: 0
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							let p8 = await new Promise((resolve, reject) => {
								testRoom.getLastConversation = {
									next: () => reject(new Error('"room.getLastConversation" should not be called when WheelEvent deltaY >= 0'))
								};
								chatView.chatElem.scrollTop = 1;
								testRoom.canLoadConversation = false;
								event = new WheelEvent('wheel', {
									deltaY: 0
								});
								found.invoke(event);
								setTimeout(() => resolve(), 100);
							});

							testRoom.getLastConversation = originalGetLastConversation;

							result.score += 0.75;
						}

						print('(Client) Checking if "setRoom" method of "ChatView" was updated');
						testRoom.onFetchConversation = undefined;
						chatView.room = null;
						chatView.setRoom(testRoom);

						print('(Client) Checking if "onFetchConversation" callback is added to the "this.room" object');
						if (!(testRoom.onFetchConversation && testRoom.onFetchConversation instanceof Function)){
							result.comments.push(printError('"onFetchConversation" function was not assigned to the given "room" when "ChatView.prototype.setRoom" was called'));
						}
						else {
							result.score += 0.25;
							printOK('"onFetchConversation" function was assigned to the room inside "setRoom" method');

							// check if the messages were added to chatElem
							print('(Client) Checking "onFetchConversation" implementation');
							let testConversation = makeTestConversation(testRoom.id, Date.now());
							let scrollHeight = chatView.chatElem.scrollHeight;

							testRoom.onFetchConversation(testConversation);

							let messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
							let rendered = testConversation.messages.reduce((acc, item, index) => acc && messages[index].innerText.includes(item.username) && messages[index].innerText.includes(item.text), true);

							if (!rendered){
								result.comments.push(printError('The messages in the conversation object were not rendered correctly', '\nMessages: ', testConversation.messages, '\nHTML: ', messages.slice(0, testConversation.messages.length).map(item => ({ innerHTML: item.innerHTML.trim(), node: item }))));
							}
							else {
								result.score += 0.5;
								printOK('The messages in the conversation object were rendered properly');
							}

							print('(Client) Checking if "scrollTop" value is correct after added more messages in the view');
							if (chatView.chatElem.scrollTop < (chatView.chatElem.scrollHeight - scrollHeight - 1.0)
								|| chatView.chatElem.scrollTop > (chatView.chatElem.scrollHeight - scrollHeight + 1.0)){
								result.comments.push(printError('"scrollTop" has incorrect value: expected = ' + (chatView.chatElem.scrollHeight - scrollHeight) + ' Â± 1.0, current = ' + chatView.chatElem.scrollTop));
							}
							else {
								result.score += 0.5;
								printOK('"scrollTop" set to the right value');
							}
						}

					}
					catch (err){
						result.comments.push(printError('Error while checking ChatView modifications: ' + err.message, err));
					}
					finally {
						testRoom.messages = originalMessages;
						testRoom.getLastConversation = originalGetLastConversation;
						testRoom.canLoadConversation = originalCanLoad;
						
						chatView.setRoom(testRoom);
						
						window.location.hash = originalHash;
					}
				}
			}

			return result;
		}
	}];

	/* common code related to UI */
	const emoji = {
		bug: String.fromCodePoint(128030),
		like: String.fromCodePoint(128077)
	};
	const elem = (tagName, parent) => {
		let e = document.createElement(tagName);
		if (parent) parent.appendChild(e);
		return e;
	};
	const delay = ms => new Promise((resolve, reject) => setTimeout(resolve, ms));
	const print = (text, ...extra) => ((store.options.showLogs && console.log('\x1b[34m[Tester]\x1b[0m', text, ...extra)), text);
	const printError = (text, ...extra) => ((store.options.showLogs && console.log('\x1b[34m[Tester]\x1b[0m %c Bug ' + emoji.bug + ' ', 'background-color: red; color: white; padding: 1px;', text, ...extra)), text);
	const printOK = (text, ...extra) => ((store.options.showLogs && console.log('\x1b[34m[Tester]\x1b[0m %c OK ' + emoji.like + ' ', 'background-color: green; color: white; padding: 1px;', text, ...extra)), text);

	function forEachAsync (asyncCallback, thisArg, delayMs = 0){
		let array = this;
		let self = thisArg || this;
		let boundCallback = asyncCallback.bind(self);

		let next = async (index) => {
			if (index === array.length) return null;

			if (delayMs > 0 && index > 0) await delay(delayMs);
			await boundCallback(array[index], index, array);
			return await next(index + 1);
		}

		return next(0);
	}

	let store = window.localStorage.getItem('store_' + a);
	if (store) store = JSON.parse(store);
	else store = {
		options: { showLogs: true },
		selection: {},
		results: {},
		lastTestAt: null
	}

	let ui = {};

	// add UI to document
	let dom = elem('div');
	dom.style.position = 'fixed';
	dom.style.top = '0px';
	dom.style.right = '0px';

	let button = elem('button');
	button.textContent = 'Test';
	button.style.backgroundColor = 'red';
	button.style.color = 'white';
	button.style.padding = '0.5em';

	let menu = elem('div');
	menu.style.padding = '0.5em';
	menu.style.position = 'fixed';
	menu.style.right = '0px';
	menu.style.display = 'flex';
	menu.style.flexDirection = 'column';
	menu.style.backgroundColor = 'white';
	menu.style.visibility = 'hidden';

	let optionsDiv = elem('div', menu);
	let showLogs = elem('label', optionsDiv);
	let showLogsCheckbox = elem('input', showLogs);
	showLogsCheckbox.type = 'checkbox';
	showLogsCheckbox.checked = 'showLogs' in store.options ? store.options.showLogs : true;
	showLogsCheckbox.addEventListener('change', evt => {
		store.options.showLogs = evt.target.checked;
		window.localStorage.setItem('store_' + a, JSON.stringify(store));
	});
	showLogs.appendChild(document.createTextNode(' Show logs during test'));

	let table = elem('table', menu);
	table.style.borderCollapse = 'collapse';
	let thead = elem('thead', table);
	thead.style.backgroundColor = 'dimgray';
	thead.style.color = 'white';
	let htr = elem('tr', thead);
	let th0 = elem('th', htr);
	th0.textContent = 'Task';
	th0.style.padding = '0.25em';
	let th1 = elem('th', htr);
	th1.textContent = 'Description';
	th1.style.padding = '0.25em';
	let th2 = elem('th', htr);
	th2.textContent = 'Run';
	th2.style.padding = '0.25em';
	let checkBoxAll = elem('input', th2);
	checkBoxAll.type = 'checkbox';
	checkBoxAll.checked = (store.selection && Object.keys(store.selection).length > 0) ? Object.values(store.selection).reduce((acc, val) => acc && val, true) : false;
	checkBoxAll.addEventListener('change', evt => {
		tests.forEach(test => {
			ui[test.id].checkBox.checked = evt.target.checked;
			store.selection[test.id] = evt.target.checked;
		});
		window.localStorage.setItem('store_' + a, JSON.stringify(store));
	});
	let th3 = elem('th', htr);
	th3.textContent = 'Result';
	th3.style.padding = '0.25em';
	let tbody = elem('tbody', table);
	let tfoot = elem('tfoot', table);
	let ftr = elem('tr', tfoot);
	ftr.style.borderTop = '1px solid dimgray';
	let fth0 = elem('th', ftr);
	fth0.textContent = 'Total';
	fth0.colSpan = 3;
	let fth1 = elem('th', ftr);
	fth1.textContent = '-';

	let renderResult = () => {
		let sum = 0;
		let maxScore = 0;
		let allComments = [];
		tests.forEach(test => {
			let result = store.results[test.id];
			sum += result.score;
			maxScore += test.maxScore;
			if (result.comments.length > 0) allComments.push('Task ' + test.id + ':\n' + result.comments.map(comm => '  - ' + comm).join('\n'));
		});
		fth1.textContent = sum + '/' + maxScore;
		return { sum: sum, max: maxScore, comments: allComments.join('\n') };
	};

	let runButton = elem('button', menu);
	runButton.id = 'test-button';
	runButton.textContent = 'Run Tests';

	let lastTested = elem('div', menu);
	lastTested.style.fontSize = '0.8em';
	lastTested.style.textAlign = 'right';
	if (store.lastTestAt) {
		renderResult();
		lastTested.textContent = 'Last Run at: ' + (new Date(store.lastTestAt)).toLocaleString();
	}

	tests.forEach((test, i) => {
		let tr = elem('tr', tbody);
		tr.style.backgroundColor = i % 2 === 0 ? 'white' : '#eee';
		let td0 = elem('td', tr);
		td0.textContent = test.id;
		td0.style.textAlign = 'center';
		let td1 = elem('td', tr);
		td1.textContent = test.description;
		let td2 = elem('td', tr);
		td2.style.textAlign = 'center';
		let checkBox = elem('input', td2);
		checkBox.type = 'checkbox';
		checkBox.checked = test.id in store.selection ? store.selection[test.id] : false
		checkBox.addEventListener('change', evt => {
			store.selection[test.id] = evt.target.checked;
			window.localStorage.setItem('store_' + a, JSON.stringify(store));
		});
		let td3 = elem('td', tr);
		td3.style.textAlign = 'center';
		td3.textContent = test.id in store.results ? (store.results[test.id].skipped ? '-' : store.results[test.id].score + '/' + test.maxScore) : '-';

		ui[test.id] = {
			checkBox: checkBox,
			resultCell: td3
		};
	});

	dom.appendChild(button);
	dom.appendChild(menu);

	runButton.addEventListener('click', async (evt) => {

		runButton.disabled = true;

		await forEachAsync.call(tests, async (test) => {
			let input = ui[test.id].checkBox;
			let cell = ui[test.id].resultCell;
			if (input.checked){

				runButton.textContent = 'Running Test ' + test.id;

				// run test
				let result;

				try {
					print('--- Starting Test ' + test.id + ' ---');

					result = await test.run();

					print('--- Test ' + test.id + ' Finished --- Score = ' + (Math.round(100 * result.score) / 100) + ' / ' + test.maxScore);

					if (result && result.comments.length > 0) print('Task ' + test.id + ':\n' + result.comments.map(comm => '  - ' + comm).join('\n'));

					store.results[test.id] = {
						skipped: false,
						score: result ? (Math.round(100 * result.score) / 100) : 0,
						comments: result ? result.comments : []
					};
				}
				catch (err){
					store.results[test.id] = {
						skipped: false,
						score: 0,
						comments: [ 'Error while running tests: ' + err.message ]
					};

					console.log(err);
				}

				// just print a blank line for readability
				if (store.options.showLogs) console.log('');
			}
			else {

				store.results[test.id] = {
					skipped: true,
					score: 0,
					comments: []
				};
			}

			cell.textContent = (store.results[test.id].skipped ? 'Skipped' : (Math.round(100 * store.results[test.id].score) / 100) + '/' + test.maxScore);
		});


		let sum = renderResult();
		console.log('\x1b[34m[Tester]\x1b[0m', 'Total = ' + sum.sum + ' / ' + sum.max);
		console.log(sum.comments);

		store.lastTestAt = Date.now();
		window.localStorage.setItem('store_' + a, JSON.stringify(store));

		lastTested.textContent = 'Last Run at: ' + (new Date(store.lastTestAt)).toLocaleString();

		runButton.textContent = 'Run Tests';
		runButton.disabled = false;
	});

	button.addEventListener('click', evt => menu.style.visibility == 'hidden' ? (menu.style.visibility = 'visible') : (menu.style.visibility = 'hidden'));
	document.body.appendChild(dom);

})