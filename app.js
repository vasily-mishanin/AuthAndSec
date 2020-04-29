//jshint esversion:6
require("dotenv").config(); //for using Environment Variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//PASSPORT authentication
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

//console.log(process.env.SECRET_KEY); // log "SECRET_KEY" from ".env" file

app.use(express.static("public")); // using "public" folder for statics
app.set("view engine", "ejs"); // Embedded Javascript
app.use(bodyParser.urlencoded({ extended: true })); // to take parsed values fron the pages

///////////// set up and initialize "session" with options
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
////////

//connect to MongoDB
const dbName = "userDB";
mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

///creating new Schema
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String,
});

//salt and hash users passports
userSchema.plugin(passportLocalMongoose); //from "require" sections

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

////////////////////////////////// ROUTES ////////////////////////
app.get("/", (req, res) => {
  res.render("home");
});

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
  res.render("submit");
});

app.post("/register", (req, res) => {
  ////////////PASPORT -local ///////////////////////////////////////////
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
  //////////// PASPORT -local ///////////////////////////////////////////
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
