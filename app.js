const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();
const authJwt = require("./middlewares/jwt.js");
const errorHandler = require("./middlewares/error_handler.js");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/usersRoutes");
const adminRouter = require("./routes/adminRoutes");

const app = express();
const env = process.env;
const API = env.API_URL;

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());

app.use(errorHandler);

app.use(`${API}/`, authRouter);

app.use(`${API}/users`, usersRouter);
app.use(`${API}/admin`, adminRouter);
app.use("/public", express.static(__dirname + "/public"));
app.use(authJwt);

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
