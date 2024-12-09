// override addEventListener to cache listener callbacks for testing
const __tester = {
	listeners: [],
	timers: [],
	exports: new Map(),
	defaults: {
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
	const a = 'a3';
	// from a3 onwards, test servers are used to emulate server behavior
	const originalFetch = window.fetch;

	const testServer = 'http://3.98.223.41:3000/';

	const makeTestRoom = () => new Room(
		Math.random().toString(),
		Math.random().toString(),
		__tester.defaults.image,
		[{
			username: Math.random().toString(),
			text: Math.random().toString()
		}, {
			username: Math.random().toString(),
			text: Math.random().toString()
		}]);

	const remoteFunc = (func, ...args) => originalFetch('cpen322/' + a, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ func, args })
	}).then(resp => resp.status === 200 ? resp.json() : resp.text().then(text => { throw new Error(text) }));

	/* tests */
	const tests = [{
		id: '1',
		description: 'Getting data via AJAX GET',
		maxScore: 5,
		run: async () => {

			let result = {
				id: 1,
				score: 0,
				comments: []
			};

			print('Checking "Service"');
			if (typeof Service === 'undefined'){
				result.comments.push(printError('global variable "Service" is not defined'));
			}
			else {
				result.score += 0.25;
				printOK('Found global variable named "Service"');

				print('Checking "Service.origin"');
				if (!(Service.origin && typeof Service.origin === 'string')){
					result.comments.push(printError('"Service.origin" is not defined'));
				}
				else {
					if (Service.origin !== window.location.origin){
						result.comments.push(printError('"Service.origin" is not set to window.location.origin'));
					}
					else {
						result.score += 0.25;
						printOK('"Service.origin" is set to window.location.origin');
					}
				}

				print('Checking "Service.getAllRooms"');
				if (!(Service.getAllRooms && Service.getAllRooms instanceof Function)){
					result.comments.push(printError('"Service.getAllRooms" function is not defined'));
				}
				else {
					result.score += 0.25;
					printOK('"Service.getAllRooms" is a function');

					// check that AJAX request is sent to correct URL
					let dataToSign = Math.random().toString();
					
					// 1. generate random data for the server to sign
					// 2. server splits the data into 4 chunks, using each chunk for the id of each room
					// 3. client receives the rooms, concatenates the ids to construct the signature
					let savedOrigin = Service.origin;
					Service.origin = testServer + dataToSign;	// test server (black-box)
					try {
						print('Calling "Service.getAllRooms" with "Service.origin" set to ' + Service.origin);
						let promise = Service.getAllRooms();

						if (!(promise && promise instanceof Promise)){
							result.comments.push(printError('"getAllRooms" should return a Promise'));
						}
						else {
							result.score += 0.5;
							printOK('"getAllRooms" returns a Promise');

							let rooms = await promise;
							if (!(rooms && rooms instanceof Array)){
								result.comments.push(printError('Promise returned by "getAllRooms" does not resolve to an Array'));
							}
							else {
								result.score += 0.25;
								printOK('Promise returned by "getAllRooms" resolves to an Array');

								// verify rooms by id
								let concatenated = rooms.map(item => item.id).join('');

								if (concatenated !== dataToSign.split('.')[1]){
									result.comments.push(printError('Promise returned by "getAllRooms" does not resolve to the Array returned by the test server'));
								}
								else {
									result.score += 0.5;
									printOK('Promise returned by "getAllRooms" resolves to the Array returned by the test server');
								}
							}
						}
					}
					catch (err){

						result.comments.push(printError('Unexpected error when calling "getAllRooms": ' + err.message));
						print(err);
					}
					finally {
						Service.origin = savedOrigin;
					}

					// check server-side error handling
					dataToSign = Math.random().toString();
					Service.origin = testServer + 'error/' + dataToSign;	// test server (black-box)
					try {
						print('Calling "Service.getAllRooms" with "Service.origin" set to ' + Service.origin);
						let promise = Service.getAllRooms();

						if (!(promise && promise instanceof Promise)){
							result.comments.push(printError('"getAllRooms" should return a Promise'));
						}
						else {
							let error = await promise;
							
							// should not reach here
							result.comments.push(printError('Promise returned by "getAllRooms" should reject upon any server-side error'));
						}
					}
					catch (err){

						if (!(err instanceof Error && err.message === ('Server Error 500: ' + dataToSign))){
							result.comments.push(printError('Promise rejected by "getAllRooms" upon server-side error should contain an Error object with the error message given by the server'));
						}
						else {
							result.score += 0.5;
							printOK('Promise rejected by "getAllRooms" upon server-side error contains an Error object with the error message given by the server')
						}
					}
					finally {
						Service.origin = savedOrigin;
					}

					// check client-side error handling
					dataToSign = Math.random().toString();
					Service.origin = 'http://invalid-url';	// test server (black-box)
					try {
						print('Calling "Service.getAllRooms" with "Service.origin" set to ' + Service.origin);
						let promise = Service.getAllRooms();

						if (!(promise && promise instanceof Promise)){
							result.comments.push(printError('"getAllRooms" should return a Promise'));
						}
						else {
							let error = await promise;
							
							// should not reach here
							result.comments.push(printError('Promise returned by "getAllRooms" should reject upon any client-side error'));
						}
					}
					catch (err){

						if (!(err instanceof Error)){
							result.comments.push(printError('Promise rejected by "getAllRooms" upon client-side error should contain an Error object'));
						}
						else {
							result.score += 0.25;
							printOK('Promise rejected by "getAllRooms" upon client-side error contains an Error object');
						}
					}
					finally {
						Service.origin = savedOrigin;
					}
				}
			}

			print('Checking "refreshLobby"');

			// check if scoped variables were exported for testing
			let mainScope = __tester.exports.get(main);
			if (!mainScope){
				result.comments.push(printError('Unable to test: local variables inside "main" were not exported'));
			}
			else {
				// check refreshLobby variable
				if (!mainScope['refreshLobby']){
					result.comments.push(printError('local variable "refreshLobby" inside "main" was not found/exported'));
				}
				else if (!mainScope['lobby']){
					result.comments.push(printError('local variable "lobby" inside "main" was not found/exported'));
				}
				else {
					let lobby = mainScope['lobby'];
					let refreshLobby = mainScope['refreshLobby'];
					if (!(lobby instanceof Lobby)){
						result.comments.push(printError('"lobby" should be a Lobby instance'));
					}
					else if (!(refreshLobby instanceof Function)){
						result.comments.push(printError('"refreshLobby" should be a function'));
					}
					else {
						result.score += 0.25;
						printOK('"refreshLobby" is a function');

						// replace Service.getAllRooms temporarily
						// to see if it is called from within refreshLobby
						let getAllRooms = Service.getAllRooms;
						let originalRooms = lobby.rooms;
						let originalAddRoom = Lobby.prototype.addRoom;

						let testRoomsBefore = {};
						let testRooms = {};
						for (let i = 0; i < 4; i ++){
							let room = makeTestRoom();
							testRoomsBefore[room.id] = room;
							testRooms[room.id] = room;
						}
						lobby.rooms = testRooms;

						let updates = Object.values(testRooms).map(room => ({
							id: room.id,
							name: Math.random().toString(),
							image: Math.random().toString()
						})).concat([{
							id: Math.random().toString(),
							name: Math.random().toString(),
							image: Math.random().toString(),
							messages: [{
								username: Math.random().toString(),
								text: Math.random().toString()
							}, {
								username: Math.random().toString(),
								text: Math.random().toString()
							}]
						}]);

						// check getAllRooms is called
						let checks = [
								new Promise((resolve, reject) => {
									print('Checking if "Service.getAllRooms" was called inside "refreshLobby"');
									Service.getAllRooms = async () => {
										resolve(true);
										result.score += 0.25;
										printOK('"Service.getAllRooms" was called inside "refreshLobby"');
										return updates;
									};
									setTimeout(() => reject(new Error('"getAllRooms" was not called inside "refreshLobby"')), 500);
								}),
								new Promise((resolve, reject) => {
									print('Checking if "lobby.addRoom" was called inside "refreshLobby" upon receiving a new room');
									Lobby.prototype.addRoom = (id, name, image, messages) => {
										let room = new Room(id, name, image, messages);
										testRooms[String(room.id)] = room;
										let messagesMatch = !!messages && updates[4].messages.reduce((acc, item, index) => (acc && messages[index] && item.username === messages[index].username && item.text === messages[index].text), true);

										if (updates[4].id !== id){
											result.comments.push(printError(`lobby.addRoom was called with incorrect "id" - expected ${updates[4].id} but got ${id}`));
										}
										if (updates[4].name !== name){
											result.comments.push(printError(`lobby.addRoom was called with incorrect "name" - expected ${updates[4].name} but got ${name}`));
										}
										if (updates[4].image !== image){
											result.comments.push(printError(`lobby.addRoom was called with incorrect "image" - expected ${updates[4].image} but got ${image}`));
										}
										if (!messagesMatch){
											result.comments.push(printError(`lobby.addRoom was called with incorrect "messages"`));
										}
										if (updates[4].id === id && updates[4].name === name && updates[4].image === image && messagesMatch) {
											result.score += 0.25;
											printOK('lobby.addRoom was called correctly');
										}

										resolve(true);
									};
									setTimeout(() => reject(new Error('Newly fetched room was not added using "lobby.addRoom" inside "refreshLobby"')), 500);
								})
							];

						try {
							refreshLobby();

							await Promise.all(checks);
						}
						catch (err) {
							result.comments.push(printError(err.message));
							print(err);
						}

						Lobby.prototype.addRoom = originalAddRoom;
						lobby.rooms = originalRooms;
						Service.getAllRooms = getAllRooms;

						// compare testRooms with updates
						print('Comparing the received rooms with lobby.rooms');
						updates.forEach((update, i) => {
							if (testRooms[update.id]){
								if (i < updates.length - 1 && testRoomsBefore[update.id] !== testRooms[update.id]){
									result.comments.push(printError('Test room ' + update.id + ' instance was replaced with a new Room instance, instead of just updating the properties'));
								}
								else if (testRooms[update.id].name !== update.name){
									result.comments.push(printError('Test room ' + update.id + ' "name" mismatch - expected name = ' + update.name));
								}
								else if (testRooms[update.id].image !== update.image){
									result.comments.push(printError('Test room ' + update.id + ' "image" mismatch - expected image = ' + update.image));
								}
								else {
									result.score += 0.25;
									printOK('Test room ' + update.id + ' OK');
								}
							}
							else {
								result.comments.push(printError('Test room ' + update.id + ' not found'));
							}
						});

					}

					// check if refreshLobby is called periodically
					print('Checking if "refreshLobby" is called periodically');
					let timer = __tester.timers.find(item => item.func === refreshLobby);
					if (!timer){
						result.comments.push(printError('"refreshLobby" not being invoked periodically using setInterval'));
					}
					else {
						if (timer.delay < 5000){
							result.comments.push(printError('The interval given is too short - set it to at least 5 seconds or more'));
						}
						else {
							result.score += 0.25;	
							printOK('"refreshLobby" invoked periodically using setInterval');
						}
					}
				}
			}

			return result;

		}
	},{
		id: '2',
		description: 'Handling GET request at the Server',
		maxScore: 4,
		run: async () => {
			let result = {
				id: 2,
				score: 0,
				comments: []
			};

			try {
				// check chatrooms in server.js
				print('Trying to access "chatrooms" in server.js');
				let chatrooms = await remoteFunc('getGlobalObject', 'chatrooms');
				
				if (!(chatrooms && chatrooms instanceof Array)){
					result.comments.push(printError('"chatrooms" Array in server.js was not found/exported'));
				}
				else {
					result.score += 0.25;
					printOK('Found "chatrooms" Array in server.js');

					if (chatrooms.length < 2){
						result.comments.push(printError('"chatrooms" Array in server.js should contain at least 2 rooms'));
					}
					else {
						let ids = {};
						let hasRooms = chatrooms.reduce((acc, item) => {
							if (!(item.id && typeof item.id === 'string')){
								result.comments.push(printError('object inside chatrooms should have a string "id"'));
								return false;
							}
							else if (item.id && typeof item.id === 'string' && ids[item.id]){
								result.comments.push(printError('object inside chatrooms should have a unique "id"'));
								return false;
							}
							else if (!(item.name && typeof item.name === 'string')){
								result.comments.push(printError('object inside chatrooms should have a string "name"'));
								return false;
							}
							else if (!(item.image && typeof item.image === 'string')){
								result.comments.push(printError('object inside chatrooms should have a string "image"'));
								return false;
							}
							else if (item.messages){
								result.comments.push(printError('object inside chatrooms should not have a "messages" property'));
								return false;
							}

							ids[item.id] = item;
							
							return acc && true;
						}, true);

						if (hasRooms){
							result.score += 0.5;
							printOK('"chatrooms" contains the right objects')
						}

						// check messages in server.js
						try {
							print('Trying to access "messages" in server.js');
							let messages = await remoteFunc('getGlobalObject', 'messages');
							
							if (!messages){
								result.comments.push(printError('"messages" object in server.js was not found/exported'));
							}
							else {
								result.score += 0.25;
								printOK('Found "messages" object in server.js')

								// check messages is initialized;
								let hasArrays = chatrooms.reduce((acc, item) => {
									if (!(messages[item.id] && messages[item.id] instanceof Array)){
										result.comments.push(printError('"messages" object should contain an array for each room in "chatrooms". messages["' + item.id + '"] is currently ' + JSON.stringify(messages[item.id])));
										return false;
									}
									else {
										return acc && true;
									}
								}, true);

								if (hasArrays){
									result.score += 0.5;
									printOK('"messages" object contains the right objects')
								}

							}
						}
						catch (err){
							result.comments.push(printError('Error while getting "messages" object from the server: ' + err.message));
							print(err);
						}
					}
				}
			}
			catch (err){
				result.comments.push(printError('Error while getting "chatrooms" array from the server: ' + err.message));
				print(err);
			}

			try {
				// check server endpoint
				print('Making a GET request to /chat');
				let response = await originalFetch('/chat');

				if (response.status !== 200){
					result.comments.push(printError('Error while making GET request to /chat: Server did not respond with status 200'));
				}
				else {
					result.score += 0.5;
					printOK('Server responded with status 200 when making GET request to /chat');

					let rooms = await response.json();

					if (!(rooms && rooms instanceof Array)){
						result.comments.push(printError('Error while making GET request to /chat: Server should return an Array object'));
					}
					else {
						result.score += 0.5;
						printOK('Server returned an Array at /chat')

						if (rooms.length < 2){
							result.comments.push(printError('Error while making GET request to /chat: Server should return at least 2 rooms'));
						}
						else {
							rooms.slice(0,2).forEach(room => {
								if (!(room.id && typeof room.id === 'string')){
									result.comments.push(printError('Error while making GET request to /chat: room should contain "id" (string)'));
								}
								else if (!(room.name && typeof room.name === 'string')){
									result.comments.push(printError('Error while making GET request to /chat: room should contain "name" (string)'));
								}
								else if (!(room.image && typeof room.image === 'string')){
									result.comments.push(printError('Error while making GET request to /chat: room should contain "image" (string)'));
								}
								else if (!(room.messages && room.messages instanceof Array)){
									result.comments.push(printError('Error while making GET request to /chat: room should contain "messages" (Array)'));
								}
								else {
									result.score += 0.5;
									printOK(`Room ${room.id} looks OK`)
								}
							});
						}

						// check if chatrooms was modified
						try {
							print('Checking if "chatrooms" was modified in server.js');
							// check chatrooms in server.js
							let chatrooms = await remoteFunc('getGlobalObject', 'chatrooms');
							
							if (!(chatrooms && chatrooms instanceof Array)){
								result.comments.push(printError('"chatrooms" Array in server.js was not found/exported'));
							}
							else {
								if (chatrooms.length < 2){
									result.comments.push(printError('"chatrooms" Array in server.js should contain at least 2 rooms'));
								}
								else {
									let unmodified = chatrooms.reduce((acc, item) => acc && !item.messages, true);

									if (unmodified){
										result.score += 0.5;
										printOK('The room objects in "chatrooms" was not modified');
									}
									else {
										result.comments.push(printError('The room objects in "chatrooms" was modified'));
									}
								}
							}
						}
						catch (err){
							result.comments.push(printError('Error while getting "chatrooms" array from the server: ' + err.message));
							print(err);
						}
					}
				}

			}
			catch (err){
				result.comments.push(printError('Error while making GET request to /chat: ' + err.message));
				print(err);
			}

			return result;
		}
	},{
		id: '3',
		description: 'AJAX POST',
		maxScore: 4,
		run: async () => {
			let result = {
				id: 3,
				score: 0,
				comments: []
			};

			if (typeof Service === 'undefined'){
				result.comments.push(printError('global variable "Service" is not defined'));
			}
			else {
				print('Checking "Service.addRoom"');
				if (!(Service.addRoom && Service.addRoom instanceof Function)){
					result.comments.push(printError('"Service.addRoom" function is not defined'));
				}
				else {
					result.score += 0.25;
					printOK('"Service.addRoom" is a function')

					let dataToSign = Math.random().toString();

					// 1. generate random data for the server to sign
					// 2. server splits the data into 4 chunks, using each chunk for the id of each room
					// 3. client receives the rooms, concatenates the ids to construct the signature
					let savedOrigin = Service.origin;
					Service.origin = testServer + dataToSign;	// test server (black-box)
					try {
						let testRoom = {
							name: Math.random().toString(),
							image: Math.random().toString()
						};
						print('Calling "Service.addRoom" with "Service.origin" set to ' + Service.origin);
						let promise = Service.addRoom(testRoom);

						if (!(promise && promise instanceof Promise)){
							result.comments.push(printError('"addRoom" should return a Promise'));
						}
						else {
							result.score += 0.25;
							printOK('"addRoom" returns a Promise')

							let newRoom = await promise;
							if (!newRoom){
								result.comments.push(printError('Promise returned by "addRoom" does not resolve to an object'));
							}
							else {
								if (!(newRoom.id && newRoom.id === dataToSign)){
									result.comments.push(printError('Promise returned by "addRoom" does not resolve to the object returned by the server: "id" mismatch'));
								}
								else if (!(newRoom.name && newRoom.name === testRoom.name)){
									result.comments.push(printError('Promise returned by "addRoom" does not resolve to the object returned by the server: "name" mismatch'));
								}
								else if (!(newRoom.image && newRoom.image === testRoom.image)){
									result.comments.push(printError('Promise returned by "addRoom" does not resolve to the object returned by the server: "image" mismatch'));
								}
								else {
									result.score += 0.5;
									printOK('Promise returned by "addRoom" resolves to the object returned by the server')
								}
							}
						}
					}
					catch (err){

						result.comments.push(printError('Unexpected error when calling "addRoom": ' + err.message));
						print(err);
					}
					finally {
						Service.origin = savedOrigin;
					}

					// check server-side error handling
					dataToSign = Math.random().toString();
					Service.origin = testServer + 'error/' + dataToSign;	// test server (black-box)
					try {
						let testRoom = {
							name: Math.random().toString(),
							image: Math.random().toString()
						};
						print('Calling "Service.addRoom" with "Service.origin" set to ' + Service.origin);
						let promise = Service.addRoom(testRoom);

						if (!(promise && promise instanceof Promise)){
							result.comments.push(printError('"addRoom" should return a Promise'));
						}
						else {
							let error = await promise;
							
							// should not reach here
							result.comments.push(printError('Promise returned by "addRoom" should reject upon any server-side error'));
						}
					}
					catch (err){

						if (!(err instanceof Error && err.message === ('Server Error 500: ' + dataToSign))){
							result.comments.push(printError('Promise rejected by "addRoom" upon server-side error should contain an Error object with the error message given by the server'));
						}
						else {
							result.score += 0.5;
							printOK('Promise rejected by "addRoom" upon server-side error contains an Error object with the error message given by the server')
						}
					}
					finally {
						Service.origin = savedOrigin;
					}

					// check client-side error handling
					dataToSign = Math.random().toString();
					Service.origin = 'http://invalid-url';	// test server (black-box)
					try {
						let testRoom = {
							name: Math.random().toString(),
							image: Math.random().toString()
						};
						print('Calling "Service.addRoom" with "Service.origin" set to ' + Service.origin);
						let promise = Service.addRoom(testRoom);

						if (!(promise && promise instanceof Promise)){
							result.comments.push(printError('"addRoom" should return a Promise'));
						}
						else {
							let error = await promise;
							
							// should not reach here
							result.comments.push(printError('Promise returned by "addRoom" should reject upon any client-side error'));
						}
					}
					catch (err){

						if (!(err instanceof Error)){
							result.comments.push(printError('Promise rejected by "addRoom" upon client-side error should contain an Error object'));
						}
						else {
							result.score += 0.25;
							printOK('Promise rejected by "addRoom" upon client-side error contains an Error object')
						}
					}
					finally {
						Service.origin = savedOrigin;
					}

					// Check server side functionality, assuming addRoom is correctly implemented
					try {
						// assuming lobby.rooms exists
						let mainScope = __tester.exports.get(main);
						let lobby = mainScope['lobby'];
						let originalChatrooms = await remoteFunc('getGlobalObject', 'chatrooms');

						let testRoom = {
							name: Math.random().toString(),
							image: __tester.defaults.image
						};

						print('Calling "Service.addRoom" with "Service.origin" set to ' + Service.origin);
						
						let newRoom = await Service.addRoom(testRoom);

						if (!(newRoom && typeof newRoom.id === 'string')){
							result.comments.push(printError('Could not find an id in the new room object returned by the server'));
						}
						else {
							result.score += 0.25;
							printOK('Found an id in the new room object returned by the server')

							print('Checking if "chatrooms" and "messages" were updated in server.js');

							let chatrooms = await remoteFunc('getGlobalObject', 'chatrooms');
							let messages = await remoteFunc('getGlobalObject', 'messages');

							let found = chatrooms.find(item => item.id === newRoom.id);
							if (!found){
								result.comments.push(printError('Newly added room was not added to "chatrooms" in server.js'));
							}
							else {
								result.score += 0.25;
								printOK('Newly added room was added to "chatrooms" in server.js')

								if (found.name !== testRoom.name){
									result.comments.push(printError('Newly added room in "chatrooms" does not have the "name" given by the client'));
								}
								else if (found.image !== testRoom.image){
									result.comments.push(printError('Newly added room in "chatrooms" does not have the "image" given by the client'));
								}
								else {
									result.score += 0.25;
									printOK('Newly added room in "chatrooms" has the properties set by the client')
								}
							}

							let array = messages[newRoom.id];
							if (!(array && array instanceof Array && array.length === 0)){
								result.comments.push(printError('An empty array should be added to messages["' + newRoom.id + '"] in server.js'));
							}
							else {
								result.score += 0.25;
								printOK('An empty array was added to messages["' + newRoom.id + '"] in server.js')
							}

							if (lobby.rooms[newRoom.id]){
								delete lobby.rooms[newRoom.id];
							}
							// reset chatrooms
							await remoteFunc('callObjectByString', 'chatrooms.splice', 0, chatrooms.length, ...originalChatrooms);
						}
						
						// check server returning error
						try {
							print('Checking if server handles malformed request gracefully');

							let aborter = new AbortController();
							let timeout = setTimeout(() => aborter.abort(), 5000);
							let resp = await originalFetch(Service.origin + '/chat', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: '',
								signal: aborter.signal
							});
							clearTimeout(timeout);

							if (resp.status !== 400){
								result.comments.push(printError('Server should return HTTP status 400 when request is not formatted properly'));
							}
							else {
								result.score += 0.25;
								printOK('Server returns HTTP status 400 when request is not formatted properly')

								let responseText = await resp.text();

								if (!responseText){
									result.comments.push(printError('Server should return some error message with HTTP status 400'));
								}
								else {
									result.score += 0.25;
									printOK('Server returns some error message with HTTP status 400')
								}
							}
						}
						catch (err){
							if (err.name === 'AbortError'){
								result.comments.push(printError('Request timed out because server did not return any response to a malformed request'));
							}
							else throw err;
						}
					}
					catch (err){
						result.comments.push(printError('Error while testing POST endpoint on the server: ' + err.message));
						print(err);
					}
				}
			}

			// check click event handler
			print('Checking click event handler of lobbyView.buttonElem');
			let testLobby = new Lobby();
			let testView = new LobbyView(testLobby);
			let testRoom = {
				id: Math.random().toString(),
				name: Math.random().toString(),
				image: __tester.defaults.image
			};

			let originalAddRoom = Service.addRoom;

			try {
				await new Promise((resolve, reject) => {
					Service.addRoom = async (data) => {
						resolve();
						
						if (data && data.name){
							result.score += 0.25;
							printOK('"Service.addRoom" was invoked and the argument has a property "name"')
						}
						else {
							result.comments.push(printError('"Service.addRoom" was invoked, but the argument did not have a property "name"'));
						}

						return {
							id: testRoom.id,
							name: data.name,
							image: data.image
						};
					};

					testView.inputElem.value = testRoom.name;
					testView.buttonElem.click();

					setTimeout(() => reject(new Error('"Service.addRoom" was not invoked when clicking lobbyView.buttonElem')), 200);
				});

				// check that room was added
				if (!testLobby.rooms[testRoom.id]){
					result.comments.push(printError('Newly added room was not added to the lobby after Service.addRoom resolved successfully'));
				}
				else {
					result.score += 0.25;
					printOK('Newly added room was added to the lobby after Service.addRoom resolved successfully')
				}
			}
			catch (err){
				result.comments.push(printError('Error while testing buttonElem "click" event listener: ' + err.message));
				print(err);
			}

			// check that room is not added if Service.addRoom rejects
			try {
				testLobby.rooms = {};

				await new Promise((resolve, reject) => {
					Service.addRoom = async (data) => {
						resolve();
						throw new Error('Unknown Error (intentionally thrown by the test script)');
					};

					testView.inputElem.value = testRoom.name;
					testView.buttonElem.click();

					setTimeout(() => reject(new Error('"Service.addRoom" was not invoked when clicking lobbyView.buttonElem')), 200);
				});

				// check that room was not added
				if (Object.keys(testLobby.rooms).length > 0){
					result.comments.push(printError('No room should be added to the lobby if Service.addRoom rejects'));
				}
				else {
					result.score += 0.25;
					printOK('No room was added to the lobby when Service.addRoom rejected')
				}
			}
			catch (err){
				result.comments.push(printError('Error while testing buttonElem "click" event listener: ' + err.message));
				print(err);
			}

			Service.addRoom = originalAddRoom;

			return result;
		}
	},{
		id: '4',
		description: 'WebSocket Client',
		maxScore: 3,
		run: async () => {
			let result = {
				id: 4,
				score: 0,
				comments: []
			};

			// check if scoped variables were exported for testing
			let mainScope = __tester.exports.get(main);
			if (!mainScope){
				result.comments.push(printError('Unable to test: local variables inside "main" were not exported'));
			}
			else {
				// check socket variable
				print('Checking if "socket" is a WebSocket instance');
				if (!mainScope['socket']){
					result.comments.push(printError('local variable "socket" inside "main" was not found/exported'));
				}
				else {
					let socket = mainScope['socket'];
					if (!(socket instanceof WebSocket)){
						result.comments.push(printError('"socket" should be a WebSocket instance'));
					}
					else {
						result.score += 0.25;
						printOK('"socket" is a WebSocket instance')
					}

					// check message event listener
					print('Checking "message" event listener on "socket"');
					let found = __tester.listeners.find(elem => (elem.node === socket && elem.type === 'message'));
					if (!found){
						result.comments.push(printError('Could not find a "message" event listener on "socket"'));
					}
					else {
						result.score += 0.5;
						printOK('Found a "message" event listener on "socket"')

						// check event listener functionality
						let lobby = mainScope['lobby'];
						if (!(lobby instanceof Lobby)){
							result.comments.push(printError('"lobby" should be a Lobby instance'));
						}
						else {
							let originalRooms = lobby.rooms;
							let originalAddMessage = Room.prototype.addMessage;
							
							// replace lobby.rooms with test rooms
							let testRooms = {};
							let room = makeTestRoom();
							testRooms[room.id] = room;
							lobby.rooms = testRooms;

							let testMessage = {
								roomId: room.id,
								username: Math.random().toString(),
								text: Math.random().toString()
							}

							let evt = new MessageEvent('message', { data: JSON.stringify(testMessage) });

							let promise = new Promise((resolve, reject) => {
								// replace Room.prototype.addMessage with test function
								Room.prototype.addMessage = (username, text) => {
									result.score += 0.5;
									printOK('"addMessage" was invoked')
									if (username === testMessage.username
										&& text === testMessage.text){
										result.score += 0.5;
										printOK(`"addMessage" was invoked with correct arguments.`)
									}
									else {
										result.comments.push(printError(`"addMessage" was invoked with incorrect arguments. Expecting: username = ${testMessage.username}, text = ${testMessage.text}; but got: username = ${username}, text = ${text}`));
									}
									resolve();
								}

								print('Emitting test "message" event');

								// call listener to test
								found.invoke(evt);

								setTimeout(() => reject(new Error('"addMessage" was not called upon "message" event')), 200);
							});

							try {
								await promise;	
							}
							catch (err){
								result.comments.push(printError('Error while testing "message" event listener: ' + err.message));
								print(err);
							}
							finally {
								// restore original objects
								Room.prototype.addMessage = originalAddMessage;
								lobby.rooms = originalRooms;
							}
						}
					}
				}
			}

			// check ChatView modification
			print('Checking changes in "ChatView"');
			if (typeof ChatView === 'undefined'){
				result.comments.push(printError('Could not find "ChatView"'));
			}
			else {
				let testObject = {
					value: Math.random()
				};

				let testView = new ChatView(testObject);

				if (testView.socket !== testObject){
					result.comments.push(printError('"ChatView" constructor should accept a single argument "socket" and assign it to the "socket" property'));
				}
				else {
					result.score += 0.25;
					printOK('"ChatView" constructor accepts a single argument "socket" and assigns it to the "socket" property');

					// check that "chatView" initialization is updated
					if (!mainScope['socket']){
						result.comments.push(printError('local variable "socket" inside "main" was not found/exported'));
					}
					else if (!mainScope['chatView']){
						result.comments.push(printError('local variable "chatView" inside "main" was not found/exported'));
					}
					else {
						let socket = mainScope['socket'];
						let chatView = mainScope['chatView'];
						if (chatView.socket !== socket){
							result.comments.push(printError('"chatView" should be initialized with the "socket" object created inside "main"'));
						}
						else {
							result.score += 0.25;
							printOK('"chatView" is initialized with the "socket" object created inside "main"')
						}
					}

					// check socket send in sendMessage
					let testRoom = makeTestRoom();
					let testValue = Math.random().toString();
					testView.room = testRoom;
					testView.inputElem.value = testValue;

					let promise = new Promise((resolve, reject) => {
						testObject.send = (jsonString) => {
							if (typeof jsonString !== 'string'){
								result.comments.push(printError('"send" expects a JSON string. Got: ' + (typeof jsonString)));
							}
							else {
								result.score += 0.25;
								printOK('"send" received a string as the argument')

								let parsed;
								try {
									parsed = JSON.parse(jsonString);

									if (parsed.roomId !== testRoom.id){
										result.comments.push(printError('"roomId" in the message does not match the expected value. Expected: ' + testRoom.id + ' but got ' + parsed.roomId));
									}
									else if (parsed.username !== profile.username){
										result.comments.push(printError('"username" in the message does not match the expected value. Expected: ' + profile.username + ' but got ' + parsed.username));
									}
									else if (parsed.text !== testValue){
										result.comments.push(printError('"text" in the message does not match the expected value. Expected: ' + testValue + ' but got ' + parsed.text));
									}
									else {
										result.score += 0.5;
										printOK('The JSON string contains the correct values')
									}

								}
								catch (err){
									result.comments.push(printError('Error while parsing the serialized object passed to "send" - expecting JSON format.'));
									print(err);
								}
							}

							resolve();
						};

						print('Checking "chatView.sendMessage"');

						testView.sendMessage();

						setTimeout(() => reject(new Error('WebSocket "send" was not called inside "sendMessage"')), 200);

					});

					try {
						await promise;
					}
					catch (err){
						result.comments.push(printError('Error while testing "send" invocation inside "sendMessage": ' + err.message));
						print(err);
					}

				}
			}

			return result;
		}
	},{
		id: '5',
		description: 'WebSocket Server',
		maxScore: 4,
		run: async () => {
			let result = {
				id: 5,
				score: 0,
				comments: []
			};

			try {
				// check ws is installed
				print('Checking if "ws" NPM module was installed in the server');
				let installed = await remoteFunc('checkRequire', 'ws');
				if (installed.error){
					result.comments.push(printError('"ws" module was not installed: ' + installed.error));
				}
				else {
					result.score += 0.5;
					printOK('"ws" was installed')

					// check broker in server.js
					try {
						print('Trying to access "broker" in server.js');
						let isServer = await remoteFunc('checkObjectType', 'broker', 'ws/Server');

						if (isServer.error){
							result.comments.push(printError('Error while checking "broker" type: ' + isServer.error));
						}
						else {
							if (!isServer.value){
								result.comments.push(printError('"broker" is not a "ws.Server" instance'));
							}
							else {
								result.score += 0.5;
								printOK('"broker" is a "ws.Server" instance')
							}
						}

						// end-to-end testing for client messaging
						print('Starting end-to-end WebSocket test with 3 test clients A, B, and C');

						let clients = await remoteFunc('getObjectByString', 'broker.clients');
						let originalLength = clients.length;

						let clientA = new WebSocket(__tester.defaults.webSocketServer),
							clientB = new WebSocket(__tester.defaults.webSocketServer),
							clientC = new WebSocket(__tester.defaults.webSocketServer);
						let messagesA = [], messagesB = [], messagesC = [];
						clientA.addEventListener('message', evt => messagesA.push(JSON.parse(evt.data)));
						clientB.addEventListener('message', evt => messagesB.push(JSON.parse(evt.data)));
						clientC.addEventListener('message', evt => messagesC.push(JSON.parse(evt.data)));

						await delay(500);

						clients = await remoteFunc('getObjectByString', 'broker.clients');
						let lengthAfter = clients.length;

						if (lengthAfter !== originalLength + 3){
							result.comments.push(printError('Could not find newly added WebSocket clients at the server.'));
						}
						else {

							// assuming lobby.rooms exists
							let mainScope = __tester.exports.get(main);
							let lobby = mainScope['lobby'];
							let testRoomId = Object.keys(lobby.rooms)[0];

							// make a copy of messages to restore it later
							let clientMessagesCopy = lobby.rooms[testRoomId].messages.splice(0, lobby.rooms[testRoomId].messages.length);
							let serverMessages = await remoteFunc('getObjectByString', 'messages["' + testRoomId + '"]');

							// client A sending
							let testMessage = {
								roomId: testRoomId,
								username: Math.random().toString(),
								text: Math.random().toString()
							};

							print('Client A sending a message');

							clientA.send(JSON.stringify(testMessage));

							await delay(250);

							if (messagesA.length === 0 && messagesB.length === 1 && messagesC.length === 1){
								if (!(messagesB[0].roomId === testMessage.roomId
									&& messagesB[0].username === testMessage.username
									&& messagesB[0].text === testMessage.text))
								{
									result.comments.push(printError('Test client B did not receive the message sent by test client A'));
								}
								else if (!(messagesC[0].roomId === testMessage.roomId
									&& messagesC[0].username === testMessage.username
									&& messagesC[0].text === testMessage.text))
								{
									result.comments.push(printError('Test client C did not receive the message sent by test client A'));
								}
								else if (messagesB[0].roomId === testMessage.roomId
									&& messagesB[0].username === testMessage.username
									&& messagesB[0].text === testMessage.text
									&& messagesC[0].roomId === testMessage.roomId
									&& messagesC[0].username === testMessage.username
									&& messagesC[0].text === testMessage.text){
									result.score += 0.5;
									printOK('Test clients received messages as expected when sending with test client A')
								}
								else {
									result.comments.push(printError('Test clients did not receive messages as expected when sending with test client A'));
								}
							}
							else {
								result.comments.push(printError('Test clients did not receive messages as expected when sending with test client A. Expected message count A = 0, B = 1, C = 1, but have ' + `A = ${messagesA.length}, B = ${messagesB.length}, C = ${messagesC.length}`));
							}

							print('checking if the message sent by client A was added in the "messages" object');

							let messagesAfterA = await remoteFunc('getObjectByString', 'messages["' + testRoomId + '"]');
							if (messagesAfterA.length !== serverMessages.length + 1){
								if (messagesAfterA.length - serverMessages.length > 1){
									result.comments.push(printError('Too many messages were added in messages["'+testRoomId+'"] in server.js'));
								}
								else {
									result.comments.push(printError('The test message was not added in messages["'+testRoomId+'"] in server.js'));
								}
							}
							else {
								let lastMessage = messagesAfterA[messagesAfterA.length - 1];
								if (lastMessage.username !== testMessage.username){
									result.comments.push(printError('The message added in messages["'+testRoomId+'"] does not have the same username as the test message'));
								}
								else if (lastMessage.text !== testMessage.text){
									result.comments.push(printError('The message added in messages["'+testRoomId+'"] does not have the same text as the test message'));
								}
								else {
									result.score += 0.5;
									printOK('The message added in messages["'+testRoomId+'"] has the same text as the test message')
								}
							}

							// client B sending
							testMessage = {
								roomId: testRoomId,
								username: Math.random().toString(),
								text: Math.random().toString()
							};

							print('Client B sending a message');

							clientB.send(JSON.stringify(testMessage));

							await delay(250);

							if (messagesA.length === 1 && messagesB.length === 1 && messagesC.length === 2){
								if (!(messagesA[0].roomId === testMessage.roomId
									&& messagesA[0].username === testMessage.username
									&& messagesA[0].text === testMessage.text))
								{
									result.comments.push(printError('Test client A did not receive the message sent by test client B'));
								}
								else if (!(messagesC[1].roomId === testMessage.roomId
									&& messagesC[1].username === testMessage.username
									&& messagesC[1].text === testMessage.text))
								{
									result.comments.push(printError('Test client C did not receive the message sent by test client B'));
								}
								else if (messagesA[0].roomId === testMessage.roomId
									&& messagesA[0].username === testMessage.username
									&& messagesA[0].text === testMessage.text
									&& messagesC[1].roomId === testMessage.roomId
									&& messagesC[1].username === testMessage.username
									&& messagesC[1].text === testMessage.text){
									result.score += 0.5;
									printOK('Test clients received messages as expected when sending with test client B')
								}
								else {
									result.comments.push(printError('Test clients did not receive messages as expected when sending with test client B'));
								}
							}
							else {
								result.comments.push(printError('Test clients did not receive messages as expected when sending with test client A. Expected message count A = 1, B = 1, C = 2, but have ' + `A = ${messagesA.length}, B = ${messagesB.length}, C = ${messagesC.length}`));
							}

							print('checking if the message sent by client B was added in the "messages" object');

							let messagesAfterB = await remoteFunc('getObjectByString', 'messages["' + testRoomId + '"]');
							if (messagesAfterB.length !== serverMessages.length + 2){
								if (messagesAfterB.length - serverMessages.length > 2){
									result.comments.push(printError('Too many messages were added in messages["'+testRoomId+'"] in server.js'));
								}
								else {
									result.comments.push(printError('The test message was not added in messages["'+testRoomId+'"] in server.js'));
								}
							}
							else {
								let lastMessage = messagesAfterB[messagesAfterB.length - 1];
								if (lastMessage.username !== testMessage.username){
									result.comments.push(printError('The message added in messages["'+testRoomId+'"] does not have the same username as the test message'));
								}
								else if (lastMessage.text !== testMessage.text){
									result.comments.push(printError('The message added in messages["'+testRoomId+'"] does not have the same text as the test message'));
								}
								else {
									result.score += 0.5;
									printOK('The message added in messages["'+testRoomId+'"] has the same text as the test message')
								}
							}

							// client C sending
							testMessage = {
								roomId: testRoomId,
								username: Math.random().toString(),
								text: Math.random().toString()
							};

							print('Client C sending a message');

							clientC.send(JSON.stringify(testMessage));

							await delay(250);

							if (messagesA.length === 2 && messagesB.length === 2 && messagesC.length === 2){
								if (!(messagesA[1].roomId === testMessage.roomId
									&& messagesA[1].username === testMessage.username
									&& messagesA[1].text === testMessage.text))
								{
									result.comments.push(printError('Test client A did not receive the message sent by test client C'));
								}
								else if (!(messagesB[1].roomId === testMessage.roomId
									&& messagesB[1].username === testMessage.username
									&& messagesB[1].text === testMessage.text))
								{
									result.comments.push(printError('Test client C did not receive the message sent by test client A'));
								}
								else if (messagesA[1].roomId === testMessage.roomId
									&& messagesA[1].username === testMessage.username
									&& messagesA[1].text === testMessage.text
									&& messagesB[1].roomId === testMessage.roomId
									&& messagesB[1].username === testMessage.username
									&& messagesB[1].text === testMessage.text){
									result.score += 0.5;
									printOK('Test clients received messages as expected when sending with test client C')
								}
								else {
									result.comments.push(printError('Test clients did not receive messages as expected when sending with test client C'));
								}
							}
							else {
								result.comments.push(printError('Test clients did not receive messages as expected when sending with test client A. Expected message count A = 2, B = 2, C = 2, but have ' + `A = ${messagesA.length}, B = ${messagesB.length}, C = ${messagesC.length}`));
							}

							print('checking if the message sent by client C was added in the "messages" object');

							let messagesAfterC = await remoteFunc('getObjectByString', 'messages["' + testRoomId + '"]');
							if (messagesAfterC.length !== serverMessages.length + 3){
								if (messagesAfterC.length - serverMessages.length > 3){
									result.comments.push(printError('Too many messages were added in messages["'+testRoomId+'"] in server.js'));
								}
								else {
									result.comments.push(printError('The test message was not added in messages["'+testRoomId+'"] in server.js'));
								}
							}
							else {
								let lastMessage = messagesAfterC[messagesAfterC.length - 1];
								if (lastMessage.username !== testMessage.username){
									result.comments.push(printError('The message added in messages["'+testRoomId+'"] does not have the same username as the test message'));
								}
								else if (lastMessage.text !== testMessage.text){
									result.comments.push(printError('The message added in messages["'+testRoomId+'"] does not have the same text as the test message'));
								}
								else {
									result.score += 0.5;
									printOK('The message added in messages["'+testRoomId+'"] has the same text as the test message')
								}
							}

							// restore messages
							await remoteFunc('setObjectByString', 'messages.' + testRoomId, serverMessages);
							lobby.rooms[testRoomId].messages.splice(0, lobby.rooms[testRoomId].messages.length, ...clientMessagesCopy);


						}

						clientA.close();
						clientB.close();
						clientC.close();

					}
					catch (err){
						result.comments.push(printError('Error while checking "broker" object on the server: ' + err.message));
						print(err);
					}
				}
			}
			catch (err){
				result.comments.push(printError('Error while testing require("ws"). ' + err.message));
				print(err);
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