import { onRequest } from "firebase-functions/v2/https";
import { createServerAdapter } from "@whatwg-node/server";
import startServer from "./dist/server/server.js";

const handler = createServerAdapter(startServer.fetch);

export const server = onRequest({ region: "us-central1" }, handler);
