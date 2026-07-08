import { startSearchServer } from "./search-server.js";

// Port 0 = OS-assigned (production sidecar reports actual port on stdout).
const port = Number(process.env.TORLINK_SEARCH_PORT ?? 0);
void startSearchServer(port);