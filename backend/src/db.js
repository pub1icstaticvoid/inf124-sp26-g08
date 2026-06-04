// shared database client
require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);
let dbInstance = null;

const connectDb = async () => {
    try {
        await client.connect();

        dbInstance = client.db();
        console.log("connected to shared mongoDB atlas cloud");

        await dbInstance.collection("users").createIndex({ "email": 1}, { unique: true });

        await dbInstance.collection("messages").createIndex({ "conversationId": 1, "timestamp": 1 });
    }
    catch (error) {
        console.error("mongoDB connection failed");
        console.error(error);
        process.exit(1);
    }
};

const getDb = () => {
    if (!dbInstance) throw new Error("database not initialized");
    return dbInstance;
};

module.exports = { connectDb, getDb };