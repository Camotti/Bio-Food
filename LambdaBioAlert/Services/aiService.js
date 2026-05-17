import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

async function invokeModel(prompt) {
  const body = JSON.stringify({
    prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`,
    max_gen_len: 1024,
    temperature: 0.3,
  });

  const command = new InvokeModelCommand({
    modelId: "meta.llama3-8b-instruct-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body,
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.generation.trim();
}

export async function processChat(userMessage, systemPrompt, userData, history = []) {
  const historyText = history
    .map((h) => `Usuario: ${h.user}\nAsistente: ${h.assistant}`)
    .join("\n\n");

  const prompt = `
${systemPrompt}

DATOS DEL USUARIO AUTENTICADO: ${JSON.stringify(userData)}

${historyText ? `CONVERSACIÓN ANTERIOR:\n${historyText}\n` : ""}

MENSAJE ACTUAL: "${userMessage}"

INSTRUCCIÓN: 
- Si necesitas datos de la BD, devuelve SOLO la consulta SQL entre etiquetas <SQL>...</SQL>.
- Si puedes responder sin datos (ej: saludo), responde directamente en español.
- NUNCA mezcles SQL con texto.
`;

  const text = await invokeModel(prompt);
  const sqlMatch = text.match(/<SQL>([\s\S]*?)<\/SQL>/);

  if (sqlMatch) {
    return { type: "SQL", query: sqlMatch[1].trim() };
  }

  return { type: "TEXT", content: text.trim() };
}

export async function summarizeResults(userMessage, sqlResults, systemPrompt, history = []) {
  const historyText = history
    .map((h) => `Usuario: ${h.user}\nAsistente: ${h.assistant}`)
    .join("\n\n");

  const prompt = `
${systemPrompt}

${historyText ? `CONVERSACIÓN ANTERIOR:\n${historyText}\n` : ""}

El usuario preguntó: "${userMessage}"
Datos obtenidos de la base de datos: ${JSON.stringify(sqlResults)}

INSTRUCCIÓN: Convierte estos datos en una respuesta amable y natural en español para un padre de familia.
No menciones SQL, tablas, IDs ni términos técnicos.
`;

  const text = await invokeModel(prompt);
  return text;
}