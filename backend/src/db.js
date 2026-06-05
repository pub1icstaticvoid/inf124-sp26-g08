require("./env");
const mongoose = require("mongoose");

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;
  const mongoDbName = process.env.MONGO_DB_NAME;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(mongoUri, mongoDbName ? { dbName: mongoDbName } : {});

  const activeDbName = mongoose.connection.name;
  console.log(`Connected to MongoDB database "${activeDbName}"`);

  if (!mongoDbName && activeDbName === "test") {
    console.warn(
      'MongoDB connected to the default "test" database. Add MONGO_DB_NAME to backend/.env or include the database name in MONGO_URI.'
    );
  }
};

module.exports = { connectDb, mongoose };
