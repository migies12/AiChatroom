// override addEventListener to cache listener callbacks for testing
const __tester = {
	listeners: [],
	timers: [],
	exports: new Map(),
	defaults: {
		testUser1: {
			username: 'alice',
			password: 'secret',
			saltedHash: '1htYvJoddV8mLxq3h7C26/RH2NPMeTDxHIxWn49M/G0wxqh/7Y3cM+kB1Wdjr4I='
		},
		testUser2: {
			username: 'bob',
			password: 'password',
			saltedHash: 'MIYB5u3dFYipaBtCYd9fyhhanQkuW4RkoRTUDLYtwd/IjQvYBgMHL+eoZi3Rzhw='
		},
		testRoomId: 'room-1',
		cookieName: 'cpen322-session',
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
	const a = 'a5';
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

	const expressFunc = (func, ...args) => safeFetch('cpen322/' + a + '/express', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ func, args })
	});

	let __savedCookie = null;
	const saveCookie = () => (__savedCookie = document.cookie);
	const deleteCookie = async () => {
		document.cookie = document.cookie + '; expires=' + (new Date()).toUTCString();
		await delay(50);
	};
	const restoreCookie = async () => {
		await deleteCookie();
		document.cookie = __savedCookie;
	};
	const splitCookie = (str) => [ str.substring(0, str.indexOf('=')), str.substring(str.indexOf('=') + 1) ];

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

	const selectRandomUser = () => Math.random() < 0.5 ? __tester.defaults.testUser1 : __tester.defaults.testUser2;

	const shuffle = (list) => {
		let array = list.slice();
		for (let i = array.length - 1; i > 0; i--) {
	        const j = Math.floor(Math.random() * (i + 1));
	        [array[i], array[j]] = [array[j], array[i]];
	    }
	    return array;
	}

	const shannonEntropy = (str) => {
		let counts = Array.from(str).reduce((acc, ch) => {
			if (!acc[ch]) acc[ch] = 0;
			acc[ch] ++;
			return acc;
		}, {});

		return -1 * Object.keys(counts).reduce((acc, ch) => acc + ((counts[ch] / str.length) * Math.log(counts[ch] / str.length) / Math.log(2)), 0);
	};

	const tokenStrength = (str) => shannonEntropy(str) * str.length;
	const randomBase64 = (len) => btoa(crypto.getRandomValues(new Uint8Array(len)).reduce((acc, c) => acc + String.fromCharCode(c), ''));
	const bufToBase64 = (buf) => btoa(new Uint8Array(buf).reduce((acc, c) => acc + String.fromCharCode(c), ''));
	const sha256Base64 = async (text) => crypto.subtle.digest('SHA-256', new TextEncoder('utf-8').encode(text)).then(buf => bufToBase64(buf));

	const defer = () => {
		let defer = {};
		defer.promise = new Promise((resolve, reject) => {
			defer.resolve = resolve;
			defer.reject = reject;
		});
		return defer;
	}

	const createDOM = (htmlString) => {
		let template = document.createElement('template');
		template.innerHTML = htmlString.trim();
		return template.content.firstChild;
	}

	/* tests */
	const tests = [{
		id: '1',
		description: 'Login Page HTML',
		maxScore: 2,
		run: async () => {
			let result = {
				id: 1,
				score: 0,
				comments: []
			};

			let form = null;

			print('(Client) Checking if the login page has a form element');
			if (window.location.pathname === '/login' || window.location.pathname === '/login.html'){
				// if we're on the login page, we can directly access the document
				form = document.querySelector('form');
			}
			else {
				// if we're NOT on the login page, we need to fetch the html to check
				let resp = await originalFetch('/login.html').then(resp => resp.text());
				if (!resp){
					result.comments.push(printError('Could not fetch "/login.html" from the server'));
				}
				else {
					let template = document.createElement('template');
					template.innerHTML = resp.trim();

					form = template.content.querySelector('form');
				}
			}

			if (!form){
				result.comments.push(printError('Could not find a form element'));
			}
			else {
				printOK('Found a form element');

				print('(Client) Checking form "method" attribute');
				if (!(form.attributes.method && form.attributes.method.value === 'POST')){
					result.comments.push(printError('form should have the "method" attribute set to "POST"'));
				}
				else {
					result.score += 0.25;
					printOK('"method" set to "POST"');
				}

				print('(Client) Checking form "action" attribute');
				if (!(form.attributes.action && form.attributes.action.value === '/login')){
					result.comments.push(printError('form should have the "action" attribute set to "/login"'));
				}
				else {
					result.score += 0.25;
					printOK('"action" set to "/login"');
				}

				// check inputs
				print('(Client) Checking if form element contains username input');
				let userInput = form.querySelector('input[type=text][name=username]');
				if (!userInput){
					result.comments.push(printError('form should contain a text input element with "name" attribute set to "username"'));
				}
				else {
					result.score += 0.5;
					printOK('Found username input');
				}

				print('(Client) Checking if form element contains password input');
				let pwInput = form.querySelector('input[type=password][name=password]');
				if (!pwInput){
					result.comments.push(printError('form should contain a password input element with "name" attribute set to "password"'));
				}
				else {
					result.score += 0.5;
					printOK('Found password input');
				}

				print('(Client) Checking if form element contains a submit input or button');
				let submit = form.querySelector('input[type=submit],button[type=submit]');
				if (!submit){
					result.comments.push(printError('form should contain a submit input element or a submit button'));
				}
				else {
					result.score += 0.5;
					printOK('Found submit ' + submit.tagName.toLowerCase());
				}
			}

			return result;

		}
	},{
		id: '2',
		description: 'User Database',
		maxScore: 1,
		run: async () => {
			let result = {
				id: 2,
				score: 0,
				comments: []
			};

			let testUser = selectRandomUser();

			try {
				print('(Server) Checking "Database.prototype.getUser" implementation (by calling "db.getUser")');
				let user = await remoteFunc('callObjectByString', 'db.getUser', testUser.username);

				// it resolved to something
				result.score += 0.5;

				if (!(user.username && user.username === testUser.username)){
					result.comments.push(printError('The object returned by "db.getUser" does not have the expected "username"', 'Expected: ' + testUser.username, 'Got: ' + user.username));
				}
				else if (!user.password && user.username === testUser.saltedHash){
					result.comments.push(printError('The object returned by "db.getUser" does not have the expected "password"', 'Expected: ' + testUser.saltedHash, 'Got: ' + user.password));
				}
				else {
					result.score += 0.5;
					printOK('The object has the right property values');
				}
			}
			catch (err){
				if (err.message.indexOf('timed out') > -1){
					result.comments.push(printError('"db.getUser" did not resolve to anything (test timed out after waiting for 5 seconds)'));
				}
				else {
					result.comments.push(printError('Error upon calling "db.getUser" in server.js: ' + err.message));
				}
			}

			return result;
		}
	},{
		id: '3',
		description: 'Session Creation',
		maxScore: 5,
		run: async () => {
			let result = {
				id: 3,
				score: 0,
				comments: []
			};

			let testUser = selectRandomUser();

			try {
				print('(Server) Trying to access "sessionManager" in server.js');
				let manager = await remoteFunc('getGlobalObject', 'sessionManager');

				if (!manager){
					result.comments.push(printError('Found "sessionManager" but it is = ' + String(manager)));
				}
				else {
					printOK('Found "sessionManager"');
					print('(Server) Checking if "sessionManager" is a SessionManager instance');
					let isManager = await remoteFunc('checkObjectType', 'sessionManager', './SessionManager.js/');

					if (!isManager){
						result.comments.push(printError('"sessionManager" object is not a "SessionManager" instance'));
					}
					else {
						result.score += 0.25;
						printOK('"sessionManager" is a SessionManager instance');

						// test if createSession works
						saveCookie();
						await deleteCookie();

						print('(Server) Checking "createSession" implementation');
						let header = await expressFunc('testCreateSession', testUser.username, 2000);

						let cookie = header.split('; ').reduce((acc, line) => {
							let eq = line.indexOf('=');
							acc[line.substring(0, eq)] = line.substring(eq + 1);
							return acc;
						}, {});
						
						let keyval = splitCookie(document.cookie);

						print('(Server) Checking if "createSession" sets the cookie name correctly');
						if (!(keyval[0] && keyval[0] === __tester.defaults.cookieName)){
							result.comments.push(printError('"sessionManager.createSession" does not set cookie name to "' + __tester.defaults.cookieName + '"'));
						}
						else {
							result.score += 0.25;
							printOK('"sessionManager.createSession" sets cookie name "' + __tester.defaults.cookieName + '"');
						}

						print('(Server) Checking if "createSession" sets the cookie value correctly');
						if (!keyval[1]){
							result.comments.push(printError('"sessionManager.createSession" does not set cookie value'));
						}
						else {
							let strength = tokenStrength(keyval[1]);
							if (strength < 88){
								result.comments.push(printError('The cookie value set by "sessionManager.createSession" is too weak (needs at least 88). Current strength = ' + strength, '\n\tStrength formula = Number_of_Chars(value) * Shannon_Entropy(value)', '\n\thttp://bearcave.com/misl/misl_tech/wavelets/compression/shannon.html'));
							}
							else {
								result.score += 0.5;
								printOK('"sessionManager.createSession" sets a strong enough cookie value (strength = ' + (Math.round(100 * strength) / 100) + ')');

								print('(Server) Checking if Max-Age was set');
								if (!(cookie['Max-Age'] && cookie['Max-Age'] === '2')){
									result.comments.push(printError('"sessionManager.createSession" does not set Max-Age attribute on the cookie to the given maxAge argument. Expected Max-Age = 2, but got ' + String(cookie['Max-Age'])));
								}
								else {
									result.score += 0.5;
									printOK('"sessionManager.createSession" sets Max-Age attribute');
								}

								print('(Server) Checking if ' + keyval[1] + ' is a valid session');
								let sessionUser = await remoteFunc('callObjectByString', 'sessionManager.getUsername', keyval[1]);
								if (!(sessionUser && sessionUser === testUser.username)){
									result.comments.push(printError('Could not find a valid session after "createSession" was called'));
								}
								else {
									result.score += 0.25;
									printOK('"sessionManager.createSession" creates a new session');

									print('(Server) Waiting for 3 seconds for session to expire');
									await delay(3000);

									print('(Server) Checking if ' + keyval[1] + ' is a valid session');
									sessionUser = await remoteFunc('callObjectByString', 'sessionManager.getUsername', keyval[1]);
									console.log(sessionUser);
									if (sessionUser !== null){
										result.comments.push(printError('sessionManager is not deleting the session in the server after the cookie expired'));
									}
									else {
										result.score += 0.5;
										printOK('Session data deleted in the server after cookie expired');
									}
								}

								await restoreCookie();

								// check if isCorrectPassword works
								// generate a random list of passwords and hashes

								// inject some failures
								let fails0 = Array.from({ length: 5 }, _ => {
									let pw = randomBase64(9);
									return {
										pw: pw,
										hash: pw,
										result: false
									};
								});

								let fails1 = Array.from({ length: 5 }, _ => {
									let pw = randomBase64(9);
									let salt = randomBase64(15);
									return {
										pw: pw,
										hash: pw + salt,
										result: false
									};
								});

								let fails2 = Array.from({ length: 5 }, _ => ({ pw: randomBase64(9) }));
								await forEachAsync.call(fails2, async (item) => {
									let salt = randomBase64(15);
									let hash = await sha256Base64(item.pw);
									item.hash = hash;
									item.result = false;
								});

								let fails3 = Array.from({ length: 5 }, _ => ({ pw: randomBase64(9) }));
								await forEachAsync.call(fails3, async (item) => {
									let salt = randomBase64(15);
									let hash = await sha256Base64(item.pw);
									item.hash = salt + hash;
									item.result = false;
								});

								let fails4 = Array.from({ length: 5 }, _ => ({ pw: randomBase64(9) }));
								await forEachAsync.call(fails4, async (item) => {
									let salt = randomBase64(15);
									let hash = await sha256Base64(item.pw + salt);
									item.hash = hash;
									item.result = false;
								});

								let passes = Array.from({ length: 5 }, _ => ({ pw: randomBase64(9) }));
								await forEachAsync.call(passes, async (item) => {
									let salt = randomBase64(15);
									let hash = await sha256Base64(item.pw + salt);
									item.hash = salt + hash;
									item.result = true;
								});

								let checks = passes.concat(fails0, fails1, fails2, fails3, fails4);
								checks = shuffle(checks);

								let calls = checks.map(item => [ 'isCorrectPassword', item.pw, item.hash ]);

								print('(Server) Checking if "isCorrectPassword" works');
								let callResults = await remoteFunc('callLines', calls);

								let compare = checks.reduce((acc, item, index) => {
									acc.result = acc.result && item.result === callResults[index];
									if (item.result !== callResults[index]){
										acc.comments.push(`Expected isCorrectPassword("${item.pw}", "${item.hash}") to be ${item.result}, but got ${callResults[index]}`);
									}
									return acc;
								}, { result: true, comments: [] });

								if (compare.result !== true){
									compare.comments.forEach(comment => {
										result.comments.push(printError(comment));
									});
								}
								else {
									result.score += 1;
									printOK('"isCorrectPassword" works as expected');
								}

								// Test POST /login endpoint
								let originalCookie = document.cookie;

								try {
									print('(Server) Checking POST /login handler');
									let login = await originalFetch('/login', {
										method: 'POST',
										headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
										body: `username=${testUser.username}&password=${testUser.password}`
									});

									print('(Server) Checking if POST /login handler redirects to "/" upon successful log in');
									if (!(login.status === 200 && login.redirected && login.url === window.location.origin + '/')){
										result.comments.push(printError('POST "/login" should eventually redirect to "/" when given the right username and password'));
									}
									else {
										result.score += 0.5;
										printOK('POST "/login" returns via redirection to "/"');

										print('(Server) Checking if POST /login handler sets a new cookie');
										
										let newCookie = document.cookie;
										if (newCookie === originalCookie){
											result.comments.push(printError('POST "/login" should set a new cookie upon successful log in'));
										}
										else {
											result.score += 0.5;
											printOK('POST "/login" sets a new cookie upon log in');
										}

										let cookieValue = newCookie.substring(newCookie.indexOf('=') + 1);

										print('(Server) Checking if ' + cookieValue + ' is a valid session');
										let sessionUser = await remoteFunc('callObjectByString', 'sessionManager.getUsername', cookieValue);

										if (!(sessionUser && sessionUser === testUser.username)){
											result.comments.push(printError('Could not find a valid session after a successful log in'));
										}
										else {
											result.score += 0.25;
											printOK('POST "/login" creates a new session');
										}
									}

									print('(Server) Checking POST /login handler error handling (user does not exist)');
									let resp1 = await originalFetch('/login', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/x-www-form-urlencoded'
										},
										body: `username=${Math.random().toString(16).substr(2)}&password=${Math.random().toString(16).substr(2)}`
									});

									if (!(resp1.status === 200 && resp1.redirected && resp1.url ===  window.location.origin + '/login')){
										result.comments.push(printError('Was expecting POST /login to redirect to login page when the user does not exist'));
									}
									else {
										result.score += 0.25;
										printOK('POST "/login" redirects to login page when user does not exist');
									}

									print('(Server) Checking POST /login handler error handling (incorrect password)');
									let resp2 = await originalFetch('/login', {
										method: 'POST',
										headers: {
											'Content-Type': 'application/x-www-form-urlencoded'
										},
										body: `username=${testUser.username}&password=${Math.random().toString(16).substr(2)}`
									});

									if (!(resp2.status === 200 && resp2.redirected && resp2.url ===  window.location.origin + '/login')){
										result.comments.push(printError('Was expecting POST /login to redirect to login page when the password is incorrect'));
									}
									else {
										result.score += 0.25;
										printOK('POST "/login" redirects to login page when password is incorrect');
									}
								}
								catch (err){
									result.comments.push(printError('Unexpected Error while testing POST /login: ' + err.message, err));
								}
								finally {
									document.cookie = document.cookie + '; expires=' + (new Date()).toUTCString();
									await delay(50);

									document.cookie = originalCookie;
								}

							}
						}
					}
				}
			}
			catch (err){
				if (err.message.indexOf('timed out') > -1){
					result.comments.push(printError('Timed out while trying to access "sessionManager"'));
				}
				else {
					result.comments.push(printError(err.message));
				}
			}

			return result;
		}
	},{
		id: '4.1',
		description: 'Session Middleware',
		maxScore: 4,
		run: async () => {
			let result = {
				id: 4.1,
				score: 0,
				comments: []
			};

			let originalCookie = document.cookie;

			// check if they're using cookie parser
			let installed = await remoteFunc('checkRequire', 'cookie-parser');
			if (installed.error){
				result.score += 0.25;
			}
			else {
				result.comments.push(printError('"cookie-parser" module being used'));
			}

			// check middleware implementation
			print('(Server) Checking "middleware" implementation: no Cookie header set');

			await deleteCookie();

			let data = await expressFunc('testMiddleware');

			if (!(data.nextArg && data.nextArg.type === 'SessionError')){
				result.comments.push(printError('"middleware" should be calling "next" with a new "SessionError" object if the request has no cookie'));
			}
			else {
				result.score += 1;
				printOK('"middleware" calls "next" with a "SessionError" object');
			}

			// check with invalid token
			print('(Server) Checking "middleware" implementation: Cookie with invalid session token');

			document.cookie = __tester.defaults.cookieName + '=' + Math.random().toString(16).substr(2);

			data = await expressFunc('testMiddleware');

			if (!(data.nextArg && data.nextArg.type === 'SessionError')){
				result.comments.push(printError('"middleware" should be calling "next" with a new "SessionError" object if the cookie value is not valid'));
			}
			else {
				result.score += 1;
				printOK('"middleware" calls "next" with a "SessionError" object');
			}

			// check with valid token (we assume createSession works)
			print('(Server) Checking "middleware" implementation: Cookie with valid session token');
			let testUser = selectRandomUser();
			let login = await expressFunc('signInTestUser', testUser.username);

			let cookieValue = document.cookie.substring(document.cookie.indexOf('=') + 1);

			data = await expressFunc('testMiddleware');

			if (!(data.session && data.session === cookieValue)){
				result.comments.push(printError('"middleware" should be assigning the session token to the "session" property of the Request object passed to the middleware. Found = ' + String(data.session)));
			}
			else if (!(data.username && data.username === testUser.username)){
				result.comments.push(printError('"middleware" should be assigning the associated username to the "username" property of the Request object passed to the middleware. Found = ' + String(data.username)));
			}
			else if (!!data.nextArg){
				result.comments.push(printError('"middleware" should be calling "next" with no arguments'));
			}
			else {
				result.score += 0.5;
				printOK('"middleware" attaches "session" and "username" properties to the request, and calls "next" with no arguments');
			}

			// check with multiple token (we assume createSession works)
			print('(Server) Checking "middleware" implementation: cookie parsing given multiple cookies');

			let randomCookie1 = {
				name: Math.random().toString(16).substr(2),
				value: Math.random().toString(16).substr(2)
			}
			let randomCookie2 = {
				name: Math.random().toString(16).substr(2),
				value: Math.random().toString(16).substr(2)
			}
			document.cookie = randomCookie1.name + '=' + randomCookie1.value;
			document.cookie = randomCookie2.name + '=' + randomCookie2.value;

			data = await expressFunc('testMiddleware');

			if (data.nextArg && data.nextArg.type === 'SessionError'){
				result.comments.push(printError('"middleware" throws SessionError when multiple cookies are set, even though legitimate session cookie is included'));
			}
			else if (!(data.session && data.session === cookieValue)){
				result.comments.push(printError('"middleware" should be assigning the session token to the "session" property of the Request object passed to the middleware. Found = ' + String(data.session)));
			}
			else if (!(data.username && data.username === testUser.username)){
				result.comments.push(printError('"middleware" should be assigning the associated username to the "username" property of the Request object passed to the middleware. Found = ' + String(data.username)));
			}
			else if (!!data.nextArg){
				result.comments.push(printError('"middleware" should be calling "next" with no arguments'));
			}
			else {
				result.score += 0.5;
				printOK('"middleware" attaches "session" and "username" properties to the request, and calls "next" with no arguments');
			}

			document.cookie = randomCookie1.name + '=' + randomCookie1.value + '; expires=' + (new Date()).toUTCString();
			document.cookie = randomCookie2.name + '=' + randomCookie2.value + '; expires=' + (new Date()).toUTCString();

			await deleteCookie();
			
			
			print('(Server) Checking custom error handler');
			
			// sessionerror during ajax
			print('(Server) throwing SessionError from one of the handlers, with "Accept" header set to "application/json"');
			let resp = await originalFetch('cpen322/' + a + '/middleware', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ func: 'throwSessionError', args: [] })
			});

			if (resp.status !== 401){
				result.comments.push(printError('Custom error handler does not return HTTP 401 when "SessionError" is thrown from one of the request handlers and the "Accept" header is "application/json"', "\nResponse = ", resp));
			}
			else {
				result.score += 0.25;
				printOK('Custom error handler returns HTTP 401 when "SessionError" is thrown from one of the request handlers and the "Accept" header is "application/json"');
			}

			// sessionerror during traditional http
			print('(Server) throwing SessionError from one of the handlers, with "Accept" header not set to "application/json"');
			resp = await originalFetch('cpen322/' + a + '/middleware', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ func: 'throwSessionError', args: [] })
			});

			if (!(resp.status === 200 && resp.redirected && resp.url === window.location.origin + '/login')){
				result.comments.push(printError('Custom error handler does not redirect to /login when "SessionError" is thrown from one of the request handlers and the "Accept" header is not "application/json"', "\nResponse = ", resp));
			}
			else {
				result.score += 0.25;
				printOK('Custom error handler returns HTTP 200 via redirect to /login when "SessionError" is thrown from one of the request handlers and the "Accept" header is not "application/json"');
			}

			// regular error
			print('(Server) throwing arbitrary Error from one of the handlers');
			resp = await originalFetch('cpen322/' + a + '/middleware', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ func: 'throwError', args: [] })
			});

			if (resp.status !== 500){
				result.comments.push(printError('Custom error handler does not return HTTP 500 when other "Error" is thrown from one of the request handlers', "\nResponse = ", resp));
			}
			else {
				result.score += 0.25;
				printOK('Custom error handler returns HTTP 500 when other "Error" is thrown from one of the request handlers');
			}

			document.cookie = originalCookie;

			return result;
		}
	},{
		id: '4.2',
		description: 'Resource Endpoint Protection',
		maxScore: 3,
		run: async () => {
			let result = {
				id: 4.2,
				score: 0,
				comments: []
			};

			// Test endpoint protection
			let endpoints = [
				[ 'GET', '/chat/'+__tester.defaults.testRoomId+'/messages', 401, '/login', 200 ],
				[ 'GET', '/chat/'+__tester.defaults.testRoomId, 401, '/login', 200 ],
				[ 'GET', '/chat', 401, '/login', 200 ],
				[ 'GET', '/profile', 401, '/login', 200 ],
				[ 'GET', '/app.js', 401, '/login', 200 ],
				[ 'GET', '/index.html', 401, '/login', 200 ],
				[ 'GET', '/index', 401, '/login', 200 ],
				[ 'GET', '/', 401, '/login', 200 ],
				[ 'POST', '/chat', 401, '/login', 400 ],
			];

			let originalCookie = document.cookie;

			document.cookie = __tester.defaults.cookieName + '=' + Math.random().toString(16).substr(2);

			print('Testing all the endpoints, Signed-in = FALSE, Accept = application/json');

			await forEachAsync.call(endpoints, async (endpoint) => {
				let [ method, url, expectedStatus ] = endpoint;

				if (method === 'GET'){
					let resp = await originalFetch(url, {
						headers: {
							'Accept': 'application/json'
						}
					});
					if (resp.status !== expectedStatus){
						result.comments.push(printError('Expected ' + method + ' "' + url + '" to return status ' + expectedStatus + ', but it returned ' + resp.status, '\nResponse = ', resp));
					}
					else {
						result.score += 0.1;
						printOK(method + ' "' + url + '" returns status ' + resp.status + ' as expected');
					}
				}
				else if (method === 'POST'){
					let resp = await originalFetch(url, {
						method: method,
						headers: { 
							'Content-Type': 'application/json',
							'Accept': 'application/json'
						},
						body: JSON.stringify({})
					});

					if (resp.status !== expectedStatus){
						result.comments.push(printError('Expected ' + method + ' "' + url + '" to return status ' + expectedStatus + ', but it returned ' + resp.status, '\nResponse = ', resp));
					}
					else {
						result.score += 0.1;
						printOK(method + ' "' + url + '" returns status ' + expectedStatus + ' as expected');
					}
				}
			});

			let resp = await originalFetch('/login', {
				headers: {
					'Accept': 'application/json'
				}
			});
			if (!(resp.status === 200 && !resp.redirected && resp.url === window.location.origin + '/login')){
				result.comments.push(printError('Expected GET "/login" to return status 200, but it returned ' + resp.status, '\nResponse = ', resp));
			}
			else {
				result.score += 0.1;
				printOK('GET "/login" returns status ' + resp.status + ' as expected');
			}

			console.log('\n\n');
			print('Testing all the endpoints, Signed-in = FALSE, Accept = ANY');

			await forEachAsync.call(endpoints, async (endpoint) => {
				let [ method, url, expectedStatus, redirect ] = endpoint;

				if (method === 'GET'){
					let resp = await originalFetch(url);
					if (!(resp.status === 200 && resp.redirected && resp.url === window.location.origin + redirect)){
						result.comments.push(printError('Expected ' + method + ' "' + url + '" to be redirected to ' + redirect + ', but server returned ' + resp.status, '\nResponse = ', resp));
					}
					else {
						result.score += 0.1;
						printOK(method + ' "' + url + '" returns status ' + resp.status + ' as expected');
					}
				}
				else if (method === 'POST'){
					let resp = await originalFetch(url, {
						method: method,
						headers: { 
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({})
					});

					if (!(resp.status === 200 && resp.redirected && resp.url === window.location.origin + redirect)){
						result.comments.push(printError('Expected ' + method + ' "' + url + '" to be redirected to ' + redirect + ', but server returned ' + resp.status, '\nResponse = ', resp));
					}
					else {
						result.score += 0.1;
						printOK(method + ' "' + url + '" returns status ' + expectedStatus + ' as expected');
					}
				}
			});

			resp = await originalFetch('/login');
			if (!(resp.status === 200 && !resp.redirected && resp.url === window.location.origin + '/login')){
				result.comments.push(printError('Expected GET "/login" to return status 200, but it returned ' + resp.status, '\nResponse = ', resp));
			}
			else {
				result.score += 0.1;
				printOK('GET "/login" returns status ' + resp.status + ' as expected');
			}

			let testUser = selectRandomUser();
			let login = await expressFunc('signInTestUser', testUser.username);

			console.log('\n\n');
			print('Testing all the endpoints, Signed-in = TRUE, Accept = ANY');

			// signed in now, all should return 200
			await forEachAsync.call(endpoints, async (endpoint) => {
				let [ method, url, _, redirect, expectedStatus ] = endpoint;

				if (method === 'GET'){
					let resp = await originalFetch(url);
					if (!(resp.status === expectedStatus && !resp.redirected)){
						result.comments.push(printError('Expected ' + method + ' "' + url + '" to return ' + expectedStatus + ' directly, but server returned ' + resp.status + ' via redirection to ' + resp.url, '\nResponse = ', resp));
					}
					else {
						result.score += 0.1;
						printOK(method + ' "' + url + '" returns status ' + resp.status + ' as expected');
					}
				}
				else if (method === 'POST'){
					let resp = await originalFetch(url, {
						method: method,
						headers: { 
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({})
					});

					if (!(resp.status === expectedStatus && !resp.redirected)){
						result.comments.push(printError('Expected ' + method + ' "' + url + '" to return ' + expectedStatus + ', but server returned ' + resp.status, '\nResponse = ', resp));
					}
					else {
						result.score += 0.1;
						printOK(method + ' "' + url + '" returns status ' + expectedStatus + ' as expected');
					}
				}
			});

			resp = await originalFetch('/login');
			if (!(resp.status === 200 && !resp.redirected && resp.url === window.location.origin + '/login')){
				result.comments.push(printError('Expected GET "/login" to return status 200, but it returned ' + resp.status, '\nResponse = ', resp));
			}
			else {
				result.score += 0.1;
				printOK('GET "/login" returns status ' + resp.status + ' as expected');
			}

			await deleteCookie();

			document.cookie = originalCookie;

			result.score = Math.round(100 * result.score) / 100;

			return result;
		}
	},{
		id: '5',
		description: 'WebSocket protection',
		maxScore: 2,
		run: async () => {
			let result = {
				id: 6,
				score: 0,
				comments: []
			};

			saveCookie();

			await deleteCookie();

			print('Testing WebSocket connection, Signed-in = FALSE');
			let ws = new WebSocket(__tester.defaults.webSocketServer);

			await delay(100);

			if (ws.readyState !== WebSocket.CLOSED){
				result.comments.push(printError('Server should close WebSocket if it connects from an invalid session'));
			}
			else {
				result.score += 0.5;
				printOK('Server closed WebSocket connection');
			}

			ws.close();

			// try with invalid session
			document.cookie = __tester.defaults.cookieName + '=' + Math.random().toString(16).substr(2);

			print('Testing WebSocket connection, with invalid cookie');
			ws = new WebSocket(__tester.defaults.webSocketServer);

			await delay(100);

			if (ws.readyState !== WebSocket.CLOSED){
				result.comments.push(printError('Server should close WebSocket if it connects from an invalid session'));
			}
			else {
				result.score += 0.5;
				printOK('Server closed WebSocket connection');
			}

			ws.close();

			// try with valid session
			let testUser = selectRandomUser();
			let login = await expressFunc('signInTestUser', testUser.username);
			print('Testing WebSocket connection, Signed-in = TRUE');
			ws = new WebSocket(__tester.defaults.webSocketServer);

			await delay(100);

			if (ws.readyState !== WebSocket.OPEN){
				result.comments.push(printError('Server should accept WebSocket if it connects from a valid session'));
			}
			else {
				result.score += 0.5;
				printOK('Server accepted WebSocket connection');

				// check if it sets username
				let deferred = defer();
				let receiver = new WebSocket(__tester.defaults.webSocketServer);
				receiver.addEventListener('message', evt => {
					deferred.resolve(JSON.parse(evt.data));
				});

				await delay(100);

				print('Checking if "username" is overwritten by the broker');
				let fakeUsername = Math.random().toString(16).substr(2);
				ws.send(JSON.stringify({
					roomId: __tester.defaults.testRoomId,
					username: fakeUsername,
					text: 'Hello'
				}));

				let message = await deferred.promise;

				if (!(message && message.username === testUser.username)){
					result.comments.push(printError('broker should provide "username" based on the session, and ignore any "username" sent by the client'));
				}
				else {
					result.score += 0.5;
					printOK('"username" in the message was set by the broker');
				}
			}

			ws.close();

			await restoreCookie();

			return result;
		}
	}, {
		id: '6',
		description: 'User Profile',
		maxScore: 2,
		run: async () => {
			let result = {
				id: 6,
				score: 0,
				comments: []
			};

			let originalCookie = saveCookie();

			// get signed in username
			let cookieValue = originalCookie.substring(originalCookie.indexOf('=') + 1);
			let sessionUser = await remoteFunc('callObjectByString', 'sessionManager.getUsername', cookieValue);

			if (sessionUser === null){
				result.comments.push(printError("Could not find the current user using the cookie " + cookieValue));
			}
			else {
				// check middleware protection
				await deleteCookie();

				print('(Client) Making a GET request to /profile without signing in');
				let resp = await originalFetch('/profile');

				if (!(resp.status === 200 && resp.redirected && resp.url === window.location.origin + '/login')){
					result.comments.push(printError("GET /profile should redirect to /login if user is not signed in", "\nResponse = ", resp));
				}
				else {
					result.score += 0.5;
					printOK('GET /profile redirects to /login if user is not signed in');
				}

				// sign in with test user
				print('(Client) Making a GET request to /profile as signed in user');
				let testUser = selectRandomUser();

				let login = await expressFunc('signInTestUser', testUser.username);

				let userProfile = await safeFetch('/profile');

				if (!(userProfile && userProfile.username === testUser.username)){
					result.comments.push(printError("GET /profile should return an object with the 'username' of the signed in user"));
				}
				else {
					result.score += 0.5;
					printOK('GET /profile returned an object containing the username of the signed in user');

					if (window.location.pathname === '/login' || window.location.pathname === '/login.html'){
						result.comments.push(printError('Cannot run the rest of this test in Login Page'));
					}
					else {
						// check Service.getProfile
						print('(Client) Checking Service.getProfile implementation');
						if (!(Service.getProfile && Service.getProfile instanceof Function)){
							result.comments.push(printError('"Service.getProfile" should be a function'));
						}
						else {
							let data = await Service.getProfile();
							if (!isEquivalent(userProfile, data)){
								result.comments.push(printError('Object returned by "Service.getProfile" is not equivalent to the object returned by GET /profile'));
							}
							else {
								result.score += 0.5;
								printOK('"Service.getProfile" returns the same object as GET /profile');

								// check profile initialization
								print('(Client) Checking if "profile" was initialized');
								await expressFunc('signInTestUser', sessionUser);
								userProfile = await Service.getProfile();

								if (profile.username !== userProfile.username || profile.username !== sessionUser){
									result.comments.push(printError('The global "profile" object should be updated after calling Service.getProfile in "main"', profile.username, userProfile.username, sessionUser));
								}
								else {
									result.score += 0.5;
									printOK('The global "profile" object has the same "username" as the object returned by "Service.getProfile"');
								}
							}
						}
					}
				}
			}

			await restoreCookie();

			return result;
		}
	}, {
		id: '7',
		description: 'Session Deletion',
		maxScore: 2,
		run: async () => {
			let result = {
				id: 7,
				score: 0,
				comments: []
			};

			saveCookie();

			print('(Server) Checking "deleteSession" implementation');

			print('(Server) Creating a test session to delete');
			let testUser = selectRandomUser();
			let login = await expressFunc('signInTestUser', testUser.username);

			let cookieValue = document.cookie.substring(document.cookie.indexOf('=') + 1);

			if (!login){
				result.comments.push(printError('Failed to create a test session'));
			}
			else {
				// test if deleteSession works
				let deleted = await expressFunc('testDeleteSession', {
					username: testUser.username,
					session: cookieValue
				});

				print('(Server) Checking if "username" property was removed from the Request object');
				if (deleted.request.username){
					result.comments.push(printError('"sessionManager.deleteSession" does not delete the "username" property attached on the Express Request'));
				}
				else {
					result.score += 0.5;
					printOK('"sessionManager.deleteSession" deletes the "username" property of the Request)');
				}

				print('(Server) Checking if "session" property was removed from the Request object');
				if (deleted.request.session){
					result.comments.push(printError('"sessionManager.deleteSession" does not delete the "session" property attached on the Express Request'));
				}
				else {
					result.score += 0.5;
					printOK('"sessionManager.deleteSession" deletes the "session" property of the Request)');
				}

				print('(Server) Checking if the corresponding session object was removed from "sessions"');
				let sessionUser = await remoteFunc('callObjectByString', 'sessionManager.getUsername', cookieValue);

				if (sessionUser !== null){
					result.comments.push(printError('"sessionManager.deleteSession" does not delete the corresponding session object from "sessions"'));
				}
				else {
					result.score += 0.5;
					printOK('"sessionManager.deleteSession" deletes the session object)');
				}
			}

			print('(Server) Checking GET /logout endpoint');

			testUser = selectRandomUser();
			login = await expressFunc('signInTestUser', testUser.username);
			cookieValue = document.cookie.substring(document.cookie.indexOf('=') + 1);

			// check that GET /profile is accessible
			let userProfile = await safeFetch('/profile');

			if (!(userProfile && userProfile.username === testUser.username)){
				result.comments.push(printError("Could not get a valid response from GET /profile as a signed in user"));
			}
			else {
				let resp = await originalFetch('/logout');

				if (!(resp.status === 200 && resp.redirected && resp.url === window.location.origin + '/login')){
					result.comments.push(printError("GET /logout should redirect to /login"));
				}
				else {
					result.score += 0.25;
					printOK('GET /logout redirects to /login');

					let resp2 = await originalFetch('/profile');
					if (resp.status === 200 && !resp.redirected){
						result.comments.push(printError("GET /profile should not be accessible after signing out"));
					}
					else {
						result.score += 0.25;
						printOK('GET /logout invalidated the session');
					}
				}
			}

			await restoreCookie();

			return result;
		}
	}, {
		id: '8',
		description: 'Defense against XSS attack',
		maxScore: 3,
		run: async () => {
			let result = {
				id: 8,
				score: 0,
				comments: []
			};

			let originalCookie = document.cookie;
			let originalHash = window.location.hash;

			if (window.location.pathname === '/login' || window.location.pathname === '/login.html'){
				result.comments.push(printError('Cannot run this test in Login Page'));
			}
			else {
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
						let lobby = mainScope['lobby'];
						let chatView = mainScope['chatView'];

						let testRoom = Object.values(lobby.rooms)[0];

						print('(Client) navigating to a chat view to test XSS attacks');

						window.location.hash = '#/chat/' + testRoom.id;

						// try via addMessage
						print('(Client) Mounting XSS attack via addMessage, using an img tag');
						let testUser = selectRandomUser();
						let attack = new Promise((resolve, reject) => {
							cpen322.xssTarget = reject;
							setTimeout(() => resolve(true), 100);
						});

						attack.finally(() => {
							delete cpen322.xssTarget;
						});

						testRoom.addMessage(testUser.username, `<img src="assets/everyone-icon.png" style="display: none;" onload="cpen322.xssTarget(new Error('Invoked code via XSS'))">`);

						try {
							await attack;
							printOK('Attack failed - app is resilient to XSS attack 1A (via addMessage)');
							result.score += 0.25;
						}
						catch (err){
							result.comments.push(printError('Attacked successfully - app is still vulnerable to XSS attack 1A (via addMessage)'));
						}

						// try via onclick
						print('(Client) Mounting XSS attack via addMessage, using a button tag');
						testUser = selectRandomUser();
						attack = new Promise((resolve, reject) => {
							cpen322.xssTarget = reject;
							setTimeout(() => resolve(true), 100);
						});

						attack.finally(() => {
							delete cpen322.xssTarget;
						});

						let buttonId = 'attack-' + Math.random().toString().substring(4);
						testRoom.addMessage(testUser.username, `<button id="${buttonId}" onclick="cpen322.xssTarget(new Error('Invoked code via XSS'))">Click Me</button>`);

						let button = document.querySelector('#' + buttonId);
						if (button){
							button.click();
						}

						try {
							await attack;
							printOK('Attack failed - app is resilient to XSS attack 1B (via addMessage)');
							result.score += 0.25;
						}
						catch (err){
							result.comments.push(printError('Attacked successfully - app is still vulnerable to XSS attack 1B (via addMessage)'));
						}

						// try benign payload
						print('(Client) Passing a benign payload to addMessage');
						let benignText = `alert("This is a benign payload")`;
						testUser = selectRandomUser();
						testRoom.addMessage(testUser.username, benignText);
						let messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
						let lastMessage = (messages[messages.length - 1]).querySelector('.message-text');

						if (lastMessage.textContent.indexOf(benignText) < 0){
							result.comments.push(printError('Sanitization policy seems too strong, benign text should be displayed', 'Text sent: ' + benignText));
						}
						else {
							result.score += 0.2;
							printOK('Users can still write text that looks like code');
						}

						print('(Client) Passing a benign payload to addMessage');
						benignText = `fetch("http://localhost:8080?text=" + document.cookie)`;
						testUser = selectRandomUser();
						testRoom.addMessage(testUser.username, benignText);
						messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
						lastMessage = (messages[messages.length - 1]).querySelector('.message-text');

						if (lastMessage.textContent.indexOf(benignText) < 0){
							result.comments.push(printError('Sanitization policy seems too strong, benign text should be displayed', 'Text sent: ' + benignText));
						}
						else {
							result.score += 0.2;
							printOK('Users can still write text that looks like code');
						}


						// try via onNewMessage
						print('(Client) Mounting XSS attack via onNewMessage, using an img tag');
						testUser = selectRandomUser();
						attack = new Promise((resolve, reject) => {
							cpen322.xssTarget = reject;
							setTimeout(() => resolve(true), 100);
						});

						attack.finally(() => {
							delete cpen322.xssTarget;
						});

						testRoom.onNewMessage({
							username: testUser.username,
							text: `<img src="assets/everyone-icon.png" style="display: none;" onload="cpen322.xssTarget(new Error('Invoked code via XSS'))">`
						});

						try {
							await attack;
							printOK('Attack failed - app is resilient to XSS attack 2A (via onNewMessage)');
							result.score += 0.25;
						}
						catch (err){
							result.comments.push(printError('Attacked successfully - app is still vulnerable to XSS attack 2A (via onNewMessage)'));
						}

						// try via onclick
						print('(Client) Mounting XSS attack via onNewMessage, using a button tag');
						testUser = selectRandomUser();
						attack = new Promise((resolve, reject) => {
							cpen322.xssTarget = reject;
							setTimeout(() => resolve(true), 100);
						});

						attack.finally(() => {
							delete cpen322.xssTarget;
						});

						buttonId = 'attack-' + Math.random().toString().substring(4);
						testRoom.onNewMessage({
							username: testUser.username,
							text: `<button id="${buttonId}" onclick="cpen322.xssTarget(new Error('Invoked code via XSS'))">Click Me</button>`
						});

						button = document.querySelector('#' + buttonId);
						if (button){
							button.click();
						}

						try {
							await attack;
							printOK('Attack failed - app is resilient to XSS attack 2B (via onNewMessage)');
							result.score += 0.25;
						}
						catch (err){
							result.comments.push(printError('Attacked successfully - app is still vulnerable to XSS attack 2B (via onNewMessage)'));
						}

						// try benign payload
						print('(Client) Passing a benign payload to onNewMessage');
						benignText = `alert("This is a benign payload")`;
						testUser = selectRandomUser();
						testRoom.onNewMessage({
							username: testUser.username,
							text: benignText
						});
						messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
						lastMessage = (messages[messages.length - 1]).querySelector('.message-text');

						if (lastMessage.textContent.indexOf(benignText) < 0){
							result.comments.push(printError('Sanitization policy seems too strong, benign text should be displayed', 'Text sent: ' + benignText));
						}
						else {
							result.score += 0.2;
							printOK('Users can still write text that looks like code');
						}

						// try benign payload
						print('(Client) Passing a benign payload to onNewMessage');
						benignText = `fetch("http://localhost:8080?text=" + document.cookie)`;
						testUser = selectRandomUser();
						testRoom.onNewMessage({
							username: testUser.username,
							text: benignText
						});
						messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
						lastMessage = (messages[messages.length - 1]).querySelector('.message-text');

						if (lastMessage.textContent.indexOf(benignText) < 0){
							result.comments.push(printError('Sanitization policy seems too strong, benign text should be displayed', 'Text sent: ' + benignText));
						}
						else {
							result.score += 0.2;
							printOK('Users can still write text that looks like code');
						}

						// try via websocket
						print('(Client) Mounting XSS attack via broker, using an img tag');
						testUser = selectRandomUser();

						let ws = new WebSocket(__tester.defaults.webSocketServer);
						let fakeDOM = document.createElement('div');
						let receiver = new WebSocket(__tester.defaults.webSocketServer);
						let receiveHandler = evt => {
							let msg = JSON.parse(evt.data);
							fakeDOM.appendChild(createDOM(`<div>${msg.text}</div>`));
						};
						receiver.addEventListener('message', receiveHandler);

						await delay(200);

						attack = new Promise((resolve, reject) => {
							cpen322.xssTarget = reject;
							setTimeout(() => resolve(true), 1000);
						});

						attack.finally(() => {
							delete cpen322.xssTarget;
						});

						ws.send(JSON.stringify({
							roomId: testRoom.id,
							text: `<img src="assets/everyone-icon.png" style="display: none;" onload="cpen322.xssTarget(new Error('Invoked code via XSS'))">`
						}));

						try {
							await attack;
							printOK('Attack failed - app is resilient to XSS attack 3A (via broker)');
							result.score += 0.25;
						}
						catch (err){
							result.comments.push(printError('Attacked successfully - app is still vulnerable to XSS attack 3A (via broker)'));
						}

						// try via onclick
						print('(Client) Mounting XSS attack via broker, using a button tag');
						attack = new Promise((resolve, reject) => {
							cpen322.xssTarget = reject;
							setTimeout(() => resolve(true), 1500);
						});

						attack.finally(() => {
							delete cpen322.xssTarget;
						});

						buttonId = 'attack-' + Math.random().toString().substring(4);
						ws.send(JSON.stringify({
							roomId: testRoom.id,
							text: `<button id="${buttonId}" onclick="cpen322.xssTarget(new Error('Invoked code via XSS'))">Click Me</button>`
						}));

						await delay(100);

						button = document.querySelector('#' + buttonId);
						if (button){
							button.click();
						}
						else {
							button = fakeDOM.querySelector('#' + buttonId);
							if (button) button.click();
						}

						try {
							await attack;
							printOK('Attack failed - app is resilient to XSS attack 3B (via broker)');
							result.score += 0.25;
						}
						catch (err){
							result.comments.push(printError('Attacked successfully - app is still vulnerable to XSS attack 3B (via broker)'));
						}

						// try benign payload
						print('(Client) Passing a benign payload to broker');
						benignText = `alert("This is a benign payload")`;
						ws.send(JSON.stringify({
							roomId: testRoom.id,
							text: benignText
						}));

						await delay(100);

						messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
						lastMessage = (messages[messages.length - 1]).querySelector('.message-text');


						if (lastMessage.textContent.indexOf(benignText) < 0){
							result.comments.push(printError('Sanitization policy seems too strong, benign text should be displayed', 'Text sent: ' + benignText));
						}
						else {
							result.score += 0.2;
							printOK('Users can still write text that looks like code');
						}

						// try benign payload
						print('(Client) Passing a benign payload to broker');
						benignText = `fetch("http://localhost:8080?text=" + document.cookie)`;
						ws.send(JSON.stringify({
							roomId: testRoom.id,
							text: benignText
						}));

						await delay(100);

						messages = Array.from(chatView.chatElem.querySelectorAll('.message'));
						lastMessage = (messages[messages.length - 1]).querySelector('.message-text');

						if (lastMessage.textContent.indexOf(benignText) < 0){
							result.comments.push(printError('Sanitization policy seems too strong, benign text should be displayed', 'Text sent: ' + benignText));
						}
						else {
							result.score += 0.2;
							printOK('Users can still write text that looks like code');
						}

						// check database (we assume all the methods we use below are implemented in A4)
						print('(Server) Checking if malicious code gets saved in the database without sanitizing it');
						receiver.removeEventListener('message', receiveHandler);

						let deferred = null;
						receiver.addEventListener('message', evt => deferred && deferred.resolve(JSON.parse(evt.data)));

						let maliciousCode =`<img src="assets/everyone-icon.png" style="display: none;" onload="cpen322.xssTarget(new Error('Invoked code via XSS'))">`;
						let blockSize = await remoteFunc('getGlobalObject', 'messageBlockSize');
						let roomMessages = await remoteFunc('getObjectByString', `messages['${testRoom.id}']`);
						let testMessages = Array.from({ length: blockSize - roomMessages.length }, _ => ({ roomId: testRoom.id, text: maliciousCode }));

						print('(Server) Sending ' + testMessages.length + ' test messages, until it fills up a conversation block');
						await forEachAsync.call(testMessages, async (m, i) => {
							deferred = defer();
							ws.send(JSON.stringify(m));
							let received = await deferred.promise;
						}, null, 25);

						print('(Server) reading the last conversation');
						let conv = await remoteFunc('callObjectByString', 'db.getLastConversation', testRoom.id);
						let savedMessages = conv.messages.slice(roomMessages.length);

						if (savedMessages.length < 1){
							result.comments.push(printError('No messages were saved in the last conversation'));
						}
						else {
							let msg = selectRandom(savedMessages);
							let fakeDOM = document.createElement('div');
							let attack = new Promise((resolve, reject) => {
								cpen322.xssTarget = reject;
								setTimeout(() => resolve(true), 1000);
							});

							attack.finally(() => {
								delete cpen322.xssTarget;
							});

							try {
								fakeDOM.appendChild(createDOM(`<div>${msg.text}</div>`));
								await attack;
								printOK('Attack failed - app seems to sanitize user input before saving to database');
								result.score += 0.3;
							}
							catch (err){
								result.comments.push(printError('Attacked successfully - app does not sanitize user input before saving to database'));
							}
						}
					}
				}
				
				document.cookie = document.cookie + '; expires=' + (new Date()).toUTCString();
				await delay(50);
			}

			document.cookie = originalCookie;

			if (window.location.hash !== originalHash) window.location.hash = originalHash;

			result.score = Math.round(100 * result.score) / 100;

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
