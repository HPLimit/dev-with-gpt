import express from "express";
import { migrateAll } from "@db/migrations/index.js";

const app = express();

const bootstrap = async () => {
    await migrateAll();

    // Routes
    app.get("/", (_, res) => res.send("Hello from CDPP backend 🚀"));

    app.listen(4000, () => {
        console.log("✅ Server is running at http://localhost:4000");
    });
};

bootstrap().then().catch((err) => {
    console.error("❌ Failed to start the server:", err);
});
