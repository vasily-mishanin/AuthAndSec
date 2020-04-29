//jshint esversion:6
require("dotenv").config(); //for using Environment Variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// BCRYPT encryption authentication
const bcrypt = require("bcrypt"); // to use bcrypt technnology
const saltRounds = 10;
//

const app = express();

//console.log(process.env.SECRET_KEY); // log "SECRET_KEY" from ".env" file

app.use(express.static("public")); // using "public" folder for statics
app.set("view engine", "ejs"); // Embedded Javascript
app.use(bodyParser.urlencoded({ extended: true })); // to take parsed values fron the pages

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

//creating new collection ("users") as a model
const User = new mongoose.model("User", userSchema);

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
  res.render("secrets");
});

app.get("/submit", (req, res) => {
  res.render("submit");
});

app.post("/register", (req, res) => {
  ////////BCRYPT////////////////////////////////////////////////
  console.log(req.body);
  // BCRYPT HASH
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const newUser = new User({
      name: req.body.username,
      password: hash,
    });
    newUser.save((err) => {
      err ? console.log(err) : res.render("secrets");
    });
  });
});

app.post("/login", (req, res) => {
  // BCRYPT HASH
  const username = req.body.username;
  const requestedPassword = req.body.password;
  User.findOne({ name: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(requestedPassword, foundUser.password, (err, result) => {
          // if result===true, i. e. hashes are the same --> render "secrets" page
          result ? res.render("secrets") : res.render("failure");
        });
      }
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
