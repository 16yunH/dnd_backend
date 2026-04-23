import { Router } from "express";

export const buildHealthRouter = () => {
  const router = Router();

  router.get("/healthz", (_req, res) => {
    res.json({
      status: "ok",
      now: new Date().toISOString()
    });
  });

  return router;
};
