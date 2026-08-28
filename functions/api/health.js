export async function onRequestGet(context) {
  if (!context.env.DB) {
    return Response.json(
      {
        ok: false,
        db: "missing",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  try {
    await context.env.DB.prepare("SELECT id, type, page, created_at FROM interactions LIMIT 1").all();
  } catch {
    return Response.json(
      {
        ok: false,
        db: "schema_error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return Response.json(
    {
      ok: true,
      db: "ready",
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
      Allow: "GET",
    },
  });
}
