const ALLOWED_TYPES = new Set(["opened", "page_progress", "acknowledged"]);

function getSydneyTimestamp(date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Australia/Sydney",
  }).format(date);
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

export async function onRequestPost(context) {
  if (!context.env.DB) {
    return Response.json({ ok: false, error: "D1 binding DB is not configured." }, { status: 500 });
  }

  let body;

  try {
    body = await context.request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(body.type)) {
    return Response.json({ ok: false, error: "Unknown interaction type." }, { status: 400 });
  }

  const page = normalizePage(body.type, body.page);

  if (page === undefined) {
    return Response.json({ ok: false, error: "Invalid page value." }, { status: 400 });
  }

  const clickedAt = new Date();
  const createdAt = clickedAt.toISOString().replace(/\.\d{3}Z$/, "Z");
  const clickedAtSydney = getSydneyTimestamp(clickedAt);

  await context.env.DB.prepare(
    "INSERT INTO interactions (type, page, created_at, clicked_at_utc, clicked_at_sydney) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(body.type, page, createdAt, createdAt, clickedAtSydney)
    .run();

  return Response.json(
    {
      ok: true,
      type: body.type,
      page,
      created_at: createdAt,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export function onRequest() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: "POST",
    },
  });
}
