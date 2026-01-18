const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/role");
const participantController = require("../controllers/participantController");

// Public health check under /api/health (router is mounted at /api)
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// All participant routes require auth & PARTICIPANT role
router.use(auth, requireRole("PARTICIPANT", "ADMIN"));

router.get("/me", participantController.getMe);
router.put("/me", participantController.updateMe);
router.get("/marathons", participantController.listMarathons);
router.post("/participations", participantController.registerMarathon);
router.get("/participations/my", participantController.myParticipations);
router.post(
  "/participations/:id/cancel",
  participantController.cancelParticipation,
);

module.exports = router;
