import twilio from "twilio";
import { query } from "../Services/dbService.js";
import { processChat, summarizeResults } from "../Services/aiService.js";
import { SYSTEM_PROMPTS } from "../Services/promptService.js";
import { getSession, saveSession } from "../Services/sessionService.js";
import { sendWhatsApp } from "../Services/twilioService.js";

export async function handleWhatsApp(req, res) {
  const { From, Body } = req.body;

  if (!From || !Body) return res.status(400).send("Bad Request");

  const phone = From.replace("whatsapp:", "");
  const userMessage = Body.trim();

  try {
    const parentRows = await query(
      "SELECT * FROM parents WHERE phone_e164 = $1", [phone]
    );

    if (parentRows.length === 0) {
      return sendTwiML(res, SYSTEM_PROMPTS.NOT_FOUND);
    }

    const parent = parentRows[0];
    const childRows = await query(
      "SELECT student_id FROM parent_phone_map WHERE phone_e164 = $1", [phone]
    );

    const userData = {
      role: "parent",
      name: parent.name,
      phone,
      student_ids: childRows.map((r) => r.student_id),
    };

    const history = await getSession(phone);

    const aiAction = await processChat(
      userMessage, SYSTEM_PROMPTS.PARENT, userData, history
    );

    let finalMessage = "";

    if (aiAction.type === "SQL") {
      const cleanSQL = aiAction.query
        .replace(/__(\d+)__/g, '$1')
        .replace(/```sql/gi, '')
        .replace(/```/g, '')
        .trim();
      console.log("[SQL GENERADO]", cleanSQL);
      const results = await query(cleanSQL);
      finalMessage = await summarizeResults(userMessage, results, SYSTEM_PROMPTS.PARENT, history);
    } else {
      finalMessage = aiAction.content;
    }

    const updatedHistory = [
      ...history,
      { user: userMessage, assistant: finalMessage },
    ].slice(-10);

    await saveSession(phone, updatedHistory);
    return sendTwiML(res, finalMessage);

  } catch (error) {
    console.error("[BioAlert Error]", error);
    return sendTwiML(res, "Lo siento, tuve un problema al procesar tu consulta. Por favor intenta de nuevo.");
  }
}

function sendTwiML(res, message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  res.type("text/xml").send(twiml.toString());
}