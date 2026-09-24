import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a Next server build; it's a no-op here.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // Tests never touch a real database or payment/email provider.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_SECRET: "test_secret_test_secret_test_secret_1234",
      PAYSTACK_SECRET_KEY: "",
      RESEND_API_KEY: "",
      APP_URL: "http://localhost:3001",
    },
  },
});
