const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        if (!username) {
            throw new Error("Username is required to create a session.");
        }

        // Generate a random 64-character token
        const token = crypto.randomBytes(32).toString('hex'); // 32 bytes * 2 = 64 characters

        // Store session data
        const sessionData = {
            username: username,
            createdAt: Date.now(),
            expiresAt: Date.now() + maxAge,
        };
        sessions[token] = sessionData;

        // Set cookie in the response
        response.cookie('cpen322-session', token, {
            maxAge: maxAge,
            secure: false, 
        });

        // Schedule session cleanup
        setTimeout(() => {
            delete sessions[token];
        }, maxAge);
    };


    this.deleteSession = (request) => {
        const sessionToken = request.session;
        if (sessionToken && sessions[sessionToken]) {
            delete sessions[sessionToken];
        }
        delete request.username;
        delete request.session;
    };

	this.middleware = (request, response, next) => {
		const cookies = request.headers.cookie;
        
        //Get cookies
        if (!cookies) {
            return next(new SessionError("No session token found in request."));
        }

        //Find the session token
        const token = cookies.split('; ').find(cookie => cookie.startsWith('cpen322-session='));
        if (!token) {
            return next(new SessionError("No session token found in request."));
        }

        //Extract the session token
        const sessionToken = token.split('=')[1].trim();
        if (!sessions[sessionToken]) {
            return next(new SessionError("Invalid session token."));
        }

        //Attach session data to the request object
        request.username = sessions[sessionToken].username;
        request.session = sessionToken;
        next();
	};

	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;