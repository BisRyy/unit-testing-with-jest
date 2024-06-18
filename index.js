const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let customPokemons = [
  {
    name: "bisry",
    base_experience: 112,
    height: 4,
    weight: 60,
  },
];

let users = [];

const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({ username, password: hashedPassword });
  res.status(201).json({ message: "User created successfully" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/pokemon/:name", async (req, res) => {
  try {
    const { name } = req.params;

    if (customPokemons.find((p) => p.name === name.toLowerCase())) {
      const pokemon = customPokemons.find((p) => p.name === name.toLowerCase());
      return res.json(pokemon);
    }

    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(404).json({ error: "Pokemon not found" });
  }
});

app.post("/pokemon", (req, res) => {
  const newPokemon = req.body;
  if (!newPokemon.name) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (
    typeof newPokemon.base_experience !== "number" ||
    typeof newPokemon.height !== "number" ||
    typeof newPokemon.weight !== "number"
  ) {
    return res.status(400).json({ error: "Invalid data types" });
  }

  if (customPokemons.find((p) => p.name === newPokemon.name)) {
    return res.status(400).json({ error: "Pokemon already exists" });
  }

  customPokemons.push(newPokemon);
  res.status(201).json(newPokemon);
});

app.patch("/pokemon/:name", (req, res) => {
  const { name } = req.params;
  const updates = req.body;
  let pokemon = customPokemons.find((p) => p.name === name);

  if (pokemon) {
    if (
      updates.base_experience &&
      typeof updates.base_experience !== "number"
    ) {
      return res.status(400).json({ error: "Invalid data types" });
    }
    Object.assign(pokemon, updates);
    res.json(pokemon);
  } else {
    res.status(404).json({ error: "Pokemon not found" });
  }
});

app.delete("/pokemon/:name", (req, res) => {
  const { name } = req.params;
  const index = customPokemons.findIndex((p) => p.name === name);

  if (index !== -1) {
    customPokemons.splice(index, 1);
    res.status(204).end();
  } else {
    res.status(404).json({ error: "Pokemon not found" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, users };
