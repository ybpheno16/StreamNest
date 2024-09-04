// require("dotenv").config({ path: "./.env" });
// import dotenv from "dotenv";
import connectDB  from "./db/dbConnect.js";
import { app } from "./app.js";

/** IF NOT using below script
 * "nodemon -r dotenv/config --experimental-json-modules src/index.js"
 * as "dev" script in "package.json" file,
 * NOTE:- "-r dotenv/config --experimental-json-modules" loads .env file
 * contents when first server starts
 * ***************************************
 * USE 👇🏻 this config :-
 */
// dotenv.config({
//     path: './.env'
// })

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB Connection FAILED !!! : ", err);
    process.exit(1);
})













/*
IIFE (Immediately Invoked Function Expression)

import express from "express";
const app = express();

( async ()=> {
    try {
        dotenv.config({
            path: './.env'
        })
        const connect = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error)=> {
            console.log("ERROR:", error)
            throw error;
        })

        console.log("MongoDB Connected: ", connect.connection.host);

        app.listen(process.env.PORT, ()=>{
            console.log(`App is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR:", error);
        throw error;
    }
})()

*/
