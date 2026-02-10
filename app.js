const express = require("express");
require("dotenv/config");

const app = express();
const env = process.env;

app.get("/", (request, response) => {
  return response.send("<h1>Welcome Idham Ganteng </h1>");
});

const hostname = process.env.HOSTNAME;
const port = env.PORT;

mongoose.connect();

//start the server
app.listen(port, hostname, () => {
  console.log(`server is running at  http://${hostname}:${port}`);
});
