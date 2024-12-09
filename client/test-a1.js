window.addEventListener('load', () => {
	const a = 'a1';
	/* tests */
	const tests = [{
		id: '1',
		description: 'Base layout',
		maxScore: 6,
		run: async () => {

			let result = {
				id: 1,
				score: 0,
				comments: []
			};

			// find app-view
			let appView = document.querySelector('div#app-view');
			if (!appView){
				result.comments.push(printError('Could not find div#app-view'));
			}
			else {
				result.score += 1;
				printOK('Found div#app-view');

				let appMenu = appView.querySelector('ul#app-menu');
				if (!appMenu){
					result.comments.push(printError('Could not find ul#app-menu'));
				}
				else {
					result.score += 1;
					printOK('Found ul#app-menu');

					let items = appMenu.querySelectorAll('li.menu-item');

					if (items.length !== 2){
						result.comments.push(printError('Could not find 2 li.menu-item elements'));
					}
					else {
						result.score += 1;
						printOK('Found 2 li.menu-item elements');
					}

					let roomsLink = appMenu.querySelector('li a[href="/"]');
					if (!roomsLink){
						result.comments.push(printError('Could not find link to /'));
					}
					else {
						result.score += 1;
						printOK('Found the link to "/"');
					}

					let profileLink = appMenu.querySelector('li a[href="/profile"]');

					if (!profileLink){
						result.comments.push(printError('Could not find link to /profile'));
					}
					else {
						result.score += 1;
						printOK('Found the link to "/profile"');
					}
				}

				let pageView = appView.querySelector('div#page-view');
				if (!pageView){
					result.comments.push(printError('Could not find div#page-view'));
				}
				else {
					result.score += 1;
					printOK('Found div#page-view');
				}
			}

			return result;

		}
	},{
		id: '2',
		description: 'index.html layout',
		maxScore: 6,
		run: async () => {
			let result = {
				id: 2,
				score: 0,
				comments: []
			};

			if (window.location.pathname !== '/' && window.location.pathname !== '/index.html'){
				result.comments.push(print('Test only applicable in index.html page'));
				return result;
			}

			// find app-view
			let appView = document.querySelector('div#app-view');
			if (!appView){
				result.comments.push(printError('Could not find div#app-view'));
			}
			else {
				let pageView = appView.querySelector('div#page-view');
				if (!pageView){
					result.comments.push(printError('Could not find div#page-view'));
				}
				else {
					let pageContent = pageView.querySelector('div.content');
					if (!pageContent){
						result.comments.push(printError('Could not find div.content'));
					}
					else {
						result.score += 1;
						printOK('Found div.content');

						let roomList = pageContent.querySelector('ul.room-list');
						if (!roomList){
							result.comments.push(printError('Could not find ul.room-list'));
						}
						else {
							result.score += 1;
							printOK('Found ul.room-list');

							let chatLink = roomList.querySelector('li a[href="/chat"]');
							if (!chatLink){
								result.comments.push(printError('Could not find link to /chat'));
							}
							else {
								result.score += 1;
								printOK('Found the link to "/chat"');
							}
						}

						let pageControl = pageContent.querySelector('div.page-control');
						if (!pageControl){
							result.comments.push(printError('Could not find div.page-control'));
						}
						else {
							result.score += 1;
							printOK('Found div.page-control');

							let roomInput = pageControl.querySelector('input[type=text]');
							if (!roomInput){
								result.comments.push(printError('Could not find text input in div.page-control'));
							}
							else {
								result.score += 1;
								printOK('Found a text input in div.page-control');
							}

							let roomBtn = pageControl.querySelector('button') || pageControl.querySelector('input[type=button]');
							if (!roomBtn){
								result.comments.push(printError('Could not find button in div.page-control'));
							}
							else {
								result.score += 1;
								printOK('Found a button in div.page-control');
							}
						}
					}
				}
			}

			return result;
		}
	},{
		id: '3',
		description: 'chat.html layout',
		maxScore: 10,
		run: async () => {
			let result = {
				id: 3,
				score: 0,
				comments: []
			};

			if (window.location.pathname !== '/chat.html' && window.location.pathname !== '/chat'){
				result.comments.push(print('Test only applicable in chat.html page'));
				return result;
			}

			// find app-view
			let appView = document.querySelector('div#app-view');
			if (!appView){
				result.comments.push(printError('Could not find div#app-view'));
			}
			else {
				let pageView = appView.querySelector('div#page-view');
				if (!pageView){
					result.comments.push(printError('Could not find div#page-view'));
				}
				else {
					let pageContent = pageView.querySelector('div.content');
					if (!pageContent){
						result.comments.push(printError('Could not find div.content'));
					}
					else {
						result.score += 1;
						printOK('Found div.content');

						let roomName = pageContent.querySelector('h4.room-name');
						if (!roomName){
							results.comments.push(printError('Could not find h4.room-name'));
						}
						else {
							result.score += 1;
							printOK('Found h4.room-name');
						}

						let messageList = pageContent.querySelector('div.message-list');
						if (!messageList){
							result.comments.push(printError('Could not find div.message-list'));
						}
						else {
							result.score += 1;
							printOK('Found div.message-list');

							let otherMessage = messageList.querySelector('.message:not(.my-message)');
							if (!otherMessage){
								result.comments.push(printError('Could not find at least 1 div.message that is not div.my-message'));
							}
							else {
								result.score += 1;
								printOK('Found a div.message that is not div.my-message');

								let otherUsername = otherMessage.querySelector('span.message-user');
								if (!otherUsername){
									result.comments.push(printError('Could not find span.message-user inside div.message'));
								}
								else {
									result.score += 0.5;
									printOK('Found span.message-user inside div.message');
								}

								let otherText = otherMessage.querySelector('span.message-text');
								if (!otherText){
									result.comments.push(printError('Could not find span.message-text inside div.message'));
								}
								else {
									result.score += 0.5;
									printOK('Found span.message-text inside div.message');
								}
							}

							let myMessage = messageList.querySelector('.my-message');
							if (!myMessage){
								result.comments.push(printError('Could not find at least 1 div.my-message'));
							}
							else {
								result.score += 1;
								printOK('Found a div.my-message');

								let myUsername = myMessage.querySelector('span.message-user');
								if (!myUsername){
									result.comments.push(printError('Could not find span.message-user inside div.my-message'));
								}
								else {
									result.score += 0.5;
									printOK('Found span.message-user inside div.my-message');
								}

								let myText = myMessage.querySelector('span.message-text');
								if (!myText){
									result.comments.push(printError('Could not find span.message-text inside div.my-message'));
								}
								else {
									result.score += 0.5;
									printOK('Found span.message-text inside div.my-message');
								}
							}

						}

						let pageControl = pageContent.querySelector('div.page-control');
						if (!pageControl){
							result.comments.push(printError('Could not find div.page-control'));
						}
						else {
							result.score += 1;
							printOK('Found div.page-control');

							let chatInput = pageControl.querySelector('textarea');
							if (!chatInput){
								result.comments.push(printError('Could not find textarea in div.page-control'));
							}
							else {
								printOK('Found a textarea in div.page-control');
								result.score += 1;
							}

							let sendBtn = pageControl.querySelector('button') || pageControl.querySelector('input[type=button]');
							if (!sendBtn){
								result.comments.push(printError('Could not find button in div.page-control'));
							}
							else {
								result.score += 1;
								printOK('Found a button in div.page-control');
							}
						}
					}
				}
			}

			return result;
		}
	},{
		id: '4',
		description: 'profile.html layout',
		maxScore: 6,
		run: async () => {
			let result = {
				id: 4,
				score: 0,
				comments: []
			};

			if (window.location.pathname !== '/profile.html' && window.location.pathname !== '/profile'){
				result.comments.push(print('Test only applicable in profile.html page'));
				return result;
			}

			// find app-view
			let appView = document.querySelector('div#app-view');
			if (!appView){
				result.comments.push(printError('Could not find div#app-view'));
			}
			else {
				let pageView = appView.querySelector('div#page-view');
				if (!pageView){
					result.comments.push(printError('Could not find div#page-view'));
				}
				else {
					let pageContent = pageView.querySelector('div.content');
					if (!pageContent){
						result.comments.push(printError('Could not find div.content'));
					}
					else {
						result.score += 1;
						printOK('Found div.content');

						let form = pageContent.querySelector('div.profile-form');
						if (!form){
							result.comments.push(printError('Could not find div.profile-form'));
						}
						else {
							result.score += 1;
							printOK('Found div.profile-form');

							let fields = pageContent.querySelectorAll('div.form-field');
							if (fields.length < 1){
								result.comments.push(printError('Could not find at least 1 div.form-field inside div.profile-form'));
							}
							else {
								result.score += 1;
								printOK('Found a div.form-field inside div.profile-form');

								let fieldLabel = fields[0].querySelector('label');
								if (!fieldLabel){
									result.comments.push(printError('Could not find label inside div.form-field'));
								}
								else {
									result.score += 0.5;
									printOK('Found label inside div.form-field');
								}

								let fieldInput = fields[0].querySelector('input');
								if (!fieldInput){
									result.comments.push(printError('Could not find input inside div.form-field'));
								}
								else {
									result.score += 0.5;
									printOK('Found input inside div.form-field');
								}
							}

						}

						let pageControl = pageContent.querySelector('div.page-control');
						if (!pageControl){
							result.comments.push(printError('Could not find div.page-control'));
						}
						else {
							result.score += 1;
							printOK('Found div.page-control');

							let saveBtn = pageControl.querySelector('button') || pageControl.querySelector('input[type=button]');
							if (!saveBtn){
								result.comments.push(printError('Could not find button in div.page-control'));
							}
							else {
								result.score += 1;
								printOK('Found a button in div.page-control');
							}
						}
					}
				}
			}

			return result;
		}
	},{
		id: '5.1',
		description: 'CSS media query',
		maxScore: 4,
		run: async () => {
			let result = {
				id: 5.1,
				score: 0,
				comments: []
			};

			// check if style.css link tag exists
			let cssTag = document.querySelector('link[href="style.css"],link[href="/style.css"],link[href="./style.css"]');
			if (!cssTag){
				cssTag = document.querySelector('link[href="http://localhost:3000/style.css"],link[href="https://localhost:3000/style.css"],link[href="//localhost:3000/style.css"]');
				if (cssTag){
					result.comments.push(printError('style.css is included using absolute URL'));
				}
			}
			else {
				result.score += 1;
				printOK('style.css was included using a relative path');
			}

			// find app-view
			let appView = document.querySelector('div#app-view');
			if (!appView){
				result.comments.push(printError('Could not find div#app-view'));
			}
			else {

				// test width >= 1024
				let originalWidth = document.body.clientWidth;
				let rect, widthPercent;
				if (document.body.clientWidth < 1024) {
					await new Promise((resolve, reject) => {
						alert('Test 5.1: resize the window until width >= 1024');
						let handler = evt => {
							if (document.body.clientWidth >= 1024){
								window.removeEventListener('resize', handler);
								resolve(null);
							}
						};
						window.addEventListener('resize', handler);

						setTimeout(() => {
							window.removeEventListener('resize', handler);
							reject(new Error('Did not observe change in body width (current body width = ' + document.body.clientWidth + ')'));
						}, 10000);
					});
					await delay(50);
				}

				rect = appView.getBoundingClientRect();
				widthPercent = Math.round(100 * rect.width / document.body.clientWidth);

				if (widthPercent === 80){
					result.score += 1;
					printOK('width of div#app-view is 80% of document body when body width is greater than or equal to 1024');
				}
				else {
					result.comments.push(printError('width of div#app-view is not 80% of document body when body width is greater than or equal to 1024'));
				}

				// test width >= 768
				await new Promise((resolve, reject) => {
					alert('Test 5.1: resize the window until 768 <= width < 1024');
					let handler = evt => {
						if (document.body.clientWidth < 1024 && document.body.clientWidth >= 768){
							window.removeEventListener('resize', handler);
							resolve(null);
						}
					};
					window.addEventListener('resize', handler);
				});
				await delay(50);

				rect = appView.getBoundingClientRect();
				widthPercent = Math.round(100 * rect.width / document.body.clientWidth);

				if (widthPercent === 90){
					result.score += 1;
					printOK('width of div#app-view is 90% of document body when body width is greater than or equal to 768 and less than 1024');
				}
				else {
					result.comments.push(printError('width of div#app-view is not 90% of document body when body width is greater than or equal to 768 and less than 1024'));
				}

				// test width < 768
				await new Promise((resolve, reject) => {
					alert('Test 5.1: resize the window until width < 768');
					let handler = evt => {
						if (document.body.clientWidth < 768){
							window.removeEventListener('resize', handler);
							resolve(null);
						}
					};
					window.addEventListener('resize', handler);
				});
				await delay(50);

				rect = appView.getBoundingClientRect();
				widthPercent = Math.round(100 * rect.width / document.body.clientWidth);

				if (widthPercent === 100){
					result.score += 1;
					printOK('width of div#app-view is 100% of document body when body width is less than 768');
				}
				else {
					result.comments.push(printError('width of div#app-view is not 100% of document body when body width is less than 768'));
				}

			}

			return result;
		}
	},{
		id: '5.2',
		description: 'Chat boxes styling',
		maxScore: 2,
		run: async () => {
			let result = {
				id: 5.2,
				score: 0,
				comments: []
			};

			if (window.location.pathname !== '/chat.html' && window.location.pathname !== '/chat'){
				result.comments.push(print('Test only applicable in chat.html page'));
				return result;
			}

			let myMessage = document.querySelector('.message-list > .my-message');

			let otherMessage = document.querySelector('.message-list > .message:not(.my-message)');

			if (myMessage && otherMessage){
				let myRect = myMessage.getBoundingClientRect();
				let otherRect = otherMessage.getBoundingClientRect();

				if (myRect.left > otherRect.left && myRect.right > otherRect.right){
					result.score += 1;
					printOK("My message box appears to be on the right side of friend's message box");
				}
				else {
					// secondary check
					myRect = myMessage.querySelector('.message-text').getBoundingClientRect();
					otherRect = otherMessage.querySelector('.message-text').getBoundingClientRect();

					if (myRect.left > otherRect.left && myRect.right > otherRect.right){
						result.score += 1;
						printOK("My message box appears to be on the right side of friend's message box");
					}
					else {
						result.comments.push(printError("My message box should be toward the right of friend's message box"));
					}
				}

				let myColor = window.getComputedStyle(myMessage).backgroundColor;
				let otherColor = window.getComputedStyle(otherMessage).backgroundColor;

				if (myColor === otherColor){
					// secondary check
					myColor = window.getComputedStyle(myMessage.querySelector('.message-text')).backgroundColor;
					otherColor = window.getComputedStyle(otherMessage.querySelector('.message-text')).backgroundColor;

					if (myColor === otherColor){
						result.comments.push(printError("My message box and friend's message box should have different background colors"));
					}
					else {
						result.score += 1;
						printOK("My message box and friend's message box have different background colors");
					}
				}
				else {
					result.score += 1;
					printOK("My message box and friend's message box have different background colors");
				}
			}
			else {
				result.comments.push(printError('Could not find message boxes with classes .my-message and .message'));
			}

			return result;
		}
	},{
		id: '6',
		description: 'CSS interactivity',
		maxScore: 1,
		run: async () => {
			let result = {
				id: 6,
				score: 0,
				comments: []
			};

			let screenDevice;
			try {
			    screenDevice = await navigator.mediaDevices.getDisplayMedia({
			    	video: {
			    		cursor: { exact: 'none' }
			    	},
			    	audio: false,
			    	preferCurrentTab: true
			    });
			} catch(err) {
				console.log(err);
			    result.comments.push(print('Could not test due to insufficient permissions'));
			    return result;
			}
			
			let appMenu = document.querySelector('ul#app-menu');
			if (!appMenu){
				result.comments.push(printError('Could not find ul#app-menu'));
			}
			else {
				let menuLink = appMenu.querySelector('li.menu-item');
				if (!menuLink){
					result.comments.push(printError('Could not find li.menu-item'));
				}
				else {
					await captureElemScreenshot(menuLink, screenDevice, result);	
				}
			}

			let roomList = document.querySelector('ul.room-list');
			if (!roomList){
				result.comments.push(printError('Could not find ul.room-list'));
			}
			else {
				let chatLink = roomList.querySelector('li');
				if (!chatLink){
					result.comments.push(printError('Could not find ul.room-list li'));
				}
				else {
					await captureElemScreenshot(chatLink, screenDevice, result);
				}
			}

			let tracks = screenDevice.getTracks();
			tracks.forEach(track => track.stop());

			return result;
		}
	}];

	/* a1 test helper */
	const captureElemScreenshot = async (elemToCapture, videoStream, result) => {
		let elemRect = elemToCapture.getBoundingClientRect();

		let virtualWidth = document.body.clientWidth, virtualHeight = document.body.clientHeight;
		let imageRatio = [ virtualWidth / document.body.clientWidth, virtualHeight / document.body.clientHeight ];

		let confirmBox = document.createElement('div');
		confirmBox.style.position = 'fixed';
		confirmBox.style.left = (document.body.clientWidth / 2 - elemRect.width / 2) + 'px';
		confirmBox.style.top = (document.body.clientHeight / 2 - elemRect.height / 2) + 'px';
		confirmBox.style.width = elemRect.width + 'px';
		// confirmBox.style.height = (elemRect.height * 2) + 'px';
		confirmBox.style.padding = '20px';
		confirmBox.style.backgroundColor = 'white';
		confirmBox.style.boxShadow = '0px 0px 5px 5px rgba(0,0,0,0.5)';
		confirmBox.style.cursor = 'pointer';
		let confirmation = new Promise((resolve, reject) => {
			let closeBox = (evt) => {
				confirmBox.removeEventListener('click', closeBox);
				document.body.removeChild(confirmBox);
				resolve();
			};
			confirmBox.addEventListener('click', closeBox);
		});

		let desc = document.createElement('h4');
		desc.textContent = 'What the Tester sees';
		desc.style.margin = '0';
		confirmBox.appendChild(desc);

		let videoElem = document.createElement('video');
		videoElem.autoplay = true;
		videoElem.width = document.body.clientWidth;
		videoElem.height = document.body.clientHeight;
		videoElem.srcObject = videoStream;

		let canvasA = document.createElement('canvas');
		canvasA.width = elemRect.width;
		canvasA.height = elemRect.height;
		let ctxA = canvasA.getContext('2d');
		confirmBox.appendChild(canvasA);

		let canvasB = document.createElement('canvas');
		canvasB.width = elemRect.width;
		canvasB.height = elemRect.height;
		let ctxB = canvasB.getContext('2d');
		confirmBox.appendChild(canvasB);

		// alert('Wait for 3 seconds until the browser prepares the media stream');

		await delay(1000);

		// ctxA.drawImage(videoElem, menuRect.x, menuRect.y, menuRect.width, menuRect.height, 0, 0, canvasA.width, canvasA.height);

		// wait for user to move mouse to the menu item
		alert('Move your mouse to the red box, and hold the cursor over the pixel you want the tester to examine');
		await (new Promise((resolve, reject) => {
			let originalBorder =  elemToCapture.style.border;
			let blink = setInterval(() => {
				elemToCapture.style.border = elemToCapture.style.border === '3px dashed red' ? originalBorder : '3px dashed red';
			}, 500);

			let pixelPos = {};

			let mouseHandler = async (evt) => {
				pixelPos.x = evt.clientX - elemRect.x;
				pixelPos.y = evt.clientY - elemRect.y;
			};

			let handler = async (evt) => {
				// although it makes sense to capture the first frame before mouseenter,
				// due to asynchronous processing the result is more consistent when we capture here.
				ctxA.drawImage(videoElem, elemRect.x, elemRect.y, elemRect.width, elemRect.height, 0, 0, canvasA.width, canvasA.height);

				clearInterval(blink);
				elemToCapture.style.border = originalBorder;
				elemToCapture.removeEventListener('mouseenter', handler);

				elemToCapture.addEventListener('mousemove', mouseHandler);

				await delay(500);

				elemToCapture.removeEventListener('mousemove', mouseHandler);

				ctxB.drawImage(videoElem, elemRect.x, elemRect.y, elemRect.width, elemRect.height, 0, 0, canvasB.width, canvasB.height);

				let originalPixel = ctxA.getImageData(pixelPos.x, pixelPos.y, 1, 1);

				let hoverPixel = ctxB.getImageData(pixelPos.x, pixelPos.y, 1, 1);

				if (originalPixel.data[0] !== hoverPixel.data[0]
					|| originalPixel.data[1] !== hoverPixel.data[1]
					|| originalPixel.data[2] !== hoverPixel.data[2]
					|| originalPixel.data[3] !== hoverPixel.data[3]){
					result.score += 0.5;
					printOK('Observed color change upon mouse hover');
				}
				else {
					result.comments.push(printError('Could not observe change in color on mouse hover'));
				}

				resolve(null);
			};
			elemToCapture.addEventListener('mouseenter', handler);

		}));

		videoElem.srcObject = null;

		document.body.appendChild(confirmBox);

		return confirmation;
	};

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
		// Array.prototype.forEachAsync = forEachAsync;

		await forEachAsync.call(tests, async (test) => {
			let input = ui[test.id].checkBox;
			let cell = ui[test.id].resultCell;
			if (input.checked){
				// console.log('running test ' + test.id);

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

					// console.log(err.message);
					console.log(err);
				}

				// just print a blank line for readability
				if (store.options.showLogs) console.log('');
			}
			else {
				// console.log('skipping test ' + test.id);
				store.results[test.id] = {
					skipped: true,
					score: 0,
					comments: []
				};
			}

			cell.textContent = (store.results[test.id].skipped ? 'Skipped' : (Math.round(100 * store.results[test.id].score) / 100) + '/' + test.maxScore);
		});

		// Array.prototype.forEachAsync = undefined;

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

	// runButton.click();
})