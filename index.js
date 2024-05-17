const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = 80;

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const fs = require("node:fs");

app.get("/", (req, res) => {
  let html = fs.readFileSync("./data/index.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  html = html.replace("{{NAV}}", nav);
  res.send(html);
});

app.get("/create", (req, res) => {
  let html = fs.readFileSync("./data/create.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  html = html.replace("{{NAV}}", nav);
  res.send(html);
});

app.post("/store", (req, res) => {
  const holderName = req.body.holderName;
  const holderSurname = req.body.holderSurname;
  let amount = 0;
  const id = uuidv4();

  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  data.push({ id, holderName, holderSurname, amount });
  data = JSON.stringify(data);
  fs.writeFileSync("./data/users.json", data);

  res.redirect(302, "http://bankas.test/");
});

app.listen(port, () => {
  console.log(`Bank SSR listening on port ${port}`);
});
