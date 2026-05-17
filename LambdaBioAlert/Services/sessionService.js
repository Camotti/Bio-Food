import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({ region: "us-east-1" });
const TABLE = "bioalert-sessions";
const TTL_SECONDS = 3600;

export async function getSession(phone) {
  const command = new GetItemCommand({
    TableName: TABLE,
    Key: { phone: { S: phone } },
  });

  const result = await dynamo.send(command);
  if (!result.Item) return [];

  return JSON.parse(result.Item.history.S);
}

export async function saveSession(phone, history) {
  const ttl = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  const command = new PutItemCommand({
    TableName: TABLE,
    Item: {
      phone: { S: phone },
      history: { S: JSON.stringify(history) },
      ttl: { N: String(ttl) },
    },
  });

  await dynamo.send(command);
}