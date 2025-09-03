import express from "express";

const app = express();
app.get("/", (_, res) => res.send("Hello from Express + TS!"));
app.listen(4000, () => console.log("Server running at http://localhost:4000"));
