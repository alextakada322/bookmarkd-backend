///////////////////////////////
// DEPENDENCIES
////////////////////////////////
// get .env variables
require("dotenv").config();
// pull PORT from .env, give default value of 3000
// pull MONGODB_URL from .env
const { PORT = 3000, MONGODB_URL, SECRET, CLIENT_ORIGIN_URL } = process.env;
// import express
const express = require("express");
// create application object
const app = express();
// import mongoose
const mongoose = require("mongoose");
// import middleware
const cors = require("cors") // cors headers
const morgan = require("morgan") // logging
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

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
app.use(cors({credentials: true, origin: CLIENT_ORIGIN_URL}))
app.use(morgan("dev")) // logging
app.use(express.json()) // parse json bodies

const requireAuth = (req, res, next) => {
    try {
        //token: "jlkjsldkjsldkfjsldfjsl"
        if (req.headers.token) {
          const token = req.headers.token
          const payload = jwt.verify(token, SECRET)
          if (payload) {
            req.payload = payload
            next()
          } else {
            res.status(403).json({ error: "VERIFICATION FAILED OR NO PAYLOAD" })
          }
        } else {
          res.status(403).json({ error: "NO AUTHORIZATION HEADER" })
        }
      } catch (error) {
        res.status(403).json({ error })
    }
}

///////////////////////////////
// BOOKMARKS ROUTES
///////////////////////////////

// Index Route - get request to /bookmarks
// get us the bookmarks
app.get("/bookmarks", requireAuth, async (req, res) => {
    const username = req.payload.username
    try {
        res.json(await Bookmark.find({users: username}));
    } catch (error) {
        res.status(400).json(error);
    }
})

// Index Route - get request to /bookmarks/all
// get all the bookmarks
app.get("/bookmarks/all", requireAuth, async (req, res) => {
    try {
        res.json(await Bookmark.find({}));
    } catch (error) {
        res.status(400).json(error);
    }
})

// Index Route - get request to /bookmarks
// get us the bookmarks
app.get("/bookmarks/explore", requireAuth, async (req, res) => {
    const username = req.payload.username
    try {
        res.json(await Bookmark.find({users: {$ne: username}}));
    } catch (error) {
        res.status(400).json(error);
    }
})

// Create Route - post request to /bookmarks
// create a bookmark from JSON body
app.post("/bookmarks", requireAuth, async (req, res) => {

    const existing = await Bookmark.findOne({name: req.body.name})
    const username = req.payload.username

    if (existing) {
        if (!existing.users.includes(username)) {
            existing.users.push(username)
        }
        existing.url = req.body.url
        res.json(await Bookmark.findByIdAndUpdate(existing._id, existing))
    }
    else {
        req.body.users = [username]
        try {
            res.json(await Bookmark.create(req.body))
        } catch (error){
            res.status(400).json({error})
        }
    }

})

// Show Route - get request to /bookmarks/:id
// show a bookmark
app.get("/bookmarks/:id", requireAuth, async (req, res) => {
    try  {
        res.json(await Bookmark.findById(req.params.id))
    } catch (error) {
        res.status(400).json({error})
    }
})

// Update route - put request to /bookmarks/:id
// update a specified bookmark
app.put("/bookmarks/:id", requireAuth, async (req, res) => {
    try{
        res.json(await Bookmark.findByIdAndUpdate(req.params.id, req.body, {new: true}))
    } catch (error) {
        res.status(400).json({error})
    }
})

// Destroy route - delete request to /bookmarks/:id
// delete a specific bookmark
app.delete("/bookmarks/:id", requireAuth, async(req, res) => {
    const existing = await Bookmark.findById(req.params.id)
    const username = req.payload.username
    existing.users = [...existing.users.filter(user => user !== username)]
    res.json(await Bookmark.findByIdAndUpdate(req.params.id, existing, {new: true}));
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

        const token = await jwt.sign({ username }, SECRET);
        res.json({token, username})
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

        const username = user.username
        const token = jwt.sign({username: username}, SECRET);
        res.json({token, username})
    })
})

///////////////////////////////
// LISTENER
////////////////////////////////
app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));