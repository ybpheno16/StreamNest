import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// console.log(process.env.MONGODB_URI+'/'+DB_NAME+'?retryWrites=true&w=majority');
const connectDB = async () => {
  const connectionInstance = await mongoose.connect(
    `${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority`
  );
  console.log(
    `MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`
  );

  /** HITESH SIR CODE - 
   * Unneccesary try-catch block, 
   * already handled in "./index.js" 
   * 👇🏻👇🏻👇🏻👇🏻
   */

  // try {
  //     const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
  //     console.log(`MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`);
  // } catch (error) {
  //     console.log("MONGODB connection FAILED: ", error);
  //     process.exit(1);
  // }
};

export default connectDB;
