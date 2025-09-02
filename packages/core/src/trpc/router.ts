import { createTRPCRouter } from "./index";
import { userRouter } from "./routers/user";
import { chainRouter } from "./routers/chain";
import { assetRouter } from "./routers/asset";
import { claimRouter } from "./routers/claim";
import { codeRouter } from "./routers/code";
import { adminRouter } from "./routers/admin";

export const appRouter = createTRPCRouter({
  user: userRouter,
  chain: chainRouter,
  asset: assetRouter,
  claim: claimRouter,
  code: codeRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;