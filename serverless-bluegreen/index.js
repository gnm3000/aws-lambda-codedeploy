// index.js
exports.handler = async (event) => {
  throw new Error("Forced failure for rollback tests");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Blue/Green Lambda (Node 20, CommonJS- ok-v5)",
    }),
  };
};
