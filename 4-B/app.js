const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const path = require("path"); // Import path module
const app = express();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "task_collections",
  password: "root",
  port: 5432,
});

pool
  .connect()
  .then((client) => {
    console.log("Database connection successful");
    client.release(); // Release the client back to the pool
  })
  .catch((err) => {
    console.error("Database connection error:", err.stack);
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: "noname",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public/views")); // Set views path

// Middleware to add userId to res.locals
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Register
app.get("/register", (req, res) => {
  res.render("register", {
    layout: "layouts/layout",
    title: "B56 - Register",
  });
});

app.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await pool.query(
      "INSERT INTO users_tb (email, username, password) VALUES ($1, $2, $3)",
      [email, username, hashedPassword]
    );
    res.redirect("/login");
  } catch (err) {
    console.error("Error during registration:", err);
    res.render("register", {
      layout: "layouts/layout",
      title: "B56 - Register",
      error: "An error occurred during registration. Please try again.",
    });
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("login", {
    layout: "layouts/layout",
    title: "B56 - Login",
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users_tb WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user.id; // Ensure userId is set in session
      res.redirect("/collections");
    } else {
      res.redirect("/login");
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.redirect("/login");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/login");
  });
});

// Render Collection List
app.get("/collections", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const result = await pool.query(
      "SELECT collections_tb.*, users_tb.username FROM collections_tb JOIN users_tb ON collections_tb.user_id = users_tb.id"
    );
    res.render("collections", {
      collections: result.rows,
      userId: req.session.userId,
      layout: "layouts/layout",
      title: "B56 - Collections",
    });
  } catch (err) {
    console.error("Error fetching collections:", err);
    res.redirect("/collections");
  }
});

// Render Add/Edit Collection Form
app.get("/collections/new", (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.render("collections-form", {
    collection: null,
    layout: "layouts/layout",
    title: "B56 - Add Collections",
  });
});

app.get("/collections/edit/:id", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const result = await pool.query(
      "SELECT * FROM collections_tb WHERE id = $1 AND user_id = $2",
      [req.params.id, req.session.userId]
    );
    if (result.rows.length === 0) return res.redirect("/collections");
    res.render("collections-form", {
      collection: result.rows[0],
      layout: "layouts/layout",
      title: "B56 - Update Collections",
    });
  } catch (err) {
    console.error("Error fetching collection for edit:", err);
    res.redirect("/collections");
  }
});

// Handle Add/Edit Collection
app.post("/collections/new", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const { name } = req.body;
  try {
    await pool.query(
      "INSERT INTO collections_tb (name, user_id) VALUES ($1, $2)",
      [name, req.session.userId]
    );
    res.redirect("/collections");
  } catch (err) {
    console.error("Error adding collection:", err);
    res.redirect("/collections/new");
  }
});

app.post("/collections/edit", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const { id, name } = req.body;
  try {
    await pool.query(
      "UPDATE collections_tb SET name = $1 WHERE id = $2 AND user_id = $3",
      [name, id, req.session.userId]
    );
    res.redirect("/collections");
  } catch (err) {
    console.error("Error editing collection:", err);
    res.redirect("/collections/edit/" + id);
  }
});

// Handle Delete Collection
app.post("/collections/delete", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const { id } = req.body;
  try {
    await pool.query(
      "DELETE FROM collections_tb WHERE id = $1 AND user_id = $2",
      [id, req.session.userId]
    );
    res.redirect("/collections");
  } catch (err) {
    console.error("Error deleting collection:", err);
    res.redirect("/collections");
  }
});

// Render tasks based on collection
app.get("/tasks/:collectionId", async (req, res) => {
  const collectionId = parseInt(req.params.collectionId, 10); // Pastikan collectionId adalah integer
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (isNaN(collectionId)) {
    return res.redirect("/collections"); // Redirect jika collectionId tidak valid
  }

  try {
    const result = await pool.query(
      "SELECT * FROM task_tb WHERE collections_id = $1",
      [collectionId]
    );
    const collectionName = (
      await pool.query("SELECT name FROM collections_tb WHERE id = $1", [
        collectionId,
      ])
    ).rows[0]?.name;
    res.render("tasks", {
      tasks: result.rows,
      collectionName: collectionName,
      collectionId: collectionId,
      layout: "layouts/layout",
      title: "B56 - Tasks",
    });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.redirect("/collections");
  }
});

// Render Add/Edit Task Form
app.get("/task-form", (req, res) => {
  // Ambil collection_id dari parameter
  const collectionId = parseInt(req.query.collection_id, 10);

  // Cek apakah sudah login?
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  // Cek apakah collection_id valid ?
  if (isNaN(collectionId)) {
    return res.redirect("/collections");
  }

  // Cetak Error
  const error = req.query.error || null;

  res.render("task-form", {
    task: null,
    collectionId: collectionId,
    error: error,
    layout: "layouts/layout",
    title: "B56 - Add Tasks",
  });
});

// Handle Add Task
app.post("/task-form", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const { name, collection_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO task_tb (name, is_done, collections_id) VALUES ($1, false, $2)",
      [name, collection_id]
    );
    res.redirect(`/tasks/${collection_id}`);
  } catch (err) {
    console.error("Error adding task:", err);
    res.redirect(`/task-form?collection_id=${collection_id}`);
  }
});

// Edit
// app.get("/tasks/edit/:id", async (req, res) => {
//   const { id } = req.params;
//   try {
//     const result = await pool.query("SELECT * FROM task_tb WHERE id = $1", [
//       id,
//     ]);
//     const task = result.rows[0];
//     if (!task) return res.redirect("/collections");
//     res.render("task-form", {
//       task: task,
//       collectionId: task.collections_id,
//       layout: "layouts/layout",
//     });
//   } catch (err) {
//     console.error("Error fetching task for edit:", err);
//     res.redirect("/collections");
//   }
// });

// app.post("/tasks/edit", async (req, res) => {
//   if (!req.session.userId) return res.redirect("/login");
//   const { id, name } = req.body;
//   try {
//     await pool.query("UPDATE task_tb SET name = $1 WHERE id = $2", [name, id]);
//     const taskResult = await pool.query(
//       "SELECT collections_id FROM task_tb WHERE id = $1",
//       [id]
//     );
//     res.redirect(`/tasks/${taskResult.rows[0].collections_id}`);
//   } catch (err) {
//     console.error("Error editing task:", err);
//     res.redirect(`/tasks/edit/${id}`);
//   }
// });

// Handle Delete Task
app.post("/tasks/delete", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const { id } = req.body;
  try {
    const taskResult = await pool.query(
      "SELECT collections_id FROM task_tb WHERE id = $1",
      [id]
    );
    await pool.query("DELETE FROM task_tb WHERE id = $1", [id]);
    res.redirect(`/tasks/${taskResult.rows[0].collections_id}`);
  } catch (err) {
    console.error("Error deleting task:", err);
    res.redirect("/collections");
  }
});

// Handle Toggle Task Status
app.post("/tasks/update", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  const { id, is_done } = req.body;
  try {
    await pool.query("UPDATE task_tb SET is_done = $1 WHERE id = $2", [
      is_done === "true",
      id,
    ]);
    const taskResult = await pool.query(
      "SELECT collections_id FROM task_tb WHERE id = $1",
      [id]
    );
    res.redirect(`/tasks/${taskResult.rows[0].collections_id}`);
  } catch (err) {
    console.error("Error updating task status:", err);
    res.redirect("/collections");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
