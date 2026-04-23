import { Router } from "express";
import { RulesDataService } from "../services/rulesData.js";

export const buildRulesRouter = (deps: { rules: RulesDataService }) => {
  const router = Router();

  router.get("/bootstrap", (_req, res) => {
    res.json(deps.rules.getBootstrapPayload());
  });

  return router;
};
