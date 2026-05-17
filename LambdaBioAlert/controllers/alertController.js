import { sendWhatsApp } from "../Services/twilioService.js";
import { query } from "../Services/dbService.js";

export async function checkAllergenAlert(req, res) {
  const { student_id, product_id, transaction_date } = req.body;

  if (!student_id || !product_id || !transaction_date) {
    return res.status(400).json({ ok: false, error: "Faltan campos requeridos" });
  }

  try {
    const allergenMatch = await query(
      `SELECT 
        a.name AS allergen_name,
        p.name AS product_name,
        s.name AS student_name
       FROM product_allergens pa
       JOIN student_allergens sa ON sa.allergen_id = pa.allergen_id
       JOIN allergens a ON a.id = pa.allergen_id
       JOIN products p ON p.id = pa.product_id
       JOIN students s ON s.id = sa.student_id
       WHERE pa.product_id = $1 AND sa.student_id = $2`,
      [product_id, student_id]
    );

    if (allergenMatch.length === 0) {
      console.log(`[ALERT] Sin coincidencia para student=${student_id} product=${product_id}`);
      return res.json({ ok: true, alert: false, message: "Sin alérgenos detectados" });
    }

    const parentRows = await query(
      `SELECT p.phone_e164, p.name AS parent_name
       FROM parents p
       JOIN student_parents sp ON sp.parent_id = p.id
       WHERE sp.student_id = $1`,
      [student_id]
    );

    if (parentRows.length === 0) {
      return res.json({ ok: true, alert: true, message: "Alérgeno detectado pero sin padre registrado" });
    }

    const hora = new Date(transaction_date).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Bogota",
    });

    const alertas = [];
    for (const parent of parentRows) {
      const { allergen_name, product_name, student_name } = allergenMatch[0];

      const message =
`⚠️ *Alerta de alérgeno — BioAlert*

Hola ${parent.parent_name}, se detectó que *${student_name}* consumió un producto con *${allergen_name}*.

🛒 Producto: ${product_name}
🕐 Hora: ${hora}

Por favor verifica el estado de tu hijo/a.`;

      await sendWhatsApp(parent.phone_e164, message);
      alertas.push(parent.phone_e164);
      console.log(`[ALERT] Notificación enviada a ${parent.phone_e164}`);
    }

    return res.json({
      ok: true,
      alert: true,
      allergen: allergenMatch[0].allergen_name,
      product: allergenMatch[0].product_name,
      notified: alertas,
    });

  } catch (error) {
    console.error("[ALERT Error]", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}