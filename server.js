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

///////////////////////////////
// DATABASE CONNECTION
////////////////////////////////
// Establish Connection
mongoose.connect(MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
// Connection Events
mongoose.connection
  .on("open", () => console.log("Your are connected to mongoose"))
  .on("close", () => console.log("Your are disconnected from mongoose"))
  .on("error", (error) => console.log(error));

///////////////////////////////
// MODELS
////////////////////////////////
const BookmarksSchema = new mongoose.Schema({
    creator: String,
    url: String,
    name: String,
  });
  
const Bookmarks = mongoose.model("Bookmarks", BookmarksSchema);

const UsersSchema = new mongoose.Schema({
    username: String,
    password: String,
    bookmarks: Array,
  });
  
const Users = mongoose.model("Users", UsersSchema);

///////////////////////////////
// MiddleWare
////////////////////////////////
app.use(cors()); // to prevent cors errors, open access to all origins
app.use(morgan("dev")); // logging
app.use(express.json()); // parse json bodies

///////////////////////////////
// ROUTES
////////////////////////////////
// create a test route
app.get("/", (req, res) => {
  res.send("hello world");
});


///////////////////////////////
// BOOKMARKS ROUTES
///////////////////////////////
// Index Route - get request to /bookmarks
// get us the bookmarks
app.get("/bookmarks", async (req, res) => {
    try {
        res.json(await Bookmarks.find({}));
    } catch (error) {
        res.status(400).json(error);
    }
})
// Create Route - post request to /bookmarks
// create a bookmark from JSON body
app.post("/bookmarks", async (req, res) => {
    try {
        res.json(await Bookmarks.create(req.body))
    } catch (error){
        res.status(400).json({error})
    }
})

// Show Route - get request to /bookmarks/:id
// show a bookmark
app.get("/bookmarks", async (req, res) => {
    try  {
        res.json(await Bookmarks.findById(req.params.id))
    } catch (error) {
        res.status(400).json({error})
    }
})

// Update route - put request to /bookmarks/:id
// update a specified bookmark
app.put("/bookmarks/:id", async (req, res) => {
    try{
        res.json(await Bookmarks.findByIdAndUpdate(req.params.id, req.body,
            {new: true})
            )
    } catch (error) {
        res.status(400).json({error})
    }
})
// Destroy route - delete request to /bookmarks/:id
// delete a specific bookmark
app.delete("/bookmarks/:id", async(req, res) => {
    try{
        res.json(await Bookmarks.findByIdAndRemove(req.params.id));
    } catch (error) {
        res.status(400).json({error})
    }
})

/////////////////////////////////////////
// USERS ROUTES
/////////////////////////////////////////
// Index Route - get request to /users
// get us the user
app.get("/users", async (req, res) => {
    try {
        res.json(await Users.find({}));
    } catch (error) {
        res.status(400).json(error);
    }
})
// Create Route - post request to /users
// create a user from JSON body
app.post("/users", async (req, res) => {
    try {
        res.json(await Users.create(req.body))
    } catch (error){
        res.status(400).json({error})
    }
})

// Show Route - get request to /users/:id
// show a user
app.get("/users", async (req, res) => {
    try  {
        res.json(await Users.findById(req.params.id))
    } catch (error) {
        res.status(400).json({error})
    }
})

// Update route - put request to /users/:id
// update a specified user
app.put("/users/:id", async (req, res) => {
    try{
        res.json(await Users.findByIdAndUpdate(req.params.id, req.body,
            {new: true})
            )
    } catch (error) {
        res.status(400).json({error})
    }
})
// Destroy route - delete request to /users/:id
// delete a specific user
app.delete("/users/:id", async(req, res) => {
    try{
        res.json(await Users.findByIdAndRemove(req.params.id));
    } catch (error) {
        res.status(400).json({error})
    }
})
///////////////////////////////
// LISTENER
////////////////////////////////
app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));