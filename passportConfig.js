const LocalStrategy = require('passport-local').Strategy;
const pool = require('./dbconfig');
const bcrypt = require('bcrypt');


module.exports = function (passport) {
    passport.use(
      new LocalStrategy((username, password, done) => {
        pool.query('SELECT * FROM public.users WHERE username = $1', [username], (err, results) => {
                if (err)
                    throw err;
                if (!results.rows.length)
                    return done(null, false);
                bcrypt.compare(password, results.rows[0].password, (err, result) => {
                    if (err)
                        throw err;
                    if (result === true) {
                        return done(null, results.rows[0]);
                    } else {
                        return done(null, false);
                    }
                });
            });
      })
    );
  
    passport.serializeUser((user, cb) => {
      cb(null, user.id);
    });
    passport.deserializeUser((id, cb) => {
        pool.query(
            'SELECT * FROM public.user WHERE id= $1', [id], (err, user) => {
            const userInformation = {
            username: user.username,
        };
        cb(err, userInformation);
      });
    });
  };