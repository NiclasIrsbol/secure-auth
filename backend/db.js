const { Client } = require('pg')
const dotenv = require('dotenv');

dotenv.config();
const connection = new Client({
    host: process.env.host,
    user: process.env.user,
    port: process.env.port,
    password: process.env.password,
    database: process.env.database,
})

connection.connect().then(() => console.log('Connected'))

module.exports = connection