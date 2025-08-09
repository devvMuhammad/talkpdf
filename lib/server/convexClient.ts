import { ConvexHttpClient } from "convex/browser";
// no api typings imported intentionally; we call by string names for now

export async function createConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  const client = new ConvexHttpClient(url);
  return {
    mutation: (name: string, args?: any) => client.mutation(name as any, args),
    query: (name: string, args?: any) => client.query(name as any, args),
    action: (name: string, args?: any) => client.action(name as any, args),
  };
}


