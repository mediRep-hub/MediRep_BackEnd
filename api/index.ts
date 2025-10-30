// api/index.ts
import serverless from "serverless-http";
import app from "../src/server.js";

// ✅ Wrap Express app in a serverless function
const handler = serverless(app);

// ✅ Export as default
export default handler;
