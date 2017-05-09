const router = require('express').Router();
const passport = require('passport');

module.exports = (User) => {

  router.get('/', (req, res) => {
    res.render('index', { user : req.user});
  });

  router.post('/register', (req, res) => {
    User.register(new User({ username : req.body.username }), req.body.password, (err, user) => {
      if (err) {
        res.render('register', { user: user });
      }
      passport.authenticate('local')(req, res, ()=> {
        res.redirect('/');
      });
    });
  });

  router.get('/login', (req, res) => {
    res.render('login', { user : req.user });
  });

  router.post('/login', passport.authenticate('local'), (req, res) => {
    res.redirect('/');
  });

  router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });


  router.get('/users', isLoggedIn ,(req,res) => {
    User.find({}, (err, user) => {
      if(err) res.send(err);
      res.json(user);
    });
  });


  router.get('/users/:id', isLoggedIn , (req,res) => {
    User.findById(req.params.id, (err, user) => {
      if (err) res.send(err);
      res.json(account);
    });
  });

  return router;
};

const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}