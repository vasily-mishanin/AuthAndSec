//jshint esversion:6
require("dotenv").config(); //for using Environment Variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// MD5 encryption authentication
const md5 = require("md5"); // to use md5 hash-function

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
  // MD5 HASH --> take "username" and "password". Password will be turneb into unreversable hash by md5()
  const newUser = new User({
    name: req.body.username,
    password: md5(req.body.password),
  });
  newUser.save((err) => {
    err ? console.log(err) : res.render("secrets");
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  // MD5 HASH
  const requestedPassword = md5(req.body.password); // to hash requested password
  User.findOne({ name: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      // MD5 HASH --> compare stored at "userDB" and already hashed "password" with "requestedPassword" which was hashed via md5()
      if (foundUser) {
        foundUser.password === requestedPassword
          ? res.render("secrets")
          : res.render("failure");
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
