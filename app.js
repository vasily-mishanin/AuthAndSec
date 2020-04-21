//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//connect to MongoDB
const dbName = "userDB";
mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//creating new Schema
const userSchema = new mongoose.Schema({
  name: String,
  password: String,
});

///////////////////////////////////////////////Encryption////////////////////////////////////////////////////////////////////
const secret = "Thisisstringusedforencryption";
//encrypt dosc with 'userSchema' when User.save() and decrypt when User.find()
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

//creating new collection
const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  console.log(req.body);
  const newUser = new User({
    name: req.body.username,
    password: req.body.password,
  });

  newUser.save((err) => {
    err ? console.log(err) : res.render("secrets");
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const requestedPassword = req.body.password;

  User.findOne({ name: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.password === requestedPassword
          ? res.render("secrets")
          : res.render("failure");
      }
    }
  });
});
//////////////////////////////////////////////
localPort = 5000;
app.listen(localPort, (err) => {
  !err
    ? console.log(`Server is runnning in port ${localPort}`)
    : console.log(err);
});
