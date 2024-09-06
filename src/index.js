import { connectDB } from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js"
dotenv.config({
    path : "./.env"
})

connectDB();
const port = process.env.PORT  || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});