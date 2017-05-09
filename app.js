require('dotenv').config()
const path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//Import modelsmodels
const User = require('./models/User');

//Import Routes and send along model to routes
const routes = require('./routes/index.js');
const userRoutes = require('./routes/users.js')(User);

//Create app
const app = express();
const port = process.env.PORT;

//Logging the resources
app.use(logger('dev'));

//Security measurments
app.use(helmet());

app.set('view engine', 'pug');
app.use('/public', express.static('public'));

//Parsing routes to get 'req.body'
app.use(bodyParser.urlencoded({
  extended: false
})); 

//Parsing routes to get 'req.cookies'
app.use(cookieParser());
app.use(session({
  secret: "sshh",
  resave: true,
  saveUninitialized: false
}));

//Passport configuration
app.use(passport.initialize());
app.use(passport.session()); 
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// To hide warning message about promise
mongoose.Promise = global.Promise;
//Connect to mongoose with the env-variable
mongoose.connect(process.env.DB_HOST);
mongoose.connection.on('error', (error) =>  { 
  console.log(error)
});


//Middleware to check if 'req.user' is set
app.use((req,res,next) => {
  console.log(req.user);
  next();
});


app.use('/', routes);
app.use('/users', userRoutes);

app.listen(port, () => {
  console.log("+---------------------------------------+");
  console.log("|                                       |");
  console.log(`|  [\x1b[34mSERVER\x1b[37m] Listening on port: \x1b[36m${port} 🤖  \x1b[37m |`);
  console.log("|                                       |");
  console.log("\x1b[37m+---------------------------------------+");
});