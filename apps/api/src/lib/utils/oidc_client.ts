// utils/oidcClient.js

import { Issuer } from "openid-client";

let oidcClientCache = new Map<string, any>();

export async function getOidcClient(config: any) {
  const cacheKey = [config.issuer, config.clientId, config.redirectUri].join(
    "::",
  );

  if (!oidcClientCache.has(cacheKey)) {
    const oidcIssuer = await Issuer.discover(config.issuer);
    oidcClientCache.set(
      cacheKey,
      new oidcIssuer.Client({
        client_id: config.clientId,
        redirect_uris: [config.redirectUri],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      }),
    );
  }

  return oidcClientCache.get(cacheKey);
}
