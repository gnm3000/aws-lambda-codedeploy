import { APIGatewayProxyHandler } from "aws-lambda";

type ResponseBody = {
  message: string;
  input?: unknown;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  const name = event.queryStringParameters?.name?.trim();
  const greetingTarget = name && name.length > 0 ? name : "World";

  const responseBody: ResponseBody = {
    message: `Hello, ${greetingTarget}!`,
  };

  if (event.body) {
    responseBody.input = event.body;
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(responseBody),
  };
};
