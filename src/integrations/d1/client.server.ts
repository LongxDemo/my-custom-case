// Server-only Cloudflare D1 access over the D1 HTTP API.
//
// Why HTTP instead of a Worker binding: this app's dev server runs on Vite
// (no Cloudflare bindings), so a binding would only exist in production. The
// HTTP API works identically in local dev (Node) and in the deployed Worker,
// keeping one code path everywhere.
//
// Env is read INSIDE the function — on Workers, env binds per-request, so
// module-scope reads would be undefined.

interface D1QueryResult<T> {
  results: T[];
  success: boolean;
}

interface D1ApiResponse<T> {
  result: D1QueryResult<T>[];
  success: boolean;
  errors: { code: number; message: string }[];
}

function d1Config() {
  // Trim — secrets uploaded via shell pipes can pick up a trailing newline,
  // which would corrupt the URL or the Bearer token.
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const databaseId = process.env.D1_DATABASE_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!accountId || !databaseId || !token) {
    const missing = [
      ...(!accountId ? ["CLOUDFLARE_ACCOUNT_ID"] : []),
      ...(!databaseId ? ["D1_DATABASE_ID"] : []),
      ...(!token ? ["CLOUDFLARE_API_TOKEN"] : []),
    ];
    throw new Error(`Missing D1 env var(s): ${missing.join(", ")}`);
  }
  return { accountId, databaseId, token };
}

/** Run a single parameterised SQL statement and return its rows. */
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { accountId, databaseId, token } = d1Config();
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );
  const json = (await res.json()) as D1ApiResponse<T>;
  if (!json.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(json.errors)}`);
  }
  return json.result?.[0]?.results ?? [];
}

/** Run a statement and return the first row (or null). */
export async function d1First<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await d1Query<T>(sql, params);
  return rows[0] ?? null;
}
