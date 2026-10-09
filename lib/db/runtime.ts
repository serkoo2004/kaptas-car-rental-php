import net from "node:net";

let databaseHealthCache:
  | {
      available: boolean;
      checkedAt: number;
      url: string;
    }
  | undefined;

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return false;
  }

  return !databaseUrl.includes("user:password@localhost:3306/kaptas");
}

export async function isDatabaseAvailable() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!isDatabaseConfigured() || !databaseUrl) {
    return false;
  }

  const positiveCacheMs = Number(
    process.env.DATABASE_HEALTH_CACHE_MS ?? 15000,
  );
  const negativeCacheMs = Number(
    process.env.DATABASE_HEALTH_FAILURE_CACHE_MS ?? 750,
  );
  const timeoutMs = Number(process.env.DATABASE_HEALTH_TIMEOUT_MS ?? 1500);
  const now = Date.now();

  if (
    databaseHealthCache &&
    databaseHealthCache.url === databaseUrl &&
    now - databaseHealthCache.checkedAt <
      (databaseHealthCache.available ? positiveCacheMs : negativeCacheMs)
  ) {
    return databaseHealthCache.available;
  }

  const available = await canReachDatabase(databaseUrl, timeoutMs);

  databaseHealthCache = {
    available,
    checkedAt: now,
    url: databaseUrl,
  };

  return available;
}

async function canReachDatabase(databaseUrl: string, timeoutMs: number) {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "mysql:") {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
    });

    const finish = (available: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(available);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}
