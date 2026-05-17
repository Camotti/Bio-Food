import twilio from "twilio";
import { getSecret } from "./ssmService.js";

let client = null;
let fromPhone = null;

export async function getTwilioClient() {
  if (!client) {
    const accountSid = await getSecret("/bioalert/twilio/account_sid");
    const authToken = await getSecret("/bioalert/twilio/auth_token");
    fromPhone = await getSecret("/bioalert/twilio/phone");
    client = twilio(accountSid, authToken);
  }
  return { client, fromPhone };
}

export async function sendWhatsApp(toPhone, message) {
  const { client, fromPhone } = await getTwilioClient();
  await client.messages.create({
    from: `whatsapp:${fromPhone}`,
    to: `whatsapp:${toPhone}`,
    body: message,
  });
}