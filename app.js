const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv/config");

const app = express();
const env = process.env;

const API = env.API_URL;

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());

const authRouter = require("./routes/auth.js");

app.use(`${API}/`, authRouter);

app.get("/", (request, response) => {
  return response.send("<h1>Welcome Idham Ganteng </h1>");
});

const hostname = process.env.HOSTNAME;
const port = env.PORT;

async function start() {
  try {
    await mongoose.connect(env.MONGGODB_CONNECTION_STRING);
    console.log("Connected to Database Boss!!");

    // start the server after successful DB connection
    app.listen(port, hostname, () => {
      console.log(`server is running at  http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
}

start();
