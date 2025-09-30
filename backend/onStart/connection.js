const mongoose = require("mongoose");
const dotenv = require('dotenv');

dotenv.config();

const dbConnection = () => {
    return mongoose.connect(process.env.DB_URL)
        .then(() => {
            console.log(`Dadabasse connection succefull
==============================  
        `);

        }).catch(err => {
            console.error(`
==============================
Dadabasse connection unsuccefull ${err}
==============================  
`);

        })
}

module.exports = dbConnection;