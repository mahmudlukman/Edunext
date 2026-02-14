import mongoose from "mongoose";
import config from "../config";
import type { ConnectOptions } from "mongoose";

const dbUrl: string = config.DB_URL || "";

const clientOptions: ConnectOptions = {
  dbName: "EdunextDB",
  appName: "EdunextApp",
  family: 4,
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
};

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl, clientOptions).then((data: any) => {
      console.log(`Database connected with ${data.connection.host}`);
    });
  } catch (error: any) {
    console.log(error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
