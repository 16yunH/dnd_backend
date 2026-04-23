import { afterEach, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { makeTempStore } from "./helpers/tempStore.js";

describe("smoke routes", () => {
  let ctx: ReturnType<typeof makeTempStore>;
  let app: ReturnType<typeof createApp>["app"];

  beforeEach(() => {
    ctx = makeTempStore();
    app = createApp({ store: ctx.store }).app;
  });

  afterEach(() => ctx.cleanup());

  it("GET /healthz returns ok", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /v1/rules/bootstrap returns the core datasets", async () => {
    const res = await request(app).get("/v1/rules/bootstrap");
    expect(res.status).toBe(200);
    expect(res.body.rulesVersion).toBeTruthy();
    expect(Array.isArray(res.body.races)).toBe(true);
    expect(Array.isArray(res.body.classes)).toBe(true);
    expect(res.body.pointBuy).toBeDefined();
  });

  it("POST /v1/auth/guest-login issues a bearer token", async () => {
    const res = await request(app)
      .post("/v1/auth/guest-login")
      .send({ nickname: "Alice" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toMatch(/^dev_/);
    expect(res.body.nickname).toBe("Alice");
  });

  it("rejects characters list without auth", async () => {
    const res = await request(app).get("/v1/characters");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("unauthorized");
  });

  it("rooms: create -> get -> leave round-trip", async () => {
    const login = await request(app)
      .post("/v1/auth/guest-login")
      .send({ nickname: "Host" });
    const token = login.body.accessToken;
    const auth = `Bearer ${token}`;

    const create = await request(app)
      .post("/v1/rooms")
      .set("Authorization", auth)
      .send({});
    expect(create.status).toBe(201);
    const roomId = create.body.id;
    expect(roomId).toBeTruthy();
    expect(create.body.players).toHaveLength(1);

    const got = await request(app)
      .get(`/v1/rooms/${roomId}`)
      .set("Authorization", auth);
    expect(got.status).toBe(200);
    expect(got.body.id).toBe(roomId);

    const left = await request(app)
      .post(`/v1/rooms/${roomId}/leave`)
      .set("Authorization", auth);
    expect(left.status).toBe(200);
  });
});
