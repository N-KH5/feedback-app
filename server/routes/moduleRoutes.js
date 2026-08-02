const express = require("express");

const {
  createModule,
  getModules,
  getModuleById,
  updateModule,
  deleteModule,
} = require(
  "../controllers/moduleController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  authoriseRoles,
} = require(
  "../middleware/roleMiddleware"
);

const {
  uploadModuleMaterials,
} = require(
  "../middleware/uploadMiddleware"
);

const router =
  express.Router();

router.use(protect);

router.get(
  "/",
  authoriseRoles(
    "admin",
    "trainer"
  ),
  getModules
);

router.get(
  "/:id",
  authoriseRoles(
    "admin",
    "trainer"
  ),
  getModuleById
);

router.post(
  "/",
  authoriseRoles(
    "admin",
    "trainer"
  ),
  uploadModuleMaterials,
  createModule
);

router.put(
  "/:id",
  authoriseRoles(
    "admin",
    "trainer"
  ),
  uploadModuleMaterials,
  updateModule
);

router.delete(
  "/:id",
  authoriseRoles(
    "admin",
    "trainer"
  ),
  deleteModule
);

module.exports = router;