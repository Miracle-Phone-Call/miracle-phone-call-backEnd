require("dotenv").config();

////////////////////////////////////////////////////////////////////////////////
//Code added for WebSocket chat (FrontEnd)//
//Code for Chat App UI
const express = require('express')
//This variable will require the express dependency
const app = express();
//Instance of express function
const http = require("http");
//Variable for HTTP Library of Express to build server on Socket.
const cors = require("cors");
//Requires the Cors library (Socket.IO deals with alot of CORS Issues)
const server = http.createServer(app) 
//Server will use the HTTP Library and CreateServer function.
const { Server }= require("socket.io")
//Requirement of the Socket.IO Library
//Express app will generate server for us

//CORS Middleware Referenced Below:
//app.use(cors()); //App will use CORS Middleware

//new Instance of server class from Socket Io
const io = new Server(server, {
  //resolves CORS Issues
  cors: {
      origin: "http://localhost:3000", //Localhost server for react Socket.io - 
      //it is okay to accept socket communication with this URL
      methods: ["GET", "POST"], //Specified methods that are allowed
  },
  }
  )

//Listens for the port 3001
server.listen(3002, () => {
  console.log('SERVER RUNNING')
  //When server runs, it will console.log the message "Server Running"
  }
  )



//Socket IO Events


//Listening for events in our Socket.IO Server

//User Connections
io.on("connection", (socket) => {

console.log('User Connected', socket.id);

//User Disconnect
socket.on("disconnect", () => {
    console.log('User Disconnected', socket.id)
})

}) //Listening for an event with this ID

/////////////////////////////////////////////////////////////////////////////
const pool = require('./dbconfig')
const userRouter = require('./Routes/userRouter')
const passport = require('passport')
const passportLocal = require('passport-local').Strategy;
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const session = require('express-session')
const initializePassport = require('./passportConfig')(passport)
const bodyParser = require('body-parser')




//MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors({
    origin: "http://localhost:3000", //Original Code
    credentials: true
}));
app.use(session({
    secret: 'secretcode',
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser('secretcode'))

app.use('/user', userRouter)


//Chat
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)


//ROUTES
app.get('/', (req, res) => {
    res.status(200).json("Hello")
})

app.post('/signup', async (req, res) => {
    const {username, firstName, lastName,  password, repassword} = req.body
    pool.query('SELECT * FROM public.users WHERE username = $1', [username], async (err, results) => {
        if (err) throw err;
        if (results.rows.length) res.send("User Already Exists");
        if (!results.rows.length) {
            const hashedPassword = await bcrypt.hash(password, 10);
            pool.query('INSERT INTO public.users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4)', [firstName, lastName, username, hashedPassword])
            res.send("User Created");
          }
    })
})

app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) throw err;
      if (!user) res.send("No User Exists");
      else {
        req.logIn(user, (err) => {
          if (err) throw err;
          res.send(user);
        });
      }
    })(req, res, next);
  });

  //SEARCH USER ARRAY BACKEND
  app.get('/search/:username', async(req, res) => {
    const userName = req.params.username;
    const getAllUsers = await pool.query('SELECT id, username, first_name, last_name FROM public.users').then(results => results.rows)
    res.status(200).json(getAllUsers)
  })
  
  //SEARCH
  app.post('/search/add', async (req, res) => {
    const {user_id, friend_id} = req.body;
    const addContact = await pool.query('INSERT INTO public.relationships (user_id, friend_id) VALUES ($1, $2) RETURNING *', [user_id, friend_id]).then(res => res.rows[0])
    res.status(200).json("Contact added")
  })

  //CHAT CONTACTS
  app.get('/chat/:id/contacts', async (req, res) => {
    const {id} = req.params;
    const contacts = await pool.query('SELECT username, first_name, last_name FROM public.users LEFT JOIN public.relationships ON public.users.id = public.relationships.friend_id WHERE public.relationships.user_id = $1', [id]).then(results => results.rows)
    res.status(200).json(contacts);
  })

  //PROFILE BACKEND
  // update all
  app.patch("/users/:username",async(req,res) => {
      const {firstName, lastName} = req.body
    const userName = req.params.username
    const updateInfo= await pool.query('UPDATE public.users SET first_name = $1, last_name = $2 WHERE username = $3 RETURNING *', [firstName, lastName, userName]).then(results => results.rows[0])
    res.status(200).json(updateInfo)
  })
  
  //update password 
  app.patch("/users/:username/password",async(req,res) => {
    const {currentPassword, newPassword, retypeNewPassword} = req.body
    const userName = req.params.username
    const currPass = await pool.query('SELECT password FROM public.users WHERE username = $1', [userName]).then(result => result.rows[0].password)
    if (bcrypt.compare(currPass, currentPassword) && newPassword === retypeNewPassword) {
      const hashPassword = await bcrypt.hash(newPassword, 10)
      const updatePassword = await pool.query('UPDATE public.users SET password = $1 WHERE username = $2 RETURNING *', [hashPassword,userName]).then(results => results.rows[0])
      res.status(200).json(updatePassword)
    } else {
      res.json({message: "Password wrong"})
    }
  })
  
  app.delete("/users/:username", async(req, res) => {
    const userName = req.params.username
    const delteUsername = await pool.query('DELETE FROM users WHERE username = $1 RETURNING *', [userName])
    res.status(200).json(delteUsername)
  })

//POST Chat message
  app.post('/chat/:id', async(req, res) => {
    const text = req.body;
    const sender = req.params.id;
    const addMessage = await pool.query('INSERT INTO public.messages (message, sender_id) VALUES ($1, $2) RETURNING *', [text, sender]).then(res => res.rows)
    res.status(200).json(addMessage);
  });

//GET CHAT MESSAGES
  app.get('/chat', async(req, res) => {
    const getMessages = pool.query('SELECT * FROM messages ORDER BY id DESC').then(res => res.rows)
    res.status(200).json(getMessages)
  });

  
  // //FUNCTIONS FOR AUTH
  // function checkAuthenticated (req, res, next) {
//     if (req.isAuthenticated()) {
//         return res.redirect('/users/home')
//     }
//     next();
// }

// function checkNotAuthenticated (req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }

//     res.redirect('/users/login');
// }

//SERVER
app.listen(process.env.PORT, () => {
    console.log("Server running on ", process.env.PORT)
})