import pg from "pg";
import twilio from "twilio";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: "us-east-1" });

async function getSecret(name) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const res = await ssm.send(cmd);
  return res.Parameter.Value;
}

let pool = null;
async function getPool() {
  if (pool) return pool;
  const host     = await getSecret("/bioalert/db/host");
  const user     = await getSecret("/bioalert/db/user");
  const password = await getSecret("/bioalert/db/password");
  const database = await getSecret("/bioalert/db/name");
  const port     = await getSecret("/bioalert/db/port");
  pool = new pg.Pool({
    host, user, password, database,
    port: parseInt(port),
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

async function query(text, params) {
  const p = await getPool();
  const res = await p.query(text, params);
  return res.rows;
}

async function getTwilio() {
  const accountSid = await getSecret("/bioalert/twilio/account_sid");
  const authToken  = await getSecret("/bioalert/twilio/auth_token");
  const from       = await getSecret("/bioalert/twilio/phone");
  return { client: twilio(accountSid, authToken), from };
}

export const handler = async () => {
  console.log("[US-05] Iniciando revisión de stock crítico");

  try {
    // 1. Consultar productos en stock crítico agrupados por admin
    const rows = await query(`
      SELECT
        i.product_id,
        i.school_id,
        i.current_stock,
        i.minimum_stock,
        p.name AS product_name,
        ca.phone_e164,
        ca.name AS admin_name
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      JOIN cafeteria_admins ca ON ca.school_id = i.school_id
      WHERE i.current_stock <= i.minimum_stock
    `);

    if (rows.length === 0) {
      console.log("[US-05] Sin productos en stock crítico. No se envían alertas.");
      return { ok: true, alerts: 0 };
    }

    // 2. Agrupar productos por admin (un mensaje por admin)
    const byAdmin = {};
    for (const row of rows) {
      const key = row.phone_e164;
      if (!byAdmin[key]) {
        byAdmin[key] = {
          admin_name: row.admin_name,
          phone: row.phone_e164,
          products: [],
        };
      }
      byAdmin[key].products.push({
        name: row.product_name,
        current: row.current_stock,
        minimum: row.minimum_stock,
      });
    }

    const { client, from } = await getTwilio();
    let sent = 0;

    // 3. Enviar un WhatsApp por admin con todos sus productos críticos
    for (const admin of Object.values(byAdmin)) {
      const productList = admin.products
        .map(p => `• ${p.name}: ${p.current} unidades (mínimo: ${p.minimum})`)
        .join("\n");

      const message =
`⚠️ *Alerta de Stock Crítico — BioAlert*

Hola ${admin.admin_name}, los siguientes productos están por debajo del stock mínimo:

${productList}

Por favor realiza el pedido a la brevedad.`;

      try {
        await client.messages.create({
          from: `whatsapp:${from}`,
          to: `whatsapp:${admin.phone}`,
          body: message,
        });
        console.log(`[US-05] Alerta enviada a ${admin.phone} con ${admin.products.length} productos`);
        sent++;
      } catch (twilioErr) {
        console.error(`[US-05] Error enviando a ${admin.phone}:`, twilioErr.message);
      }
    }

    console.log(`[US-05] Total admins notificados: ${sent}`);
    return { ok: true, alerts: sent };

  } catch (error) {
    console.error("[US-05] Error general:", error);
    return { ok: false, error: error.message };
  }
};