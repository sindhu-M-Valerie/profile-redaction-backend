const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Use MongoDB Atlas or local MongoDB for production.
// In Codespaces, you can use the included MongoDB connection string.
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/redactionDemo";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserRedaction = mongoose.model("UserRedaction", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  redacted: { type: Boolean, required: true }
}));

const app = express();
app.use(cors());
app.use(bodyParser.json());

const STAFF_TOKEN = process.env.STAFF_TOKEN || "super-secret-token";
function requireStaff(req, res, next) {
  if (req.headers.authorization === `Bearer ${STAFF_TOKEN}`) {
    return next();
  }
  res.status(403).json({ error: "Forbidden" });
}

app.get("/api/redacted/:username", async (req, res) => {
  const username = req.params.username.toLowerCase();
  const entry = await UserRedaction.findOne({ username });
  res.json({ redacted: entry ? entry.redacted : false });
});

app.post("/api/redacted/:username", requireStaff, async (req, res) => {
  const username = req.params.username.toLowerCase();
  const { redacted } = req.body;
  const entry = await UserRedaction.findOneAndUpdate(
    { username },
    { redacted: !!redacted },
    { new: true, upsert: true }
  );
  res.json({ redacted: entry.redacted });
});

app.get("/api/redacted", requireStaff, async (req, res) => {
  const entries = await UserRedaction.find({ redacted: true });
  res.json(entries.map(e => e.username));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Redaction API running on port ${PORT}`));
