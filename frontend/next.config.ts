import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** Non-loopback IPv4 addresses on this machine (for HMR when opening dev via LAN IP). */
function localLanIpv4Hosts(): string[] {
  const nets = os.networkInterfaces();
  const hosts = new Set<string>();
  for (const entries of Object.values(nets)) {
    for (const e of entries ?? []) {
      const v4 = e.family === 'IPv4' || e.family === 4;
      if (v4 && !e.internal) hosts.add(e.address);
    }
  }
  return [...hosts];
}

/**
 * Hostnames allowed to load dev-only assets (e.g. HMR WebSocket) when the page is not opened as localhost.
 * Optional: `NEXT_DEV_ALLOWED_ORIGINS` — comma-separated hostnames, no protocol/port.
 * In non-production, local LAN IPv4s are added automatically unless `NEXT_DEV_DISABLE_AUTO_LAN_ORIGINS=1`.
 */
function resolveAllowedDevOrigins(): string[] | undefined {
  const fromEnv =
    process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(',')
      .map((h) => h.trim())
      .filter(Boolean) ?? [];
  const autoLan =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_DEV_DISABLE_AUTO_LAN_ORIGINS !== '1'
      ? localLanIpv4Hosts()
      : [];
  const merged = [...new Set([...fromEnv, ...autoLan])];
  return merged.length ? merged : undefined;
}

const allowedDevOrigins = resolveAllowedDevOrigins();

const nextConfig: NextConfig = {
  turbopack: {
    root: currentDir,
  },
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
};

export default nextConfig;
