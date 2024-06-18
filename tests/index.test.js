const request = require("supertest");
const { app, server, users } = require("../index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

afterAll(() => {
  server.close();
});

describe("POST /signup", () => {
  it(" not", async () => {
    const response = await request(app)
      .post("/signup")
      .send({ username: "testuser", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User created successfully");
  });

  it("should hash the user password", async () => {
    const response = await request(app)
      .post("/signup")
      .send({ username: "testuser2", password: "password123" });

    const user = users.find((u) => u.username === "testuser2");
    expect(await bcrypt.compare("password123", user.password)).toBe(true);
  });
});

describe("POST /login", () => {
  it("should login a user and return a token", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");

    const decoded = jwt.verify(response.body.token, "your_secret_key");
    expect(decoded).toHaveProperty("username", "testuser");
  });

  it("should return 401 for invalid credentials", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });
});


describe("POST /signup", () => {
  it("should not create a duplicate new user", async () => {
    const response = await request(app)
      .post("/signup")
      .send({ username: "testuser", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Username already exists");
  });

  it("should hash the user password", async () => {
    await request(app)
      .post("/signup")
      .send({ username: "testuser2", password: "password123" });

    const user = users.find((u) => u.username === "testuser2");
    expect(await bcrypt.compare("password123", user.password)).toBe(true);
  });

  it("should not create a user with an existing username", async () => {
    const response = await request(app)
      .post("/signup")
      .send({ username: "testuser", password: "password123" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Username already exists");
  });

  it("should return 400 if password is missing", async () => {
    const response = await request(app)
      .post("/signup")
      .send({ username: "testuser3" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Username and password are required");
  });
});

describe("POST /login", () => {
  it("should login a user and return a token", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");

    const decoded = jwt.verify(response.body.token, "your_secret_key");
    expect(decoded).toHaveProperty("username", "testuser");
  });

  it("should return 401 for invalid credentials", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "testuser", password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });

  it("should return 401 for non-existent username", async () => {
    const response = await request(app)
      .post("/login")
      .send({ username: "nonexistentuser", password: "password123" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });
});

describe("GET /pokemon/:name", () => {
  it("should return Pokemon data for valid name from PokeAPI", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("pikachu");
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("base_experience");
    expect(response.body).toHaveProperty("height");
    expect(response.body).toHaveProperty("weight");
  });

  it("should return Pokemon data for valid name from customPokemons", async () => {
    const response = await request(app).get("/pokemon/bisry");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("bisry");
    expect(response.body.base_experience).toBe(112);
    expect(response.body.height).toBe(4);
    expect(response.body.weight).toBe(60);
  });

  it("should return 404 for invalid name", async () => {
    const response = await request(app).get("/pokemon/invalidname");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Pokemon not found");
  });

  it("should return Pokemon data for another valid name", async () => {
    const response = await request(app).get("/pokemon/charizard");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("charizard");
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("base_experience");
    expect(response.body).toHaveProperty("height");
    expect(response.body).toHaveProperty("weight");
  });

  it("should handle case-insensitive names", async () => {
    const response = await request(app).get("/pokemon/Pikachu");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("pikachu");
  });

  it("should return the correct data types for the properties", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(typeof response.body.id).toBe("number");
    expect(typeof response.body.base_experience).toBe("number");
    expect(typeof response.body.height).toBe("number");
    expect(typeof response.body.weight).toBe("number");
  });

  it("should return abilities in the correct format", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.abilities)).toBe(true);
    response.body.abilities.forEach((ability) => {
      expect(ability).toHaveProperty("ability");
      expect(ability.ability).toHaveProperty("name");
      expect(typeof ability.ability.name).toBe("string");
    });
  });

  it("should return types in the correct format", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.types)).toBe(true);
    response.body.types.forEach((type) => {
      expect(type).toHaveProperty("type");
      expect(type.type).toHaveProperty("name");
      expect(typeof type.type.name).toBe("string");
    });
  });

  it("should return moves in the correct format", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.moves)).toBe(true);
    response.body.moves.forEach((move) => {
      expect(move).toHaveProperty("move");
      expect(move.move).toHaveProperty("name");
      expect(typeof move.move.name).toBe("string");
    });
  });

  it("should return stats in the correct format", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.stats)).toBe(true);
    response.body.stats.forEach((stat) => {
      expect(stat).toHaveProperty("stat");
      expect(stat.stat).toHaveProperty("name");
      expect(typeof stat.stat.name).toBe("string");
      expect(stat).toHaveProperty("base_stat");
      expect(typeof stat.base_stat).toBe("number");
    });
  });

  it("should return held items in the correct format", async () => {
    const response = await request(app).get("/pokemon/pikachu");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.held_items)).toBe(true);
    response.body.held_items.forEach((item) => {
      expect(item).toHaveProperty("item");
      expect(item.item).toHaveProperty("name");
      expect(typeof item.item.name).toBe("string");
    });
  });
});

describe("POST /pokemon", () => {
  it("should create a new custom Pokemon", async () => {
    const newPokemon = {
      name: "bulbasaur",
      base_experience: 64,
      height: 7,
      weight: 69,
    };
    const response = await request(app).post("/pokemon").send(newPokemon);
    expect(response.status).toBe(201);
    expect(response.body).toEqual(newPokemon);
  });

  it("should return Pokemon data for valid name from customPokemons", async () => {
    const response = await request(app).get("/pokemon/bulbasaur");
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("bulbasaur");
    expect(response.body.base_experience).toBe(64);
    expect(response.body.height).toBe(7);
    expect(response.body.weight).toBe(69);
  });

  it("should return 400 for missing name", async () => {
    const newPokemon = { base_experience: 64, height: 7, weight: 69 };
    const response = await request(app).post("/pokemon").send(newPokemon);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Name is required");
  });

  it("should return 400 for invalid data types", async () => {
    const newPokemon = {
      name: "bulbasaur",
      base_experience: "sixty-four",
      height: 7,
      weight: 69,
    };
    const response = await request(app).post("/pokemon").send(newPokemon);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid data types");
  });

  it("should return 400 for duplicate Pokemon", async () => {
    const newPokemon = {
      name: "bisry",
      base_experience: 112,
      height: 4,
      weight: 60,
    };
    const response = await request(app).post("/pokemon").send(newPokemon);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Pokemon already exists");
  });
});

describe("PATCH /pokemon/:name", () => {
  it("should update an existing custom Pokemon", async () => {
    const updates = { base_experience: 80 };
    const response = await request(app)
      .patch("/pokemon/bulbasaur")
      .send(updates);
    expect(response.status).toBe(200);
    expect(response.body.base_experience).toBe(80);
  });

  it("should return 404 for non-existing Pokemon", async () => {
    const updates = { base_experience: 80 };
    const response = await request(app)
      .patch("/pokemon/nonexisting")
      .send(updates);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Pokemon not found");
  });

  it("should return 400 for invalid data types", async () => {
    const updates = { base_experience: "eighty" };
    const response = await request(app)
      .patch("/pokemon/bulbasaur")
      .send(updates);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid data types");
  });
});

describe("DELETE /pokemon/:name", () => {
  it("should delete an existing custom Pokemon", async () => {
    const response = await request(app).delete("/pokemon/bulbasaur");
    expect(response.status).toBe(204);
  });

  it("should return 404 for non-existing Pokemon", async () => {
    const response = await request(app).delete("/pokemon/nonexisting");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Pokemon not found");
  });
});
