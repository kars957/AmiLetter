const ALLOWED_TYPES = new Set(["opened", "page_progress", "acknowledged"]);

function json(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function normalizePage(type, page) {
  if (type !== "page_progress") {
    return null;
  }

  if (!Number.isInteger(page) || page < 1 || page > 5) {
    return undefined;
  }

  return page;
}

async function handleInteraction(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } });
  }

  if (!env.DB) {
    return json({ ok: false, error: "D1 binding DB is not configured." }, { status: 500 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(body.type)) {
    return json({ ok: false, error: "Unknown interaction type." }, { status: 400 });
  }

  const page = normalizePage(body.type, body.page);

  if (page === undefined) {
    return json({ ok: false, error: "Invalid page value." }, { status: 400 });
  }

  const createdAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  await env.DB.prepare("INSERT INTO interactions (type, page, created_at) VALUES (?, ?, ?)")
    .bind(body.type, page, createdAt)
    .run();

  return json({ ok: true });
}

async function handleHealth(request, env) {
  if (request.method !== "GET") {
    return json({ ok: false, error: "Method Not Allowed" }, { status: 405, headers: { Allow: "GET" } });
  }

  if (!env.DB) {
    return json({ ok: false, db: "missing" }, { status: 500 });
  }

  try {
    await env.DB.prepare("SELECT id, type, page, created_at FROM interactions LIMIT 1").all();
  } catch {
    return json({ ok: false, db: "schema_error" }, { status: 500 });
  }

  return json({ ok: true, db: "ready" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/interaction") {
      return handleInteraction(request, env);
    }

    if (url.pathname === "/api/health") {
      return handleHealth(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not Found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
