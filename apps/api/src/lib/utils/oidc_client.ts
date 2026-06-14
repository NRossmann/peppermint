// utils/oidcClient.js

import { Issuer } from "openid-client";

let oidcClientCache = new Map<string, any>();

export async function getOidcClient(config: any) {
  const cacheKey = [
    config.issuer,
    config.clientId,
    config.redirectUri,
    config.clientSecret || "",
  ].join("::");

  if (!oidcClientCache.has(cacheKey)) {
    const oidcIssuer = await Issuer.discover(config.issuer);
    oidcClientCache.set(
      cacheKey,
      new oidcIssuer.Client({
        client_id: config.clientId,
        client_secret: config.clientSecret || undefined,
        redirect_uris: [config.redirectUri],
        response_types: ["code"],
        token_endpoint_auth_method: config.clientSecret
          ? "client_secret_post"
          : "none",
      }),
    );
  }

  return oidcClientCache.get(cacheKey);
}
