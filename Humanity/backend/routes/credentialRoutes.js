import express from "express";
import {
  issueCredentialController,
  checkVerificationController,
  revokeCredentialController,
  getCredentialDetailsController,
  verifyCredentialController,
} from "../controllers/credentials.js";

const router = express.Router();

router.post("/issue-credential", issueCredentialController);
router.post("/check-verification", checkVerificationController);
router.post("/revoke-credential", revokeCredentialController);
router.post("/credential-details", getCredentialDetailsController);

// New route that verifies by address + credentialType
router.post("/verify-credential", verifyCredentialController);

export default router;
