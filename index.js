require("dotenv").config();
const express = require('express')
const cors = require('cors')
const pool = require('./dbconfig')
const userRouter = require('./Routes/userRouter')
const passport = require('passport')
const passportLocal = require('passport-local').Strategy;
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const session = require('express-session')
const initializePassport = require('./passportConfig')(passport)
const io = require('socket.io')(8900, {
  cors: {
    origin: "http://localhost:3000"
  },
});


const app = express();

//MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors({
    origin: "http://localhost:3000",
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

// app.use('/user', userRouter)




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
    const getAllUsers = await pool.query('SELECT id, username, first_name, last_name FROM public.users WHERE username != $1', [userName]).then(results => results.rows)
    res.status(200).json(getAllUsers)
  })
  
  //SEARCH
  app.post('/search/add', async (req, res) => {
    const {user_id, friend_id} = req.body;
    const addContact = await pool.query('INSERT INTO public.relationships (user_id, friend_id) VALUES ($1, $2) RETURNING *', [user_id, friend_id]).then(res => res.rows[0])
    res.status(200).json("Contact added")
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
  
  //CHAT CONTACTS
  app.get('/chat/:id/contacts', async (req, res) => {
    const {id} = req.params;
    const contacts = await pool.query('SELECT username, first_name, last_name FROM public.users LEFT JOIN public.relationships ON public.users.id = public.relationships.friend_id WHERE public.relationships.user_id = $1', [id]).then(results => results.rows)
    res.status(200).json(contacts);
  })

  //new conversation
  app.post('/chat', async (req, res) => {
    const {sender_id, reciever_id} = req.body
    const data = await pool.query(`INSERT INTO public.conversations (members) VALUES (ARRAY[${sender_id}, ${reciever_id}]) RETURNING *`).then(result => result.rows[0])
    res.status(200).json(data);
  })

  //get conversations
  app.get('/chat/:userid', async (req, res) => {
    const userID = req.params.userid
    const conversations = await pool.query('SELECT * FROM public.conversations WHERE $1 = ANY (public.conversations.members)',[userID]).then(result => result.rows)
    res.status(200).json(conversations)
  })

  //add messages
  app.post('/messages', async (req, res) => {
    const {conversation_id, message, sender_id} = req.body
    const savedMessage = await pool.query('INSERT INTO public.messages (conversation_id, message, sender_id) VALUES ($1, $2, $3) RETURNING *', [conversation_id, message, sender_id]).then(result => result.rows[0])
    res.status(200).json(savedMessage)
  })


  //get messages
  app.get('/messages/:conversationID', async (req, res) => {
    const {conversationID} = req.params
    const allMessages = await pool.query('SELECT * FROM public.messages WHERE conversation_id = $1', [conversationID]).then(result => result.rows)
    res.status(200).json(allMessages);
  })

  //get user
  app.get('/users', async (req, res) => {
    const userId = req.query.userId
    const user = await pool.query('SELECT * FROM public.users WHERE id = $1', [userId]).then(result => result.rows[0]);
    res.status(200).json(user);
  })




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


//SOCKET IO CONNECTION
let users = [];

function addUser (userId, socketId) {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
}

function removeUser (socketId) {
  users = users.filter(user => user.socketId !== socketId)
}

function getUser (userId) {
  return users.find(user => user.userId === userId)
}

io.on("connection", (socket) => {
  console.log("User connected")
  //take userId and socketid from user
  socket.on("addUser", userId => {
    addUser(userId, socket.id)
    io.emit("getUsers", users)
  });

  //send and get message
  socket.on("sendMessage", ({senderId, recieverId, message}) => {
    const user = getUser(recieverId);
    io.to(user.socketId).emit("getMessage", {
      senderId,
      message
    });
  });


  //disconnect user
  socket.on("disconnect", () => {
    console.log("user disconnected")
    removeUser(socket.id)
    io.emit("getUsers", users)
  })
})

//SERVER
app.listen(process.env.PORT, () => {
    console.log("Server running on ", process.env.PORT)
})