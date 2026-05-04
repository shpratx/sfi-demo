import http from "node:http";
import crypto from "node:crypto";

const PORT = 8000;
const ORG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const USER_ID = "11111111-2222-3333-4444-555555555555";
const NOW = () => new Date().toISOString();

// --- Seed data ---
const settings = [
  { settingName: "ORGANIZATION_NAME", toggleState: true, toggleLocked: true, inputValue: "Schreiber Foods – Green Bay", inputType: "TEXT", displayOrder: 1 },
  { settingName: "QR_CODE_ACCESS", toggleState: true, toggleLocked: false, inputValue: null, inputType: null, displayOrder: 2 },
  { settingName: "DRIVER_NAME", toggleState: true, toggleLocked: true, inputValue: null, inputType: null, displayOrder: 3 },
  { settingName: "DRIVER_ID", toggleState: false, toggleLocked: false, inputValue: null, inputType: "ALPHANUMERIC", displayOrder: 4 },
  { settingName: "DRIVER_PHONE_NUMBER", toggleState: true, toggleLocked: false, inputValue: null, inputType: null, displayOrder: 5 },
  { settingName: "TRUCK_NUMBER", toggleState: true, toggleLocked: false, inputValue: null, inputType: "ALPHANUMERIC", displayOrder: 6 },
  { settingName: "CARRIER_APPROVAL_STEP", toggleState: true, toggleLocked: false, inputValue: "Carrier must be pre-approved before check-in", inputType: "TEXTAREA", displayOrder: 7 },
  { settingName: "TEMPERATURE_ACKNOWLEDGEMENT", toggleState: true, toggleLocked: false, inputValue: "I confirm the trailer temperature is within acceptable range", inputType: "TEXTAREA", displayOrder: 8 },
  { settingName: "EARLY_CHECK_IN_STEP", toggleState: false, toggleLocked: false, inputValue: "60", inputType: "NUMERIC", displayOrder: 9 },
  { settingName: "CONFIRMATION_STEP", toggleState: true, toggleLocked: true, inputValue: null, inputType: null, displayOrder: 10 },
].map((s) => ({ id: crypto.randomUUID(), ...s, versionNum: 1, updatedAt: NOW(), updatedBy: "admin@sfi.com" }));

const auditLogs = [
  { action: "TOGGLE_CHANGE", settingId: settings[1].id, oldValue: "false", newValue: "true" },
  { action: "VALUE_CHANGE", settingId: settings[6].id, oldValue: "Old text", newValue: settings[6].inputValue },
  { action: "SETTING_CREATED", settingId: settings[0].id, oldValue: null, newValue: settings[0].inputValue },
].map((a) => ({
  id: crypto.randomUUID(), userId: USER_ID, orgId: ORG_ID, ...a,
  timestamp: NOW(), correlationId: crypto.randomUUID(),
}));

const orgs = [
  { id: ORG_ID, name: "Schreiber Foods – Green Bay", address: "425 Pine St, Green Bay, WI", phone: "920-437-7601", isActive: true, versionNum: 1, createdAt: NOW(), updatedAt: NOW(), userCount: 3 },
  { id: crypto.randomUUID(), name: "Schreiber Foods – Logan", address: "789 Main St, Logan, UT", phone: "435-752-9900", isActive: true, versionNum: 1, createdAt: NOW(), updatedAt: NOW(), userCount: 1 },
];

// --- Helpers ---
function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" });
  res.end(JSON.stringify(data));
}

function body(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(d ? JSON.parse(d) : {}));
  });
}

function params(url) {
  const u = new URL(url, "http://localhost");
  return Object.fromEntries(u.searchParams);
}

// 1x1 transparent PNG
const TINY_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==", "base64");
// Minimal PDF
const TINY_PDF = Buffer.from("%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF");

// --- Router ---
const server = http.createServer(async (req, res) => {
  const { method } = req;
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*", "Access-Control-Max-Age": "86400" });
    return res.end();
  }

  // Health
  if (path === "/health" && method === "GET") return json(res, { status: "ok" });
  if (path === "/health/ready" && method === "GET") return json(res, { status: "ok" });

  // Auth
  if (path === "/api/v1/auth/login" && method === "POST") {
    const b = await body(req);
    if (!b.email || !b.password) return json(res, { title: "Validation Error", status: 422 }, 422);
    return json(res, {
      accessToken: "mock-jwt-token-" + Date.now(),
      tokenType: "bearer",
      user: { id: USER_ID, email: b.email, fullName: "Demo Admin", role: "ADMIN", orgId: ORG_ID },
    });
  }
  if (path === "/api/v1/auth/logout" && method === "POST") return json(res, { message: "Logged out successfully" });
  if (path === "/api/v1/auth/refresh" && method === "POST") return json(res, { accessToken: "mock-jwt-refreshed-" + Date.now(), tokenType: "bearer" });

  // Settings
  if (path === "/api/v1/driver-checkin/settings" && method === "GET") return json(res, settings);
  const settingMatch = path.match(/^\/api\/v1\/driver-checkin\/settings\/([^/]+)$/);
  if (settingMatch && method === "GET") {
    const s = settings.find((x) => x.id === settingMatch[1]);
    return s ? json(res, s) : json(res, { title: "Not Found", status: 404 }, 404);
  }
  if (settingMatch && method === "PUT") {
    const b = await body(req);
    const s = settings.find((x) => x.id === settingMatch[1]);
    if (!s) return json(res, { title: "Not Found", status: 404 }, 404);
    if (b.toggleState !== undefined) s.toggleState = b.toggleState;
    if (b.inputValue !== undefined) s.inputValue = b.inputValue;
    s.versionNum++;
    s.updatedAt = NOW();
    return json(res, { id: s.id, versionNum: s.versionNum, updatedAt: s.updatedAt });
  }

  // Mobile settings
  if (path === "/api/v1/driver-checkin/settings/mobile" && method === "GET") {
    return json(res, { settings: settings.filter((s) => s.toggleState).map((s) => ({ settingName: s.settingName, inputValue: s.inputValue })) });
  }

  // QR Code
  if (path === "/api/v1/driver-checkin/qr-code" && method === "POST") {
    res.writeHead(200, { "Content-Type": "image/png", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" });
    return res.end(TINY_PNG);
  }
  if (path === "/api/v1/driver-checkin/qr-code/pdf" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=qr-code.pdf", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" });
    return res.end(TINY_PDF);
  }

  // Organizations
  if (path === "/api/v1/organizations" && method === "GET") {
    const p = params(req.url);
    const page = parseInt(p.page || "1");
    const pageSize = parseInt(p.pageSize || "20");
    const data = orgs.map(({ createdAt, updatedAt, address, phone, versionNum, ...rest }) => rest);
    return json(res, { data, meta: { page, pageSize, totalCount: orgs.length, totalPages: 1 } });
  }
  if (path === "/api/v1/organizations" && method === "POST") {
    const b = await body(req);
    const org = { id: crypto.randomUUID(), ...b, isActive: true, versionNum: 1, createdAt: NOW(), updatedAt: NOW() };
    orgs.push({ ...org, userCount: 0 });
    return json(res, org, 201);
  }
  const orgMatch = path.match(/^\/api\/v1\/organizations\/([^/]+)$/);
  if (orgMatch && method === "PUT") {
    const b = await body(req);
    const o = orgs.find((x) => x.id === orgMatch[1]);
    if (!o) return json(res, { title: "Not Found", status: 404 }, 404);
    Object.assign(o, b, { versionNum: o.versionNum + 1, updatedAt: NOW() });
    return json(res, o);
  }
  if (orgMatch && method === "DELETE") {
    const idx = orgs.findIndex((x) => x.id === orgMatch[1]);
    if (idx >= 0) orgs.splice(idx, 1);
    res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
    return res.end();
  }

  // Audit
  if (path === "/api/v1/driver-checkin/audit" && method === "GET") {
    const p = params(req.url);
    const page = parseInt(p.page || "1");
    const pageSize = parseInt(p.pageSize || "20");
    return json(res, { data: auditLogs, meta: { page, pageSize, totalCount: auditLogs.length, totalPages: 1 } });
  }

  // 404
  json(res, { title: "Not Found", status: 404, detail: `${method} ${path}` }, 404);
});

server.listen(PORT, () => console.log(`Mock backend running on http://localhost:${PORT}`));
