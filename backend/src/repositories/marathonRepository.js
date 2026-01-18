const path = require("path");
const { readJson, writeJson, nextId } = require("./jsonStore");

const storePath =
  process.env.MARATHON_JSON_PATH ||
  path.join(__dirname, "..", "data", "marathons.json");

async function readStore() {
  return readJson(storePath, { marathons: [] });
}

async function writeStore(data) {
  await writeJson(storePath, data);
}

async function getAllMarathons(includeCancelled = false) {
  const store = await readStore();
  const list = includeCancelled
    ? store.marathons
    : store.marathons.filter((m) => m.Status === "Active");
  return [...list].sort((a, b) => new Date(a.RaceDate) - new Date(b.RaceDate));
}

async function cancelMarathon(id) {
  const store = await readStore();
  const idx = store.marathons.findIndex(
    (m) => Number(m.MarathonID) === Number(id),
  );
  if (idx === -1) return null;
  store.marathons[idx] = { ...store.marathons[idx], Status: "Cancelled" };
  await writeStore(store);
  return store.marathons[idx];
}

async function getMarathonById(id) {
  const store = await readStore();
  return (
    store.marathons.find((m) => Number(m.MarathonID) === Number(id)) || null
  );
}

async function createMarathon({ raceName, raceDate }) {
  const store = await readStore();
  const marathon = {
    MarathonID: nextId(store.marathons, "MarathonID"),
    RaceName: raceName,
    RaceDate: raceDate,
    Status: "Active",
  };
  store.marathons.push(marathon);
  await writeStore(store);
  return marathon;
}

async function updateMarathon(id, { raceName, raceDate, status }) {
  const store = await readStore();
  const idx = store.marathons.findIndex(
    (m) => Number(m.MarathonID) === Number(id),
  );
  if (idx === -1) return null;
  const current = store.marathons[idx];
  const next = {
    ...current,
    RaceName: raceName !== undefined ? raceName : current.RaceName,
    RaceDate: raceDate !== undefined ? raceDate : current.RaceDate,
    Status: status !== undefined ? status : current.Status,
  };
  store.marathons[idx] = next;
  await writeStore(store);
  return next;
}

async function deleteMarathon(id) {
  const store = await readStore();
  const before = store.marathons.length;
  store.marathons = store.marathons.filter(
    (m) => Number(m.MarathonID) !== Number(id),
  );
  await writeStore(store);
  return before !== store.marathons.length;
}

module.exports = {
  getAllMarathons,
  getMarathonById,
  createMarathon,
  updateMarathon,
  deleteMarathon,
  cancelMarathon,
};
