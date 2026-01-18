const app = require("./app");
require("dotenv").config();

// Default to 3000 to match common frontend configs; override with PORT env
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
