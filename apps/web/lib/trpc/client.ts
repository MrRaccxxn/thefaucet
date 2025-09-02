import { createTRPCReact } from "@trpc/react-query";
import { type AppRouter } from "@thefaucet/core";

export const api = createTRPCReact<AppRouter>() as ReturnType<typeof createTRPCReact<AppRouter>>;