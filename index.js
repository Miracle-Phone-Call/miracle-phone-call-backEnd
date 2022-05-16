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

app.use('/user', userRouter)




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
          res.send("Successfully Authenticated");
          console.log(req.user);
        });
      }
    })(req, res, next);
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