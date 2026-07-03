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
} as const;

export type Config = typeof config;
export default config;
