const mongoose = require( "mongoose" );
require( "dotenv" ).config();

const connectionUrl = process.env.MONGO_URL;
const initializeDatabase = async () => {
    try {
        const connection = await mongoose.connect( connectionUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        } )
        if ( connection ) {
            console.log( "Connected database succeccessfully." );
        }
    } catch ( error ) {
        console.log( "Database Connection failed:", error.message );

    }
}
module.exports = { initializeDatabase }