import { Router } from "express";
import { handleWhatsApp } from "../controllers/whatsappController.js";
import { checkAllergenAlert } from "../controllers/alertController.js";
import { query } from "../Services/dbService.js";

const router = Router();

router.post("/whatsapp", handleWhatsApp);
router.post("/alert-check", checkAllergenAlert);

export default router;