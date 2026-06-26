const express = require("express");
const router = express.Router();

const {
  trackPageView,
  trackScroll,
  trackClick,
  trackBounce,
  trackTimeOnPage,
  getSeoAnalytics,
  complaintUrl,
} = require("../controllers/seoAnalyticsController");
const {
  triggerSeoCompliance,
  getSeoCompliance,
} = require("../controllers/seoComplianceController");
const {
  triggerPerformance,
  getSeoPerformance,
} = require("../controllers/seoPerformanceController");
const verifyToken = require("../middleware/verifyToken");

// get the data
router.get("/analytics", verifyToken, getSeoAnalytics);
router.get("/complaints", verifyToken, getSeoCompliance);
router.get("/performance", verifyToken, getSeoPerformance);

// train the seo
// TEMP: disabled for low-RAM host (1GB box) — these are the ONLY endpoints that
// launch Chromium/Puppeteer and would OOM-kill the server. GET routes above still
// serve seed data, so the SEO pages stay viewable. Re-enable on the A1 (24GB) box.
// router.post("/trigger-complaint", verifyToken, triggerSeoCompliance);
// router.post("/trigger-performance", verifyToken, triggerPerformance);

// getting detils from users ,tracking routes
router.post("/pageview", trackPageView);
router.post("/scroll", trackScroll);
router.post("/click", trackClick);
router.post("/bounce", trackBounce);
router.post("/timeOnPage", trackTimeOnPage);
router.post("/complaint-url", complaintUrl);

module.exports = router;
