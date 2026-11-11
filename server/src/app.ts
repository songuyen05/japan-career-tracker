import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "./config/db.js";
import authRouter from "./routes/auth.js";
import applicationsRouter from "./routes/applications.js";

const app = express();

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is missing from environment variables");
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const PgSession = connectPgSimple(session);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
    }),
    name: "jct.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Japan Career Tracker API is running!",
  });
});

app.get("/api/db-test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "connected",
      message: "PostgreSQL connection successful!",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

export default app;