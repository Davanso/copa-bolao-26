import { afterEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { HttpError } from "../../errors/http.js";
import { jwtSecret, verifyTokenPayload } from "../auth.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;

describe("jwtSecret", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("usa fallback apenas fora de produção", () => {
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;

    expect(jwtSecret()).toBe("dev-secret-change-me");
  });

  it("falha em produção quando JWT_SECRET não está configurado", () => {
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;

    expect(() => jwtSecret()).toThrow(HttpError);
  });

  it("usa o segredo configurado", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "super-secret";

    expect(jwtSecret()).toBe("super-secret");
  });
});

describe("verifyTokenPayload", () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it("transforma token expirado em erro 401 amigável", () => {
    process.env.JWT_SECRET = "super-secret";
    const token = jwt.sign({ sub: "user-1" }, "super-secret", {
      expiresIn: "-1s",
    });

    expect(() => verifyTokenPayload(token)).toThrow(HttpError);

    try {
      verifyTokenPayload(token);
    } catch (error) {
      expect(error).toMatchObject({
        message: "Sessão expirada. Entre novamente.",
        status: 401,
      });
    }
  });
});
