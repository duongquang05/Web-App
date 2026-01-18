const path = require("path");
const { readJson, writeJson } = require("./jsonStore");
const marathonRepository = require("./marathonRepository");
const userRepository = require("./userRepository");

const storePath =
  process.env.PARTICIPATION_JSON_PATH ||
  path.join(__dirname, "..", "data", "participations.json");

async function readStore() {
  return readJson(storePath, { participations: [] });
}

async function writeStore(data) {
  await writeJson(storePath, data);
}

function normalizeTime(timeRecord) {
  if (timeRecord == null) return null;
  const timeRegex = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/;
  const match = String(timeRecord).trim().match(timeRegex);
  if (!match) {
    throw new Error("Invalid time format. Use HH:MM:SS or HH:MM");
  }
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[4] ? parseInt(match[4], 10) : 0;
  if (hours < 0 || hours > 23)
    throw new Error("Hours must be between 0 and 23");
  if (minutes < 0 || minutes > 59)
    throw new Error("Minutes must be between 0 and 59");
  if (seconds < 0 || seconds > 59)
    throw new Error("Seconds must be between 0 and 59");
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function createParticipation({ marathonId, userId, hotel = null }) {
  const store = await readStore();
  const exists = store.participations.some(
    (p) =>
      Number(p.MarathonID) === Number(marathonId) &&
      Number(p.UserID) === Number(userId),
  );
  if (exists) return; // align with current controller check

  store.participations.push({
    MarathonID: Number(marathonId),
    UserID: Number(userId),
    EntryNumber: -Number(userId),
    Hotel: hotel || null,
    TimeRecord: null,
    Standings: null,
  });
  await writeStore(store);
}

async function getParticipation(marathonId, userId) {
  const store = await readStore();
  return (
    store.participations.find(
      (p) =>
        Number(p.MarathonID) === Number(marathonId) &&
        Number(p.UserID) === Number(userId),
    ) || null
  );
}

async function getMyParticipations(userId) {
  const store = await readStore();
  const marathons = await marathonRepository.getAllMarathons(true);
  return store.participations
    .filter((p) => Number(p.UserID) === Number(userId))
    .map((p) => {
      const marathon = marathons.find(
        (m) => Number(m.MarathonID) === Number(p.MarathonID),
      );
      return {
        ...p,
        RaceName: marathon?.RaceName,
        RaceDate: marathon?.RaceDate,
        Status: marathon?.Status,
        EntryNumberDisplay:
          p.EntryNumber <= 0 ? "Pending" : String(p.EntryNumber),
      };
    })
    .sort((a, b) => new Date(a.RaceDate || 0) - new Date(b.RaceDate || 0));
}

async function cancelParticipation(marathonId, userId) {
  const store = await readStore();
  store.participations = store.participations.filter(
    (p) =>
      !(
        Number(p.MarathonID) === Number(marathonId) &&
        Number(p.UserID) === Number(userId)
      ),
  );
  await writeStore(store);
}

async function deleteAllParticipationsWithoutResults(userId) {
  const store = await readStore();
  const before = store.participations.length;
  store.participations = store.participations.filter(
    (p) =>
      Number(p.UserID) !== Number(userId) ||
      (p.TimeRecord !== null && p.Standings !== null),
  );
  await writeStore(store);
  return before - store.participations.length;
}

async function getAllParticipations() {
  const store = await readStore();
  const marathons = await marathonRepository.getAllMarathons(true);
  const users = await readJson(
    process.env.USER_JSON_PATH ||
      path.join(__dirname, "..", "data", "users.json"),
    { users: [] },
  );

  return store.participations
    .map((p) => {
      const marathon = marathons.find(
        (m) => Number(m.MarathonID) === Number(p.MarathonID),
      );
      const user = users.users.find(
        (u) => Number(u.UserID) === Number(p.UserID),
      );
      return {
        ...p,
        RaceName: marathon?.RaceName,
        RaceDate: marathon?.RaceDate,
        Status: marathon?.Status,
        FullName: user?.FullName,
        Email: user?.Email,
        EntryNumberDisplay:
          p.EntryNumber <= 0 ? "Pending" : String(p.EntryNumber),
      };
    })
    .sort((a, b) => {
      const byDate = new Date(a.RaceDate || 0) - new Date(b.RaceDate || 0);
      if (byDate !== 0) return byDate;
      const aEntry = a.EntryNumber <= 0 ? 999999 : a.EntryNumber;
      const bEntry = b.EntryNumber <= 0 ? 999999 : b.EntryNumber;
      return aEntry - bEntry;
    });
}

async function hasParticipations(userId) {
  const store = await readStore();
  return store.participations.some((p) => Number(p.UserID) === Number(userId));
}

async function hasResults(userId) {
  const store = await readStore();
  return store.participations.some(
    (p) =>
      Number(p.UserID) === Number(userId) &&
      p.TimeRecord !== null &&
      p.Standings !== null,
  );
}

async function acceptParticipation(marathonId, userId, entryNumber = null) {
  const store = await readStore();
  const idx = store.participations.findIndex(
    (p) =>
      Number(p.MarathonID) === Number(marathonId) &&
      Number(p.UserID) === Number(userId),
  );
  if (idx === -1) return null;

  let finalEntryNumber;
  if (entryNumber !== null && entryNumber !== undefined) {
    finalEntryNumber = parseInt(entryNumber, 10);
    if (Number.isNaN(finalEntryNumber) || finalEntryNumber <= 0) {
      throw new Error("Entry number must be a positive integer");
    }
    const exists = store.participations.some(
      (p) =>
        Number(p.MarathonID) === Number(marathonId) &&
        Number(p.EntryNumber) === Number(finalEntryNumber) &&
        Number(p.UserID) !== Number(userId),
    );
    if (exists) {
      throw new Error(
        `Entry number ${finalEntryNumber} already exists for this marathon`,
      );
    }
  } else {
    const max = store.participations
      .filter(
        (p) =>
          Number(p.MarathonID) === Number(marathonId) &&
          Number(p.EntryNumber) > 0,
      )
      .reduce((m, p) => Math.max(m, Number(p.EntryNumber) || 0), 0);
    finalEntryNumber = max + 1;
  }

  store.participations[idx] = {
    ...store.participations[idx],
    EntryNumber: finalEntryNumber,
  };
  await writeStore(store);
  return finalEntryNumber;
}

async function setResult(marathonId, userId, { timeRecord, standings }) {
  const store = await readStore();
  const idx = store.participations.findIndex(
    (p) =>
      Number(p.MarathonID) === Number(marathonId) &&
      Number(p.UserID) === Number(userId),
  );
  if (idx === -1) return null;

  const normalizedTime = normalizeTime(timeRecord);
  const parsedStandings = parseInt(standings, 10);
  if (Number.isNaN(parsedStandings)) {
    throw new Error("Standings must be a number");
  }

  store.participations[idx] = {
    ...store.participations[idx],
    TimeRecord: normalizedTime,
    Standings: parsedStandings,
  };
  await writeStore(store);
}

module.exports = {
  createParticipation,
  getParticipation,
  getMyParticipations,
  cancelParticipation,
  getAllParticipations,
  acceptParticipation,
  setResult,
  hasParticipations,
  hasResults,
  deleteAllParticipationsWithoutResults,
};
