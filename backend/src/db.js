// shared database client
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);
let dbInstance = null;

const connectDb = async () => {
    try {
        await client.connect();

        dbInstance = client.db();
        console.log("connected to shared mongoDB atlas cloud");

        await dbInstance.collection("users").createIndex({ "email": 1}, { unique: true });
    }
    catch (error) {
        console.error("mongoDB connection failed");
        process.exit(1);
    }
};

const getDb = () => {
    if (!dbInstance) throw new Error("database not initialized");
    return dbInstance;
};

module.exports = { connectDb, getDb };