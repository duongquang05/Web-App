const fs = require("fs/promises");
const path = require("path");

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function readJson(filePath, defaultValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      if (defaultValue === undefined) throw err;
      await writeJson(filePath, defaultValue);
      return defaultValue;
    }
    throw err;
  }
}

function nextId(list, key) {
  return list.reduce((max, item) => Math.max(max, item[key] || 0), 0) + 1;
}

module.exports = {
  readJson,
  writeJson,
  nextId,
};
