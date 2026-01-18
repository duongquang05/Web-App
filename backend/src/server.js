const app = require("./app");
require("dotenv").config();

// Default to 3000 to match common frontend configs; override with PORT env
const PORT = process.env.PORT || 3000;

console.log("[startup] mode=json-only");
console.log("[startup] PORT=", PORT);
if (process.env.USER_JSON_PATH) {
  console.log("[startup] USER_JSON_PATH=", process.env.USER_JSON_PATH);
}

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
