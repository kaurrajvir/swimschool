const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql');
const conn = require('./dbConfig');
const app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var flash = require('req-flash');

/*VIEW ENGINE SETUP*/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({secret: 'yoursecret', resave: true, saveUninitialized: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(flash());
//app.use(cookieParser());

/*ROUTE SETUP*/
app.get('/', function(req, res) {
	res.render('home.ejs',{title: 'Home'});
});
app.get('/add-student', function(req, res) {
	res.render('add-student',{title: 'AddStudent'});
});
app.get('/adults', function(req, res) {
	res.render('adults.ejs',{title: 'Adults'});
});
app.get('/header', function(req, res) {
	res.render('header.ejs');
});
app.get('/header2', function(req, res) {
	res.render('header2.ejs');
});
app.get('/login', function(req, res) {
	res.render('login.ejs',{title: 'Login'});
});
app.get('/kids', function(req, res) {
	res.render('kids.ejs',{title: 'Kids'});
});
app.get('/register', function(req, res) {
	res.render('register.ejs',{title: 'Register'});
});
app.get('/todlers', function(req, res) {
	res.render('todlers.ejs',{title: 'Todlers'});
});
app.get('/holiday-session', function(req, res) {
	res.render('holiday-session.ejs',{title: 'HolidaySessions'});
});
app.get('/private-session', function(req, res) {
	res.render('private-session.ejs',{title: 'PrivateSwimSessions'});
});

//CREATE USER
app.post('/register', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;
	let email = req.body.email;
	let firstname = req.body.firstname;
	let lastname = req.body.lastname;
	let dateofbirth = req.body.dateofbirth;
	let phone = req.body.phone;
	if (username && password && email && firstname && lastname && dateofbirth && phone ) {
		var sql = `INSERT INTO users (username, password, email, firstname, lastname, dateofbirth, phone) VALUES ("${username}", "${password}", "${email}", "${firstname}", "${lastname}", "${dateofbirth}", "${phone}")`;
		conn.query(sql, function(err, result) {
			if (err) throw err;
			console.log('record inserted');
			res.render('login');
		})
	}
	else {
		console.log("Error");
	}
});
  
//LOGIN USER
app.post('/auth', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;	
	if (username && password) {
		conn.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;							
				res.redirect('/newbooking');				
			} else {
				res.send('Incorrect Username and/or Password!');
			}			
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

/*LOGOUT*/
app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

/*CONTACTUS*/
app.post('/contactus', function(req, res, next) {
	let name = req.body.name;	
	let email = req.body.email;
	let subject = req.body.subject;
	let message = req.body.message;	
	if (name && email && subject && message) {
		var sql = `INSERT INTO contactus (name, email, subject, message) VALUES ("${name}", "${email}", "${subject}", "${message}")`;
		conn.query(sql, function(err, result) {
			if (err) throw err;
			console.log('record inserted');
			res.redirect("/")
		})
	}
	else {
		console.log("Error");
	}
});

/*CLASS LIST*/
app.get('/classes', function(req, res, next) {
	conn.query("SELECT * FROM sessions", function (err, result) {
		if (err) throw err;
		//console.log(result);
		res.render('classes',
		{ title: 'Classes', classData: result})					
	});	
});

/*NEW-BOOKINGS PAGE get session data*/
app.get('/newbooking', function(req, res) {
	if (req.session.loggedin) {			
		conn.query("SELECT * FROM sessions", function (err, result) {
			if (err) throw err;
			//console.log(result);
			res.render('newbooking', { title: 'newbooking', classData: result})					
		}); 			
	}
	else {
		res.send('Please login to view this page!');
	}
	
});

/*INSERT NEW-BOOKING DATA*/
app.post('/newbooking', function(req, res, next) {
	ssn = req.session;
	let studentName = req.body.studentName;
	let sessionId = req.body.sessionId;		
	var sql = `INSERT INTO newbookings (studentName, sessionId) VALUES ("${studentName}", "${sessionId}")`;
	conn.query(sql, function(err, result) {
		if (err) throw err;
		console.log('record inserted');	
		ssn = req.session;		
		ssn.userSession = result;				
	})
	res.redirect("/newbooking");	
});

/*MEMBERS PORTAL Users can access this if they are logged i*/
app.get('/memberportal', function (req, res, next) {	
	if (req.session.loggedin) {	
		const udata = req.session.username; 
		res.render('memberportal.ejs', { name: udata, title: 'membersportal' });				
		//console.log(udata);
		conn.query("SELECT * FROM sessions where name = " + udata, function (err, result) {
			if (err) throw err;
			console.log(result);
			res.render('memberportal',
			{ title: 'memberportal', classData: result})					
		});   	
	}
	else {
		res.send('Please login to view this page!');
	}
})

/*BOOKINGS LIST*/
app.get('/admin', function(req, res, next){		
	conn.query("SELECT * FROM sessions INNER JOIN newbookings on sessions.sessionId = newbookings.sessionId", function (err, result) {
		if (err) throw err;
		console.log(result);
		res.render('admin',
		{ title: 'admin', eData: result})					
	});     
});

/*UPDATE BOOKINGS*/
app.get('/update-bookings/(:sessionId)', function(req, res, next){
	conn.query('SELECT * FROM sessions WHERE sessionId = ' + req.params.sessionId, function(err, rows, fields) {
		if(err) throw err			
		if (rows.length <= 0) {
			req.flash('error', 'booking not found with sessionId = ' + req.params.sessionId)
			res.redirect( '/update-bookings')
		}
		else { 		
			res.render('update-bookings', {				
				sessionId: rows[0].sessionId,
				startDate: rows[0].startDate,				
				endDate: rows[0].endDate,
				day: rows[0].day,	
				timeSlot: rows[0].timeSlot,
				instructor: rows[0].instructor,
				level: rows[0].level											
			})
		}			
	})	
})

/*UPDATE BOOKINGS*/
app.post('/update-bookings/(:sessionId)', function(req, res, next) {    
    var booking = { 
        startDate: req.body.startDate,
		endDate: req.body.endDate, 
        day: req.body.day,
		timeSlot: req.body.timeSlot,
        instructor: req.body.instructor,
		level: req.body.level              
    }        
    conn.query('UPDATE sessions SET ? WHERE sessionId = ' + req.params.sessionId, booking, function(err, result) {
        if(err) throw err
        if (err) {
            //console.log("error");
            req.flash('error', err)    
            res.redirect("/admin")
            
        } else {
            req.flash('success', 'Data updated successfully!')                
            res.redirect("/admin")
        }
    });    
});
 
/*DELETE BOOKINGS*/
app.post('/delete/(:bookingId)', function(req, res, next) {
	var booking = { id: req.params.id }		
	conn.query('DELETE FROM newbookings WHERE bookingId = ' + req.params.bookingId, function(err, result) {
		//if(err) throw err
		if (err) {
			req.flash('error', err)	
console.log(result);			
			res.redirect('/admin')
		} else {
			req.flash('success', 'Country deleted successfully! id = ' + req.params.id)			
			res.redirect('/admin')
		}
	})	
})

app.listen(3000);
