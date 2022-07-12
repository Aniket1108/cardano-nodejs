const express = require('express')
const app = express()

const dotenv = require('dotenv').config()

const cardanoRoutes = require('./routes/cardanoroutes.js')

app.use(express.json())
app.use('/cardano', cardanoRoutes)

app.get('/server', (req, res) => {
    res.send({
        code: 200,
        status: "OK",
        message: "Connected to server"
    })
})

app.listen(process.env.PORT || 2047, () => {
    console.log("If your reading this means server is running. pleasure meeting you.")
})