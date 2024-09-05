import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () =>{

try {
    const dbConnector  = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("dbConnector is : ",dbConnector.connection.host);
    
} catch (error) {
    console.error(`MOnGODB connection failed !! ${error}`);
    process.exit(1);    
}

}