import "dotenv/config";

const getEnvVar = (key: string, required = true, defaultValue = ""): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Environment variable ${key} is required but missing.`);
  }
  return value || defaultValue;
};

export const config = {
  port: parseInt(getEnvVar("PORT", false, "5001"), 10),
  nodeEnv: getEnvVar("NODE_ENV", false, "development"),
  databaseUrl: getEnvVar("DATABASE_URL", true),
  jwt: {
    accessSecret: getEnvVar("JWT_ACCESS_SECRET", false, "super-secret-default-key-321-abc"),
    accessExpiresIn: getEnvVar("JWT_ACCESS_EXPIRES_IN", false, "7d"),
  },
  smtp: {
    host: getEnvVar("SMTP_HOST", false, "smtp.gmail.com"),
    port: parseInt(getEnvVar("SMTP_PORT", false, "587"), 10),
    user: getEnvVar("SMTP_USER", false, ""),
    pass: getEnvVar("SMTP_PASS", false, ""),
    from: getEnvVar("SMTP_FROM", false, "mdhamim5088@gmail.com"),
  },
  googleClientId: getEnvVar("GOOGLE_CLIENT_ID", false, ""),
} as const;

export type Config = typeof config;
export default config;
