const ALLOWED_TYPES = new Set(["opened", "acknowledged"]);

function getSydneyTimestamp(date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Australia/Sydney",
  }).format(date);
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

  const clickedAt = new Date();
  const clickedAtUtc = clickedAt.toISOString().replace(/\.\d{3}Z$/, "Z");
  const clickedAtSydney = getSydneyTimestamp(clickedAt);

  await context.env.DB.prepare(
    "INSERT INTO interactions (type, clicked_at_utc, clicked_at_sydney) VALUES (?, ?, ?)"
  )
    .bind(body.type, clickedAtUtc, clickedAtSydney)
    .run();

  return Response.json(
    {
      ok: true,
      type: body.type,
      clicked_at_utc: clickedAtUtc,
      clicked_at_sydney: clickedAtSydney,
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
