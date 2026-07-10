import { Router } from "express";

import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { familyRouter } from "./family.routes";
import { healthRouter } from "./health.routes";
import { mainAppRouter } from "./main-app.routes";
import { ordersRouter } from "./orders.routes";
import { paymentRouter } from "./payment.routes";
import { demoModeMiddleware } from "../middlewares/demo-mode.middleware";

export const apiRouter = Router();

apiRouter.use(demoModeMiddleware);
apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(adminRouter);
apiRouter.use(familyRouter);
apiRouter.use(mainAppRouter);
apiRouter.use(ordersRouter);
apiRouter.use(paymentRouter);
