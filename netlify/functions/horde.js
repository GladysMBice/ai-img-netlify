// netlify/functions/horde.js
const API = "https://aihorde.net/api/v2";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store"
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  try {
    const search = event.rawQuery ? `?${event.rawQuery}` : "";
    const upstreamPath = event.path.replace("/.netlify/functions/horde", "");
    const upstream = `${API}${upstreamPath}${search}`;

    const headers = {};
    const ct = event.headers["content-type"] || event.headers["Content-Type"];
    if (ct) headers["content-type"] = ct;

    headers["client-agent"] = "netlify-img-gen:1.0:yourname";
    headers["apikey"] = process.env.HORDE_API_KEY || "0000000000"; // guest if not set

    const init = { method: event.httpMethod, headers };
    if (!["GET", "HEAD"].includes(event.httpMethod) && event.body) {
      init.body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
    }

    const resp = await fetch(upstream, init);
    const buf = await resp.arrayBuffer();

    const respHeaders = {};
    resp.headers.forEach((v, k) => (respHeaders[k] = v));
    Object.assign(respHeaders, corsHeaders());

    return {
      statusCode: resp.status,
      headers: respHeaders,
      body: Buffer.from(buf).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: e.message || "Proxy error" }),
    };
  }
};