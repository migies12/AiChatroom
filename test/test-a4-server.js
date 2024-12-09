const assignment = 'a4';

let exported = null;

const initialize = (data) => {
	exported = data.exported;

	let server = exported.get('server.js');

	// helpers
	const tokenize = (nameString) => {
		let buffer = '', state = '';
		return Array.from(nameString)
			.reduce((tokens, char, index, list) => {

				if (state === 'm-obj'){
					if (char === '/'){
						tokens.lib += tokens.lib ? '/' + buffer : buffer;
						buffer = '';
						state = '';
					}
					else if (char === '['){
						buffer.split('.').forEach(token => tokens.props.push(token));
						buffer = '';
						state = 'comp';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'comp'){
					if (char === "'"){
						state = 'comp-s';
					}
					else if (char === '"'){
						state = 'comp-d';
					}
					else if (/\d/.test(char)){
						buffer += char;
						state = 'comp-n';
					}
					else throw new Error('Parse error - unexpected token at ' + index + ': "' + char + '"');
				}
				else if (state === 'comp-fin'){
					if (char !== ']') throw new Error('Parse error - expecting "]" at ' + index + ' but got: "' + char + '"');
					state = 'obj';
				}
				else if (state === 'comp-s'){
					if (char === "'"){
						tokens.props.push(buffer);
						buffer = '';
						state = 'comp-fin';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'comp-d'){
					if (char === '"'){
						tokens.props.push(buffer);
						buffer = '';
						state = 'comp-fin';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'comp-n'){
					if (char === ']'){
						let num = parseInt(buffer);
						if (isNaN(num)) throw new Error('Parse error - was expecting number index, but got ' + buffer);
						tokens.props.push(num);
						buffer = '';
						state = 'obj';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'obj'){
					if (char === '['){
						if (buffer) tokens.props.push(buffer);
						buffer = '';
						state = 'comp';
					}
					else if (char === '.'){
						if (buffer) tokens.props.push(buffer);
						buffer = '';
						state = 'obj';
					}
					else if (char === '/'){
						throw new Error('Parse error - was not expecting "/" at ' + index + ' while parsing an object string');
					}
					else {
						buffer += char;
					}
				}
				else {
					if (char === '/'){
						tokens.lib += tokens.lib ? '/' + buffer : buffer;
						buffer = '';
					}
					else if (char === '.'){
						state = 'm-obj';
						buffer += char;
					}
					else if (char === '['){
						buffer.split('.').forEach(token => tokens.props.push(token));
						buffer = '';
						state = 'comp';
					}
					else {
						buffer += char;
					}
				}

				if (index === list.length - 1 && buffer){
					buffer.split('.').forEach(token => tokens.props.push(token));
				}

				return tokens;
			}, { lib: '', props: [] });
	}
	const getProp = (obj, tokens) => (tokens.length > 0) ? getProp(obj[tokens[0]], tokens.slice(1)) : obj;
	const getObjectByString = (nameString) => {
		let tokens = tokenize(nameString);
		return tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props) : getProp(server, tokens.props);
	}
	const setObjectByString = (nameString, value) => {
		try {
			let tokens = tokenize(nameString);
			let obj = tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props.slice(0, -1)) : getProp(server, tokens.props.slice(0, -1));
			obj[tokens.props[tokens.props.length - 1]] = value;
			return { error: null };	
		}
		catch (err){
			return { error: err.message };
		}
		
	}
	const callObjectByString = (nameString, ...args) => {
		let tokens = tokenize(nameString);
		let obj = tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props.slice(0, -1)) : getProp(server, tokens.props.slice(0, -1));
		let func = obj[tokens.props[tokens.props.length - 1]];

		return func.call(obj, ...args);
	}
	const deleteObjectByString = (nameString) => {
		try {
			let tokens = tokenize(nameString);
			let obj = tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props.slice(0, -1)) : getProp(server, tokens.props.slice(0, -1));
			delete obj[tokens.props[tokens.props.length - 1]];
			return { error: null };	
		}
		catch (err){
			return { error: err.message };
		}
	}

	let remotes = {
		getGlobalObject: (name) => {
			if (!server[name]) throw new Error('variable "' + name + '" in server.js was not found/exported');
			return server[name];
		},
		getObjectByString: getObjectByString,
		setObjectByString: setObjectByString,
		callObjectByString: callObjectByString,
		deleteObjectByString: deleteObjectByString,
		checkRequire: (name) => {
			try {
				module.parent.require(name);
				return { error: null };
			}
			catch (err){
				return { error: err.message };
			}
		},
		checkObjectType: (name, typeString) => {
			let obj = getObjectByString(name);
			let type = getObjectByString(typeString);

			return (obj instanceof type);

			/*try {
				let obj = getObjectByString(name);
				let type = getObjectByString(typeString);

				return { value: (obj instanceof type), error: null };
			}
			catch (err){
				return { error: err.message };
			}*/
		}
	};

	// add a test endpoint
	let app = server['app'];
	app.post('/cpen322/' + assignment, (req, res) => {
		if (remotes[req.body.func]){
			try {
				let result = remotes[req.body.func](...req.body.args);

				if (result instanceof Promise){
					new Promise((resolve, reject) => {
						result.then(resolve).catch(reject);
						setTimeout(() => reject(new Error('timed out on an asynchronous action')), 5000);
					}).then(val => {
						// override toJSON before serializing
						let originalToJson = Set.prototype.toJSON;
						Set.prototype.toJSON = function (){
							return Array.from(this);
						}

						if (typeof val === 'undefined'){
							res.status(200).send();
						}
						else {
							res.status(200).send(JSON.stringify(val));
						}

						Set.prototype.toJSON = originalToJson;
					}).catch(err => {
						console.log(err);
						res.status(500).send(err.message + '\n' + err.stack);
					});
					
				}
				else {
					// override toJSON before serializing
					let originalToJson = Set.prototype.toJSON;
					Set.prototype.toJSON = function (){
						return Array.from(this);
					}

					if (typeof result === 'undefined'){
						res.status(200).send();
					}
					else {
						res.status(200).send(JSON.stringify(result));
					}

					Set.prototype.toJSON = originalToJson;
				}
			}
			catch (err){
				console.log(err);
				res.status(500).send(err.message + '\n' + err.stack);
			}
		}
		else {
			res.status(400).send('Test method ' + req.body.func + ' does not exist');
		}
	});
}

module.exports = { initialize };