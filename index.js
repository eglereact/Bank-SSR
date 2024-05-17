const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = 80;

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const fs = require("node:fs");

const compareBySurname = (a, b) => {
  const nameA = a.holderSurname.toLowerCase();
  const nameB = b.holderSurname.toLowerCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

app.get("/", (req, res) => {
  let html = fs.readFileSync("./data/index.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data).sort(compareBySurname);
  const listItem = fs.readFileSync("./data/listItem.html", "utf8");

  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  let listItems = "";
  data.forEach((li) => {
    let liHtml = listItem;
    liHtml = liHtml
      .replaceAll("{{ID}}", li.id)
      .replace("{{name}}", li.holderName)
      .replace("{{surname}}", li.holderSurname)
      .replace("{{amount}}", li.amount);
    listItems += liHtml;
  });
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum)
    .replace("{{TOTALUSERS}}", data.length);
  html = html.replace("{{NAV}}", nav).replace("{{LIST}}", listItems);

  res.send(html);
});

app.get("/create", (req, res) => {
  let html = fs.readFileSync("./data/create.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum)
    .replace("{{TOTALUSERS}}", data.length);
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

app.get("/delete/:id", (req, res) => {
  let html = fs.readFileSync("./data/delete.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  const user = data.find((c) => c.id === req.params.id);
  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum)
    .replace("{{TOTALUSERS}}", data.length);
  html = html
    .replace("{{NAV}}", nav)
    .replace("{{USERNAME}}", `${user.holderName} ${user.holderSurname}`)
    .replace("{{ID}}", user.id);
  res.send(html);
});

app.post("/destroy/:id", (req, res) => {
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  data = data.filter((u) => u.id !== req.params.id);
  data = JSON.stringify(data);
  fs.writeFileSync("./data/users.json", data);
  console.log(req.params.id);
  res.redirect(302, "http://bankas.test/");
});

app.get("/deposit/:id", (req, res) => {
  let html = fs.readFileSync("./data/deposit.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  const user = data.find((c) => c.id === req.params.id);
  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum)
    .replace("{{TOTALUSERS}}", data.length);
  html = html
    .replace("{{NAV}}", nav)
    .replace("{{USERNAME}}", `${user.holderName} ${user.holderSurname}`)
    .replace("{{ID}}", user.id);
  res.send(html);
});

app.post("/add/:id", (req, res) => {
  const newAmount = parseFloat(req.body.depositAmount);
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  const userIndex = data.findIndex((u) => u.id === req.params.id);

  if (userIndex !== -1) {
    data[userIndex].amount += newAmount;
    data = JSON.stringify(data);
    fs.writeFileSync("./data/users.json", data);
    res.redirect(302, "http://bankas.test/");
  } else {
    res.status(404).send("User not found");
  }
});

app.get("/withdraw/:id", (req, res) => {
  let html = fs.readFileSync("./data/withdraw.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  const user = data.find((c) => c.id === req.params.id);
  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum)
    .replace("{{TOTALUSERS}}", data.length);
  html = html
    .replace("{{NAV}}", nav)
    .replace("{{USERNAME}}", `${user.holderName} ${user.holderSurname}`)
    .replace("{{ID}}", user.id);
  res.send(html);
});

app.post("/remove/:id", (req, res) => {
  const newAmount = parseFloat(req.body.depositAmount);
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  const userIndex = data.findIndex((u) => u.id === req.params.id);

  if (userIndex !== -1) {
    data[userIndex].amount -= newAmount;
    data = JSON.stringify(data);
    fs.writeFileSync("./data/users.json", data);
    res.redirect(302, "http://bankas.test/");
  } else {
    res.status(404).send("User not found");
  }
});

app.listen(port, () => {
  console.log(`Bank SSR listening on port ${port}`);
});
