import pg from "pg";
import twilio from "twilio";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: "us-east-1" });

async function getSecret(name) {
  console.log("[SSM] region:", process.env.AWS_REGION, "buscando:", name);
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
  console.log("[US-02] Iniciando verificación de ausencia de consumo");

  try {
    // 1. Estudiantes activos que NO han comprado nada hoy
    const studentsWithoutPurchase = await query(`
      SELECT DISTINCT s.id AS student_id, s.name AS student_name, s.balance
      FROM students s
      WHERE s.id NOT IN (
        SELECT DISTINCT student_id
        FROM transactions
        WHERE created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day'
      )
    `);

    console.log(`[US-02] Estudiantes sin consumo hoy: ${studentsWithoutPurchase.length}`);

    if (studentsWithoutPurchase.length === 0) {
      console.log("[US-02] Todos los estudiantes consumieron hoy. Sin alertas.");
      return { ok: true, alerts: 0 };
    }

    const { client, from } = await getTwilio();
    let sent = 0;

    for (const student of studentsWithoutPurchase) {
      // 2. Buscar padre registrado
      const parents = await query(`
        SELECT p.phone_e164, p.name AS parent_name
        FROM parents p
        JOIN student_parents sp ON sp.parent_id = p.id
        WHERE sp.student_id = $1
      `, [student.student_id]);

      if (parents.length === 0) {
        console.log(`[US-02] Sin padre para student=${student.student_id}`);
        continue;
      }

      for (const parent of parents) {
        const saldoInfo = student.balance <= 0
          ? "⚠️ Además, su saldo es $0 o insuficiente."
          : `Su saldo actual es $${Number(student.balance).toLocaleString("es-CO")} COP.`;

        const message =
`🔔 *Alerta BioAlert — Sin consumo registrado*

Hola ${parent.parent_name}, notamos que *${student.student_name}* no ha registrado ninguna compra en la cafetería esta mañana.

${saldoInfo}

Si todo está bien, puedes ignorar este mensaje. Si tienes dudas, comunícate con el colegio.`;

        try {
          await client.messages.create({
            from: `whatsapp:${from}`,
            to: `whatsapp:${parent.phone_e164}`,
            body: message,
          });
          console.log(`[US-02] Alerta enviada a ${parent.phone_e164} por ${student.student_name}`);
          sent++;
        } catch (twilioErr) {
          console.error(`[US-02] Error enviando a ${parent.phone_e164}:`, twilioErr.message);
        }
      }
    }

    console.log(`[US-02] Total alertas enviadas: ${sent}`);
    return { ok: true, alerts: sent };

  } catch (error) {
    console.error("[US-02] Error general:", error);
    return { ok: false, error: error.message };
  }
};