import { app } from "../src/app";

type VercelLikeRequest = {
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function handler(req: VercelLikeRequest, res: unknown) {
  const query = req.query ?? {};
  const path = first(query.path);
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (key === "path") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
      return;
    }
    if (value !== undefined) {
      params.set(key, value);
    }
  });

  req.url = `/api/${path}${params.size > 0 ? `?${params.toString()}` : ""}`;
  return app(req as never, res as never);
}
