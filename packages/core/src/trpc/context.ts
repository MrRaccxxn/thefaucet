import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@thefaucet/db";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";

export async function createTRPCContext(
  opts: FetchCreateContextFnOptions,
  authOptions: NextAuthOptions
) {
  // Get the session from the request
  const session = await getServerSession(authOptions);

  return {
    db,
    session,
    user: session?.user ?? null,
    req: opts.req,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;