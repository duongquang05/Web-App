const fs = require("fs/promises");
const path = require("path");

const storePath =
  process.env.USER_JSON_PATH ||
  path.join(__dirname, "..", "data", "users.json");

// Log once for debugging deployments to ensure the store file is where we expect
console.log("[userJsonRepository] storePath=", storePath);

async function readStore() {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      const empty = { users: [] };
      await writeStore(empty);
      return empty;
    }
    throw err;
  }
}

async function writeStore(data) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

function nextId(users) {
  return users.reduce((max, user) => Math.max(max, user.UserID || 0), 0) + 1;
}

function clone(user) {
  return user ? { ...user } : null;
}

async function findByEmail(email) {
  const store = await readStore();
  const user = store.users.find(
    (u) => u.Email && u.Email.toLowerCase() === String(email).toLowerCase(),
  );
  return clone(user);
}

async function findByPassportNo(passportNo) {
  if (!passportNo) return null;
  const store = await readStore();
  const user = store.users.find(
    (u) =>
      u.PassportNo &&
      u.PassportNo.toLowerCase() === String(passportNo).toLowerCase(),
  );
  return clone(user);
}

async function findByMobile(mobile) {
  if (!mobile) return null;
  const store = await readStore();
  const user = store.users.find(
    (u) => u.Mobile && u.Mobile.toLowerCase() === String(mobile).toLowerCase(),
  );
  return clone(user);
}

async function findById(userId) {
  const store = await readStore();
  const user = store.users.find((u) => Number(u.UserID) === Number(userId));
  return clone(user);
}

async function createParticipant({
  fullName,
  email,
  passwordHash,
  nationality,
  sex,
  birthYear,
  passportNo,
  mobile,
  currentAddress,
}) {
  const store = await readStore();
  const newUser = {
    UserID: nextId(store.users),
    FullName: fullName,
    Email: email,
    PasswordHash: passwordHash,
    CurrentAddress: currentAddress || null,
    Nationality: nationality || "PARTICIPANT",
    Sex: sex || null,
    BirthYear: birthYear ?? null,
    PassportNo: passportNo || null,
    Mobile: mobile || null,
    BestRecord: null,
  };

  store.users.push(newUser);
  await writeStore(store);
  return clone(newUser);
}

async function updateProfile(userId, update) {
  const store = await readStore();
  const index = store.users.findIndex(
    (u) => Number(u.UserID) === Number(userId),
  );
  if (index === -1) return null;

  const user = store.users[index];
  const next = { ...user, ...update };
  store.users[index] = next;
  await writeStore(store);
  return clone(next);
}

async function updateParticipant(userId, update) {
  return updateProfile(userId, update);
}

async function deleteParticipant(userId) {
  const store = await readStore();
  const nextUsers = store.users.filter(
    (u) => Number(u.UserID) !== Number(userId),
  );
  if (nextUsers.length === store.users.length) return; // nothing to remove
  store.users = nextUsers;
  await writeStore(store);
}

async function createAdminIfNotExists({ fullName, email, passwordHash }) {
  const existing = await findByEmail(email);
  if (existing) return existing;

  const store = await readStore();
  const newUser = {
    UserID: nextId(store.users),
    FullName: fullName,
    Email: email,
    PasswordHash: passwordHash,
    CurrentAddress: null,
    Nationality: "ADMIN",
    Sex: null,
    BirthYear: null,
    PassportNo: null,
    Mobile: null,
    BestRecord: null,
  };

  store.users.push(newUser);
  await writeStore(store);
  return clone(newUser);
}

module.exports = {
  findByEmail,
  findById,
  findByPassportNo,
  findByMobile,
  createParticipant,
  updateProfile,
  updateParticipant,
  deleteParticipant,
  createAdminIfNotExists,
};
