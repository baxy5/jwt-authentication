require("dotenv").config()
require("./config/database").connect()
const express = require("express")
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");

const app = express()

// Static Folder
app.use(express.static(__dirname + "/client"));

app.use(express.urlencoded({extended: true}));
app.use(express.json())

// User context
const User = require("./model/user")

// Routes
const auth = require("./middleware/auth")

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/client/index.html");
})

// only access with token
app.get("/welcome", auth, (req,res)=>{
    res.status(200).send("Welcome! :)")
})

app.get("/register", (req,res)=>{
    res.sendFile(__dirname + "/client/register.html");
})

app.get("/login", (req,res)=>{
    res.sendFile(__dirname + "/client/login.html");
})

//register
app.post("/register", async (req,res)=>{
    try{
        const {email,password} = req.body

        if(!(email && password)){
            res.status(400).send("All input is required!")
        }

        const oldUser = await User.findOne({email});

        if(oldUser){
            return res.status(409).send("User already exist. Please login!")
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email: email.toLowerCase(),
            password: encryptedPassword
        })

        const token = jwt.sign({
            user_id: user._id,
            email
        },
        process.env.TOKEN_KEY,
        {
            expiresIn: "2h"
        })

        user.token = token

        res.status(201).json(user)
    }
    catch(err){
        console.log(err)
    }

})

//login
app.post("/login", async (req,res)=>{
    try{
        const {email,password} = req.body

        if(!(email && password)){
            res.status(400).send("All input is required!")
        }

        const user = await User.findOne({email})

        if(user && (await bcrypt.compare(password,user.password))){

            const token = jwt.sign(
                {
                    user_id: user._id, email
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h"
                }
            )

            user.token = token

            res.status(200).json(user)
        }

        res.status(400).send("Invalid Credentials")
    }
    catch(err){
        console.log(err)
    }
})

module.exports = app;