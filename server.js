///////////////////////////////
// DEPENDENCIES
////////////////////////////////
// get .env variables
require("dotenv").config();
// pull PORT from .env, give default value of 3000
// pull MONGODB_URL from .env
const { PORT = 3000, MONGODB_URL } = process.env;
// import express
const express = require("express");
// create application object
const app = express();
// import mongoose
const mongoose = require("mongoose");
// import middleware
const cors = require("cors") // cors headers
const morgan = require("morgan") // logging
const session = require("express-session")
const mongoStore = require("connect-mongo")
const bcrypt = require("bcryptjs")

///////////////////////////////
// DATABASE CONNECTION
////////////////////////////////
// Establish Connection
mongoose.connect(MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})
// Connection Events
mongoose.connection
  .on("open", () => console.log("Your are connected to mongoose"))
  .on("close", () => console.log("Your are disconnected from mongoose"))
  .on("error", (error) => console.log(error))

///////////////////////////////
// MODELS
////////////////////////////////
const BookmarksSchema = new mongoose.Schema({
    url: {type: String, required: true},
    name: {type: String, required: true, unique: true},
    users: [String]
});
  
const Bookmark = mongoose.model("Bookmark", BookmarksSchema);

const UsersSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
})
  
const User = mongoose.model("User", UsersSchema);

///////////////////////////////
// MiddleWare
////////////////////////////////
app.use(cors()) // to prevent cors errors, open access to all origins
app.use(morgan("dev")) // logging
app.use(express.json()) // parse json bodies

app.use(
    session({
      secret: process.env.SECRET,
      store: mongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
      saveUninitialized: false,
      resave: false,
    })
)

///////////////////////////////
// BOOKMARKS ROUTES
///////////////////////////////

// Index Route - get request to /bookmarks
// get us the bookmarks
app.get("/bookmarks", async (req, res) => {

    const username = req.session.username
    try {
        res.json(await Bookmark.find({users: username}));
    } catch (error) {
        res.status(400).json(error);
    }
})

// Index Route - get request to /bookmarks
// get us the bookmarks
app.get("/bookmarks/explore", async (req, res) => {

    const username = req.session.username

    try {
        res.json(await Bookmark.find({users: {$ne: username}}));
    } catch (error) {
        res.status(400).json(error);
    }
})

// Create Route - post request to /bookmarks
// create a bookmark from JSON body
app.post("/bookmarks", async (req, res) => {

    let existing = await Bookmark.findOne({name: req.body.name})
    console.log(existing)
    console.log(req.session)

    if (existing) {
        if (existing.users.includes(req.session.username)) {
            res.json(existing)
        }
        else {
            existing.users.push(req.session.username)
            Bookmark.updateOne(existing)
            res.json(existing)
        }
    }
    else {
        req.body.users = [req.session.username]
        try {
            res.json(await Bookmark.create(req.body))
        } catch (error){
            res.status(400).json({error})
        }
    }

})

// Show Route - get request to /bookmarks/:id
// show a bookmark
app.get("/bookmarks/:id", async (req, res) => {
    try  {
        res.json(await Bookmark.findById(req.params.id))
    } catch (error) {
        res.status(400).json({error})
    }
})

// Update route - put request to /bookmarks/:id
// update a specified bookmark
app.put("/bookmarks/:id", async (req, res) => {
    try{
        res.json(await Bookmark.findByIdAndUpdate(req.params.id, req.body, {new: true}))
    } catch (error) {
        res.status(400).json({error})
    }
})

// Destroy route - delete request to /bookmarks/:id
// delete a specific bookmark
app.delete("/bookmarks/:id", async(req, res) => {
    try{
        res.json(await Bookmark.findByIdAndRemove(req.params.id));
    } catch (error) {
        res.status(400).json({error})
    }
})

/////////////////////////////////////////
// USERS ROUTES
/////////////////////////////////////////
// Index Route - get request to /users
// get us the user
app.post("/authenticate", (req, res) => {

    const { username, password } = req.body

    User.findOne({ username }, async (err, user) => {
        if (!user) {
            res.status(400).json('No user found')
            return
        }
        
        const success = await bcrypt.compare(password, user?.password)
        if (!success) {
            res.status(400).json('Wrong password')
            return
        }
        
        req.session.loggedIn = true
        req.session.username = username
        res.json({id: user._id, username: user.username})
    })
})

// Create User - post request to /register
app.post("/register", async (req, res) => {

    req.body.password = await bcrypt.hash(req.body.password, await bcrypt.genSalt(10))

    User.create(req.body, (err, user) => {
        if (err) {
            res.status(400).json('Username taken')
            return
        }
        
        req.session.loggedIn = true
        req.session.username = user.username
        res.json({id: user._id, username: user.username})
    })
})

app.get("/logout", async (req, res) => {
    req.session.destroy( err => {
        if (!err) res.json('Logged out')
    })
})
///////////////////////////////
// LISTENER
////////////////////////////////
app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));