function isAuthorized(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  return Boolean(env.STATS_TOKEN) && token === env.STATS_TOKEN;
}

function formatRow(row) {
  return `${String(row.id).padStart(2, " ")} | ${row.type.padEnd(12, " ")} | ${row.clicked_at_utc}`;
}

export async function onRequestGet(context) {
  if (!context.env.DB) {
    return new Response("D1 binding DB is not configured.\n", { status: 500 });
  }

  if (!isAuthorized(context.request, context.env)) {
    return new Response("Unauthorized\n", {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const rows = await context.env.DB.prepare(
    "SELECT id, type, clicked_at_utc, clicked_at_sydney FROM interactions ORDER BY id ASC LIMIT 200"
  ).all();

  const lines = rows.results.map(formatRow);

  return new Response(`${lines.join("\n")}${lines.length ? "\n" : ""}`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function onRequest() {
  return new Response("Method Not Allowed\n", {
    status: 405,
    headers: {
      Allow: "GET",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
