import app from "../src/server";
import serverless from "serverless-http";

export default serverless(app);
