export function getTrustedRequestIp(req: Request) {
  const trustProxyHeaders = process.env.TRUST_PROXY_IP_HEADERS === "true";

  if (!trustProxyHeaders) {
    return "unknown";
  }

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first?.trim()) {
      return first.trim();
    }
  }

  return req.headers.get("x-real-ip") || "unknown";
}
