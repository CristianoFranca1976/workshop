const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Conexão com MongoDB local ou Atlas
mongoose.connect("mongodb://localhost:27017/clientes", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelo de usuário
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
}));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: "segredo123",
  resave: false,
  saveUninitialized: true,
}));

// Middleware de autenticação
function auth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Rotas
app.get("/", (req, res) => res.redirect("/register"));

app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "views/register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views/login.html")));
app.get("/dashboard", auth, (req, res) => res.sendFile(path.join(__dirname, "views/dashboard.html")));

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = new User({ name, email, password: hash });
    await user.save();
    res.redirect("/login");
  } catch (err) {
    res.send("Erro ao cadastrar. Talvez o e-mail já exista.");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.send("Usuário não encontrado");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.send("Senha incorreta");

  req.session.userId = user._id;
  res.redirect("/dashboard");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));
