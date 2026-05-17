import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: "us-east-1" });
const cache = {};

export async function getSecret(name) {
  if (cache[name]) return cache[name];

  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true,
  });

  const response = await client.send(command);
  const value = response.Parameter?.Value;
  cache[name] = value;
  return value;
}