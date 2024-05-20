const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const app = express();
const port = 80;

app.use(express.static("public"));
app.use(cookieParser());
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

const addMessage = (id, text, type) => {
  let data = fs.readFileSync("./data/sessions.json", "utf8");
  data = JSON.parse(data);
  data = data.map((s) =>
    s.id === id ? { id, d: { ...s.d, msg: { text, type } } } : s
  );
  data = JSON.stringify(data);
  fs.writeFileSync("./data/sessions.json", data);
};

const showMessage = (id) => {
  let data = fs.readFileSync("./data/sessions.json", "utf8");
  data = JSON.parse(data);
  const session = data.find((s) => s.id === id);
  if (!session || !session.d?.msg) {
    return "";
  }
  const { text, type } = session.d.msg;
  delete session.d.msg;
  data = JSON.stringify(data);
  fs.writeFileSync("./data/sessions.json", data);
  return `<div class="mt-3 ms-5 me-5 alert  alert-${type}" role="alert">  ${text}</div>`;
};

app.use((req, res, next) => {
  const id = req.cookies.USERS || "";
  let data = fs.readFileSync("./data/sessions.json", "utf8");
  data = JSON.parse(data);
  if (!id) {
    const newId = uuidv4();
    data.push({ id: newId, d: {} });
    data = JSON.stringify(data);
    fs.writeFileSync("./data/sessions.json", data);
    res.cookie("USERS", newId, {
      maxAge: 24 * 60 * 60 * 1000,
    });
    req.sessionsId = newId;
  } else {
    let session = data.find((s) => s.id === id);
    if (!session) {
      const newId = uuidv4();
      data.push({ id: newId, d: {} });
      data = JSON.stringify(data);
      fs.writeFileSync("./data/sessions.json", data);
      res.cookie("USERS", newId, {
        maxAge: 24 * 60 * 60 * 1000,
      });
      req.sreq.sessionsId = newId;
    } else {
      req.sessionsId = id;
      res.cookie("USERS", id, {
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
  }
  next();
});

app.get("/", (req, res) => {
  // console.log("cookies", req.cookies);
  // res.cookie("labas", "saldainis", { maxAge: 60 * 1000 });
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
      .replace("{{amount}}", li.amount.toFixed(2));
    listItems += liHtml;
  });
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum.toFixed(2))
    .replace("{{TOTALUSERS}}", data.length);
  html = html
    .replace("{{NAV}}", nav)
    .replace("{{LIST}}", listItems)
    .replace("{{MSG}}", showMessage(req.sessionsId));

  res.send(html);
});

app.get("/create", (req, res) => {
  let html = fs.readFileSync("./data/create.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum.toFixed(2))
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
  addMessage(req.sessionsId, `New account was added`, "success");
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
    .replace("{{TOTALAMOUNT}}", totalSum.toFixed(2))
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
  const user = data.find((c) => c.id === req.params.id);
  if (user.amount > 0) {
    addMessage(
      req.sessionsId,
      `The account for ${user.holderName} ${user.holderSurname} cannot be deleted because it has funds.`,
      "danger"
    );
    res.redirect(302, "http://bankas.test/");
  } else {
    data = data.filter((u) => u.id !== req.params.id);
    data = JSON.stringify(data);
    fs.writeFileSync("./data/users.json", data);
    addMessage(
      req.sessionsId,
      `Account of ${user.holderName} ${user.holderSurname} was deleted`,
      "danger"
    );
    res.redirect(302, "http://bankas.test/");
  }
});

app.get("/deposit/:id", (req, res) => {
  let html = fs.readFileSync("./data/deposit.html", "utf8");
  let nav = fs.readFileSync("./data/nav.html", "utf8");
  let data = fs.readFileSync("./data/users.json", "utf8");
  data = JSON.parse(data);
  const user = data.find((c) => c.id === req.params.id);
  let totalSum = data.reduce((acc, item) => acc + item.amount, 0);
  nav = nav
    .replace("{{TOTALAMOUNT}}", totalSum.toFixed(2))
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
  const user = data.find((c) => c.id === req.params.id);
  if (userIndex !== -1) {
    data[userIndex].amount += newAmount;
    data = JSON.stringify(data);
    fs.writeFileSync("./data/users.json", data);
    addMessage(
      req.sessionsId,
      `The sum of ${newAmount} $ was deposited to ${user.holderName} ${user.holderSurname} account`,
      "success"
    );
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
    .replace("{{TOTALAMOUNT}}", totalSum.toFixed(2))
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
  const user = data.find((c) => c.id === req.params.id);

  if (userIndex !== -1) {
    if (data[userIndex].amount >= newAmount) {
      data[userIndex].amount -= newAmount;
      data = JSON.stringify(data);
      fs.writeFileSync("./data/users.json", data);
      addMessage(
        req.sessionsId,
        `The sum of ${newAmount} $ was withdrawn from ${user.holderName} ${user.holderSurname} account`,
        "success"
      );
      res.redirect(302, "http://bankas.test/");
    } else {
      addMessage(
        req.sessionsId,
        `Insufficient funds to withdraw ${newAmount} $ from ${user.holderName} ${user.holderSurname} account`,
        "danger"
      );
      res.redirect(302, "http://bankas.test/");
    }
  } else {
    res.status(404).send("User not found");
  }
});

app.listen(port, () => {
  console.log(`Bank SSR listening on port ${port}`);
});
