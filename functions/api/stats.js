function isAuthorized(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  return Boolean(env.STATS_TOKEN) && token === env.STATS_TOKEN;
}

function formatCount(label, value) {
  return `${label.padEnd(18, " ")} | ${value}`;
}

function formatLatest(label, value) {
  return `${label.padEnd(18, " ")} | ${value || "-"}`;
}

function formatRow(row) {
  const page = row.page === null || row.page === undefined ? "-" : String(row.page);
  return `${String(row.id).padStart(2, " ")} | ${row.type.padEnd(13, " ")} | ${page.padEnd(4, " ")} | ${row.created_at}`;
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

  const summary = await context.env.DB.prepare(
    `SELECT
      SUM(CASE WHEN type = 'opened' THEN 1 ELSE 0 END) AS opened,
      SUM(CASE WHEN type = 'page_progress' AND page = 1 THEN 1 ELSE 0 END) AS reachedPage1,
      SUM(CASE WHEN type = 'page_progress' AND page = 2 THEN 1 ELSE 0 END) AS reachedPage2,
      SUM(CASE WHEN type = 'page_progress' AND page = 3 THEN 1 ELSE 0 END) AS reachedPage3,
      SUM(CASE WHEN type = 'page_progress' AND page = 4 THEN 1 ELSE 0 END) AS reachedPage4,
      SUM(CASE WHEN type = 'page_progress' AND page = 5 THEN 1 ELSE 0 END) AS reachedPage5,
      SUM(CASE WHEN type = 'acknowledged' THEN 1 ELSE 0 END) AS acknowledged,
      MAX(CASE WHEN type = 'opened' THEN created_at ELSE NULL END) AS latestOpened,
      MAX(CASE WHEN type = 'acknowledged' THEN created_at ELSE NULL END) AS latestAcknowledged,
      MAX(CASE WHEN type = 'page_progress' THEN created_at ELSE NULL END) AS latestPageProgress
    FROM interactions`
  ).first();

  const rows = await context.env.DB.prepare(
    "SELECT id, type, page, created_at FROM interactions ORDER BY id ASC LIMIT 200"
  ).all();

  const countLines = [
    formatCount("opened", summary.opened || 0),
    formatCount("reachedPage1", summary.reachedPage1 || 0),
    formatCount("reachedPage2", summary.reachedPage2 || 0),
    formatCount("reachedPage3", summary.reachedPage3 || 0),
    formatCount("reachedPage4", summary.reachedPage4 || 0),
    formatCount("reachedPage5", summary.reachedPage5 || 0),
    formatCount("acknowledged", summary.acknowledged || 0),
  ];

  const latestLines = [
    formatLatest("latestOpened", summary.latestOpened),
    formatLatest("latestAcknowledged", summary.latestAcknowledged),
    formatLatest("latestPageProgress", summary.latestPageProgress),
  ];

  const eventLines = rows.results.map(formatRow);
  const body = [
    "summary",
    ...countLines,
    "",
    "latest",
    ...latestLines,
    "",
    "events",
    "id | type          | page | created_at",
    ...eventLines,
    "",
  ].join("\n");

  return new Response(body, {
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
