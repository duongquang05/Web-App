const path = require("path");
const { readJson, writeJson, nextId } = require("./jsonStore");

const storePath =
  process.env.PASSINGPOINT_JSON_PATH ||
  path.join(__dirname, "..", "data", "passingPoints.json");

async function readStore() {
  return readJson(storePath, { points: [] });
}

async function writeStore(data) {
  await writeJson(storePath, data);
}

async function getAllPassingPoints() {
  const store = await readStore();
  return [...store.points].sort(
    (a, b) =>
      (a.DisplayOrder || 0) - (b.DisplayOrder || 0) || a.PointID - b.PointID,
  );
}

async function getPassingPointById(id) {
  const store = await readStore();
  return store.points.find((p) => Number(p.PointID) === Number(id)) || null;
}

async function createPassingPoint({
  pointName,
  description,
  distanceFromStart,
  location,
  photoPath,
  thumbnailPath,
  displayOrder,
}) {
  const store = await readStore();
  const point = {
    PointID: nextId(store.points, "PointID"),
    PointName: pointName,
    Description: description || null,
    DistanceFromStart: distanceFromStart || null,
    Location: location || null,
    PhotoPath: photoPath || null,
    ThumbnailPath: thumbnailPath || null,
    DisplayOrder: displayOrder || 0,
  };
  store.points.push(point);
  await writeStore(store);
  return point;
}

async function updatePassingPoint(
  id,
  {
    pointName,
    description,
    distanceFromStart,
    location,
    photoPath,
    thumbnailPath,
    displayOrder,
  },
) {
  const store = await readStore();
  const idx = store.points.findIndex((p) => Number(p.PointID) === Number(id));
  if (idx === -1) return null;
  const current = store.points[idx];
  const next = {
    ...current,
    PointName: pointName !== undefined ? pointName : current.PointName,
    Description: description !== undefined ? description : current.Description,
    DistanceFromStart:
      distanceFromStart !== undefined
        ? distanceFromStart
        : current.DistanceFromStart,
    Location: location !== undefined ? location : current.Location,
    PhotoPath: photoPath !== undefined ? photoPath : current.PhotoPath,
    ThumbnailPath:
      thumbnailPath !== undefined ? thumbnailPath : current.ThumbnailPath,
    DisplayOrder:
      displayOrder !== undefined ? displayOrder : current.DisplayOrder,
  };
  store.points[idx] = next;
  await writeStore(store);
  return next;
}

async function deletePassingPoint(id) {
  const store = await readStore();
  store.points = store.points.filter((p) => Number(p.PointID) !== Number(id));
  await writeStore(store);
}

module.exports = {
  getAllPassingPoints,
  getPassingPointById,
  createPassingPoint,
  updatePassingPoint,
  deletePassingPoint,
};
