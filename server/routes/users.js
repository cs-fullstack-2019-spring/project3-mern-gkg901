var express = require('express');
var router = express.Router();
var bCrypt = require('bcrypt-nodejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var userCollection = require('../models/UserSchema');

router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  userCollection.findById(id, function(err, user) {
    done(err, user);
  });
});
var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
};
var createHash = function(password){
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};


passport.deserializeUser(function (id, done) {
  userCollection.findById(id, function (err, user) {
    done(err, user);
  });
});


router.post('/login',
    passport.authenticate('local',
        {failureRedirect: '/users/loginFail'}),

    function (req, res) {
        req.session.username = req.body.username;
        res.send(req.session.username);
    });


router.get('/loginFail', (req, res) => {
    res.send(undefined);
});

router.get('/logout', (req, res) => {
    req.session = null;
    res.send('Logged Out')
});

router.post('/addPost', (req, res) => {
    userCollection.findOneAndUpdate({username: req.body.username},
        {$push: {tweet: req.body}}, (errors) => {
            if (errors) res.send(errors);
            else res.send("POST CREATED");
        });
});

router.post('/editPost', (req,res)=>{
    userCollection.findOneAndUpdate(
        {_id: req.body.tweet},
        {
            $set: {
                'tweetMessage.$': req.body.tweetMessage,
                'tweetImage.$': req.body.tweetImage,
                'tweetPublic.$': req.body.tweetPublic,
            }
        },
        (errors, results)=>{
            if(errors) res.send(errors);
            else res.send("UPDATED");
        });
});




passport.use('signUp', new LocalStrategy(
    {passReqToCallback: true},
    function (req, username, password, done) {
      findOrCreateUser = function () {
        userCollection.findOne({'username': username}, (errors, user) => {
          if (user) {
            return done(null, false, {message: 'Already Existing User'});
          } else {
            var newUser = new userCollection();

        newUser.username = username;
        newUser.password = createHash(password);
        newUser.profileImage = req.body.profileImage;
        newUser.backgroundImage = req.body.backgroundImage;

        newUser.save((errors) => {
          if (errors) {
            throw errors;
          }
          return done(null, newUser);
      });
      }
      });
      };
      process.nextTick(findOrCreateUser);
    })
);


router.post('/signUp',
    passport.authenticate('signUp',
        { successRedirect: '/users/signUpSuccess',
            failureRedirect: '/users/signUpFail'
        }
    ), (req, res) => {
        res.send(req.body.username)
    });

router.get('/signUpFail', (req, res) => {
    console.log('++++++++++++SIGNUP FAIL');
    res.send("Sign Up failed. Please try again. ");
});

router.get('/signUpSuccess', (req, res) => {
    console.log('++++++++++++SIGNUP SUCESS');
    res.send("Your account has been created. ");
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        userCollection.findOne({username: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {message: 'Username Incorrect.'});
            }
            if (!isValidPassword(user, password)) {
                return done(null, false, {message: 'Password Incorrect.'});
            }
            return done(null, user, {user: user.username});
        });
    }
));


router.get('/findPost', (req, res) => {
    userCollection.find({}, (errors, results) => {
        if (errors) res.send(errors);
        else {
            res.send(results)
        }
    })
});

router.post('/findUsers', (req, res) => {
    userCollection.findOne({username: req.body.username}, (errors, results) => {
        if (errors) res.send(errors);
        else {
            res.send(results);
            console.log(results)
        }
    })
});

router.post('/search', (req, res) => {
    userCollection.find(
        {"tweet.tweetMessage": {"$regex": req.body.searchBar, "$options": "i"}}, (errors, results) => {
            if (errors) res.send(errors);
            else {
                let allresults = [];
                let searchResults = [];
                for (let i = 0; i < results.length; i++) {
                    for (let j = 0; j < results[i].tweet.length; j++) {
                        allresults.push(
                            {
                                tweetMessage:results[i].tweet[j].tweetMessage,
                                tweetImage:results[i].tweet[j].tweetImage,
                            }
                        )
                    }
                }
                for(let i=0; i<allresults.length; i++){
                    if(allresults[i].tweetMessage.includes(req.body.searchBar)){
                        searchResults.push(allresults[i])
                    }
                }
                res.send(searchResults);
            }
        })
});




module.exports = router;
