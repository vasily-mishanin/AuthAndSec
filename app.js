//jshint esversion:6
require("dotenv").config(); //for using Environment Variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// // //encryption using environment variables
// // const encrypt = require("mongoose-encryption");

// // // MD5 encryption authentication
// // const md5 = require("md5"); // to use md5 hash-function

// // // BCRYPT encryption authentication
// // const bcrypt = require("bcrypt"); // to use bcrypt technnology
// // const saltRounds = 10;
// // //

//PASSPORT authentication
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
/////////////

//GOOGLE OAuth///////////////////////////////////////////////
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// to use "User.findOrCreate()" method
const findOrCreate = require("mongoose-findorcreate");
/////////////

const app = express();

//console.log(process.env.SECRET_KEY); // log "SECRET_KEY" from ".env" file

app.use(express.static("public")); // using "public" folder for statics
app.set("view engine", "ejs"); // Embedded Javascript
app.use(bodyParser.urlencoded({ extended: true })); // to take parsed values fron the pages

// set up and initialize "session" with options
app.use(
  session({
    secret: "The little secret fo yours.",
    resave: false,
    saveUninitialized: false,
  })
);
//initialize passport
app.use(passport.initialize());
//use passport also for maintaining sessions
app.use(passport.session());

//connect to MongoDB
const dbName = "userDB";
mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

//creating new Schema
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String,
});
//salt and hash users passports
userSchema.plugin(passportLocalMongoose); //from "require" sections
//use OAuth from Google
userSchema.plugin(findOrCreate); //from "require" sections

///////////////////////////////////////////////Mongoose - Encryption////////////////////////////////////////////////////////////////////
// // encrypt dosc of 'userSchema' when User.save() and decrypt when User.find()
// // process.env.SECRET_KEY -> grabs SECRET_KEY from .env file
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET_KEY,
//   encryptedFields: ["password"],
// });

//creating new collection ("users") as a model
const User = new mongoose.model("User", userSchema);

//with passport functions embedded
passport.use(User.createStrategy()); //local login strategy
//serializeUser
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
//deserializeUser
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//Google OAuth using CLIENT_SECRET and CLIENT_ID from .env/////////////////////////////////////////////////////////
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/secrets",
      //endpoint to get user info not from Google+
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

////////////////////////////////// ROUTES ////////////////////////
app.get("/", (req, res) => {
  res.render("home");
});

//Google OAuth20
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
//user will be redirected to. Made by Google
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to "/secrets".
    res.redirect("/secrets");
  }
);

//////////////////////

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    User.find({ secret: { $ne: null } }, (err, foundUsers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", { usersWithSecrets: foundUsers });
        }
      }
    });
  } else {
    res.render("login");
  }
});

app.get("/submit", (req, res) => {
  req.isAuthenticated() ? res.render("submit") : res.render("login");
});

// deAuthenticate and end the users session
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", (req, res) => {
  //////////MD5 or BCRYPT////////////////////////////////////////////////

  //////////MD5////////////////////////////////////////////////
  // //  // MD5 HASH --> take "username" and "password". Password will be turneb into unreversable hash by md5()
  // //   const newUser = new User({
  // //     name: req.body.username,
  // //     password: md5(req.body.password),
  // //   });
  // //   newUser.save((err) => {
  // //     err ? console.log(err) : res.render("secrets");
  // //   });

  //////////BCRYPT////////////////////////////////////////////////
  // console.log(req.body);
  // // BCRYPT HASH
  // bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
  //   const newUser = new User({
  //     name: req.body.username,
  //     password: hash,
  //   });
  //   newUser.save((err) => {
  //     err ? console.log(err) : res.render("secrets");
  //   });
  // });
  ////////////PASPORT///////////////////////////////////////////
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.render("register");
      } else {
        // Authenticate new user, salt and hash "password" automatically and also send cookie to users browser
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  //////////BCRYPT or MD5///////////////////////////////////////////////
  // const username = req.body.username;
  // // // MD5 HASH
  // // const requestedPassword = md5(req.body.password); //hash requested password
  // const requestedPassword = req.body.password;
  // User.findOne({ name: username }, (err, foundUser) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //       // // MD5 HASH --> compare stored at "userDB" and already hashed "password" with "requestedPassword" which was hashed via md5()
  //       // if (foundUser) {
  //       //   foundUser.password === requestedPassword ? res.render("secrets") : res.render("failure");
  //       //   });
  //       // }
  //     // BCRYPT HASH
  //     if (foundUser) {
  //       bcrypt.compare(requestedPassword, foundUser.password, (err, result) => {
  //         // if result===true, i. e. hashes are the same --> render "secrets" page
  //         result ? res.render("secrets") : res.render("failure");
  //       });
  //     }
  //   }
  // });

  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  // Authenticate user (from passport module) and also send cookie to users browser
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets"); // if "passport.authenticate" is true
      });
    }
  });
});

// POST new secret from user
app.post("/submit", (req, res) => {
  const newSecret = req.body.secret;
  console.log(req.user._id);
  User.findById(req.user._id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      foundUser.secret = newSecret;
      foundUser.save(() => res.redirect("/secrets"));
    }
  });
});

/////////////////Listener/////////////////////////////
localPort = 5000;
app.listen(localPort, (err) => {
  !err
    ? console.log(`Server is running at port ${localPort}`)
    : console.log(err);
});
