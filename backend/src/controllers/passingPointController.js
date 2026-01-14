const passingPointRepository = require('../repositories/passingPointRepository');

async function getAllPassingPoints(req, res, next) {
  try {
    const points = await passingPointRepository.getAllPassingPoints();
    res.json({ success: true, data: points });
  } catch (err) {
    next(err);
  }
}

async function getPassingPointById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid point id' });
    }
    const point = await passingPointRepository.getPassingPointById(id);
    if (!point) {
      return res.status(404).json({ success: false, message: 'Passing point not found' });
    }
    res.json({ success: true, data: point });
  } catch (err) {
    next(err);
  }
}

async function createPassingPoint(req, res, next) {
  try {
    const { pointName, description, distanceFromStart, location, photoPath, thumbnailPath, displayOrder } = req.body;
    if (!pointName) {
      return res.status(400).json({ success: false, message: 'pointName is required' });
    }
    const point = await passingPointRepository.createPassingPoint({
      pointName,
      description,
      distanceFromStart,
      location,
      photoPath,
      thumbnailPath,
      displayOrder,
    });
    res.status(201).json({ success: true, data: point });
  } catch (err) {
    next(err);
  }
}

async function updatePassingPoint(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid point id' });
    }
    const point = await passingPointRepository.updatePassingPoint(id, req.body);
    res.json({ success: true, data: point });
  } catch (err) {
    next(err);
  }
}

async function deletePassingPoint(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid point id' });
    }
    await passingPointRepository.deletePassingPoint(id);
    res.json({ success: true, message: 'Passing point deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPassingPoints,
  getPassingPointById,
  createPassingPoint,
  updatePassingPoint,
  deletePassingPoint,
};

