import app from "./app.js";
import { env } from "./config/env.js";

const PORT = Number(env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Cineframe API Server Running`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Allowed Origin: ${env.FRONTEND_URL}`);
  console.log(`=========================================`);
});
