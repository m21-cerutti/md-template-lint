/**
 * Production RuleIo URL probe: request shape, redirects, retry, budget, opt-in, timeouts
 * (docs/spec.md 2.8; A12.11 security requirements). Injected fetch and resolver only.
 * Each test is one behaviour; the refusal table is in probe.test.ts.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRealIo, USER_AGENT } from "../../../src/io/index.js";
import {
  fakeFetch,
  fakeResolve,
  hang,
  PUBLIC_ADDRESS,
  PUBLIC_HOST,
  status,
} from "../../helpers/io.js";

const URL_OK = `https://${PUBLIC_HOST}/page`;
const dns = { [PUBLIC_HOST]: [PUBLIC_ADDRESS] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("URL probe: requests", () => {
  it("every request is manual-redirect, credential-free, with a fixed User-Agent and no auth header", async () => {
    const { fetch, calls } = fakeFetch(() => status(404));
    const { resolve } = fakeResolve(dns);
    await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 5000);
    expect(calls.map((call) => call.init.method)).toEqual(["HEAD", "GET"]);
    for (const { init } of calls) {
      expect(init.redirect).toBe("manual");
      expect(init.credentials).toBe("omit");
      expect(init.headers).toEqual({ "User-Agent": USER_AGENT, Accept: "*/*" });
      expect(init.signal).toBeInstanceOf(AbortSignal);
      for (const name of Object.keys(init.headers)) {
        expect(["cookie", "authorization", "proxy-authorization"]).not.toContain(
          name.toLowerCase(),
        );
      }
    }
  });

  it("userinfo and fragment are stripped before the request", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dns);
    const answer = await createRealIo({ fetch, resolve }).probeUrl(
      `https://user:secret@${PUBLIC_HOST}/p?q=1#frag`,
      5000,
    );
    expect(answer).toEqual({ reachable: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url.href).toBe(`https://${PUBLIC_HOST}/p?q=1`);
    expect(calls[0]?.url.username).toBe("");
    expect(calls[0]?.url.password).toBe("");
  });

  it("a 3xx is reachable and is never followed (one request, no second URL)", async () => {
    const { fetch, calls } = fakeFetch(() => status(302));
    const { resolve } = fakeResolve(dns);
    const answer = await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 5000);
    expect(answer).toEqual({ reachable: true });
    expect(calls).toHaveLength(1);
  });

  it("HEAD refused with 405 then GET 200 is reachable", async () => {
    const { fetch, calls } = fakeFetch((_call, index) => status(index === 0 ? 405 : 200));
    const { resolve } = fakeResolve(dns);
    const answer = await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 5000);
    expect(answer).toEqual({ reachable: true });
    expect(calls.map((call) => call.init.method)).toEqual(["HEAD", "GET"]);
  });

  it("HEAD failing with an error then GET 200 is reachable", async () => {
    const { fetch } = fakeFetch((_call, index) => {
      if (index === 0) throw new Error("socket hang up");
      return status(200);
    });
    const { resolve } = fakeResolve(dns);
    expect(await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 5000)).toEqual({
      reachable: true,
    });
  });

  it("the body is cancelled at once and never read, on success and on failure", async () => {
    for (const code of [200, 404]) {
      const cancelled: number[] = [];
      const reads: string[] = [];
      const body = {
        cancel: () => {
          cancelled.push(code);
          return Promise.resolve();
        },
        getReader: () => reads.push("getReader"),
        text: () => reads.push("text"),
      };
      const { fetch } = fakeFetch(() => ({ status: code, body }));
      const { resolve } = fakeResolve(dns);
      await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 5000);
      expect(cancelled.length).toBe(code === 200 ? 1 : 2);
      expect(reads).toEqual([]);
    }
  });

  it("a body that throws on cancel does not break the probe", async () => {
    const body = {
      cancel: () => {
        throw new Error("cannot cancel");
      },
    };
    const { fetch } = fakeFetch(() => ({ status: 200, body }));
    const { resolve } = fakeResolve(dns);
    expect(await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 5000)).toEqual({
      reachable: true,
    });
  });
});

describe("URL probe: run budget", () => {
  it("the same URL is probed once per run (dedupe), also with surrounding spaces", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve, calls: resolves } = fakeResolve(dns);
    const io = createRealIo({ fetch, resolve });
    const answers = await Promise.all([
      io.probeUrl(URL_OK, 5000),
      io.probeUrl(URL_OK, 5000),
      io.probeUrl(`  ${URL_OK} `, 5000),
    ]);
    expect(answers).toEqual([{ reachable: true }, { reachable: true }, { reachable: true }]);
    expect(calls).toHaveLength(1);
    expect(resolves).toHaveLength(1);
  });

  it("at most maxUrls different URLs are probed; a known one is still answered", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dns);
    const io = createRealIo({ fetch, resolve, maxUrls: 2 });
    expect(await io.probeUrl(`${URL_OK}/1`, 5000)).toEqual({ reachable: true });
    expect(await io.probeUrl(`${URL_OK}/2`, 5000)).toEqual({ reachable: true });
    expect(await io.probeUrl(`${URL_OK}/3`, 5000)).toEqual({
      reachable: false,
      reason: "url budget exceeded",
    });
    expect(await io.probeUrl(`${URL_OK}/1`, 5000)).toEqual({ reachable: true });
    expect(calls).toHaveLength(2);
  });
});

describe("URL probe: default budget", () => {
  it("the default cap is 100 different URLs per run (spec 2.8)", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dns);
    const io = createRealIo({ fetch, resolve });
    for (let n = 1; n <= 100; n += 1) {
      expect(await io.probeUrl(`${URL_OK}/${n}`, 5000), `url ${n}`).toEqual({ reachable: true });
    }
    expect(await io.probeUrl(`${URL_OK}/101`, 5000)).toEqual({
      reachable: false,
      reason: "url budget exceeded",
    });
    expect(await io.probeUrl(`${URL_OK}/100`, 5000)).toEqual({ reachable: true });
    expect(calls).toHaveLength(100);
  });
});

describe("URL probe: private ranges are an explicit opt-in", () => {
  const dnsPrivate = { "intranet.example.com": ["10.1.2.3"], [PUBLIC_HOST]: [PUBLIC_ADDRESS] };

  it("default: RFC 1918 and unique local are blocked, literal or resolved", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dnsPrivate);
    const io = createRealIo({ fetch, resolve });
    for (const url of [
      "http://10.1.2.3/",
      "http://[fd12:3456::1]/",
      "http://intranet.example.com/",
    ]) {
      expect(await io.probeUrl(url, 5000)).toEqual({ reachable: false, reason: "blocked address" });
    }
    expect(calls).toHaveLength(0);
  });

  it("allowPrivateNetworks: private addresses are probed", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dnsPrivate);
    const io = createRealIo({ fetch, resolve, allowPrivateNetworks: true });
    for (const url of [
      "http://10.1.2.3/",
      "http://[fd12:3456::1]/",
      "http://intranet.example.com/",
    ]) {
      expect(await io.probeUrl(url, 5000)).toEqual({ reachable: true });
    }
    expect(calls).toHaveLength(3);
  });

  it("allowPrivateNetworks: loopback, link-local, metadata and mapped IPv6 stay blocked", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dnsPrivate);
    const io = createRealIo({ fetch, resolve, allowPrivateNetworks: true });
    const urls = [
      "http://127.0.0.1/",
      "http://localhost/",
      "http://169.254.169.254/",
      "http://100.100.100.200/",
      "http://[::1]/",
      "http://[fe80::1]/",
      "http://[::ffff:7f00:1]/",
      "http://2130706433/",
    ];
    for (const url of urls) {
      expect(await io.probeUrl(url, 5000), url).toEqual({
        reachable: false,
        reason: "blocked address",
      });
    }
    expect(calls).toHaveLength(0);
  });
});

describe("URL probe: never throws", () => {
  it("a transport that throws synchronously is a failed probe", async () => {
    const { resolve } = fakeResolve(dns);
    const io = createRealIo({
      resolve,
      fetch: () => {
        throw new Error("sync failure");
      },
    });
    expect(await io.probeUrl(URL_OK, 5000)).toEqual({ reachable: false, reason: "request failed" });
  });

  it("a value that is not a string is an invalid URL", async () => {
    const io = createRealIo({ fetch: fakeFetch(() => status(200)).fetch });
    const answer = await io.probeUrl(undefined as unknown as string, 5000);
    expect(answer).toEqual({ reachable: false, reason: "invalid URL" });
  });
});

describe("URL probe: timeouts", () => {
  it("uses AbortSignal.timeout of 5 s per request (also when asked for more) and 10 s per URL", async () => {
    const timeouts = vi.spyOn(AbortSignal, "timeout");
    const { fetch } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dns);
    await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 60_000);
    expect(timeouts.mock.calls.map(([ms]) => ms).sort((a, b) => a - b)).toEqual([5000, 10_000]);
  });

  it("a request that never answers times out; HEAD and GET each get their turn", async () => {
    const { fetch, calls } = fakeFetch(hang);
    const { resolve } = fakeResolve(dns);
    const io = createRealIo({ fetch, resolve, hardCapMs: 5000 });
    expect(await io.probeUrl(URL_OK, 20)).toEqual({ reachable: false, reason: "timeout" });
    expect(calls.map((call) => call.init.method)).toEqual(["HEAD", "GET"]);
  });

  it("a timeout that is 0, negative, NaN or infinite falls back to the 5 s per-request cap", async () => {
    for (const bad of [0, -1, Number.NaN, Number.NEGATIVE_INFINITY]) {
      const timeouts = vi.spyOn(AbortSignal, "timeout");
      const { fetch } = fakeFetch(() => status(200));
      const { resolve } = fakeResolve(dns);
      await createRealIo({ fetch, resolve }).probeUrl(URL_OK, bad);
      expect(
        timeouts.mock.calls.map(([ms]) => ms).sort((a, b) => a - b),
        String(bad),
      ).toEqual([5000, 10_000]);
      timeouts.mockRestore();
    }
  });

  it("a smaller timeout than the cap is used as given", async () => {
    const timeouts = vi.spyOn(AbortSignal, "timeout");
    const { fetch } = fakeFetch(() => status(200));
    const { resolve } = fakeResolve(dns);
    await createRealIo({ fetch, resolve }).probeUrl(URL_OK, 1234);
    expect(timeouts.mock.calls.map(([ms]) => ms).sort((a, b) => a - b)).toEqual([1234, 10_000]);
  });

  it("the hard cap per URL ends the probe before the GET retry", async () => {
    const { fetch, calls } = fakeFetch(hang);
    const { resolve } = fakeResolve(dns);
    const io = createRealIo({ fetch, resolve, hardCapMs: 30 });
    expect(await io.probeUrl(URL_OK, 5000)).toEqual({ reachable: false, reason: "timeout" });
    expect(calls).toHaveLength(1);
  });

  it("a resolver that never answers is cut by the hard cap", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const io = createRealIo({
      fetch,
      resolve: () => new Promise(() => undefined),
      hardCapMs: 30,
    });
    expect(await io.probeUrl(URL_OK, 5000)).toEqual({ reachable: false, reason: "timeout" });
    expect(calls).toHaveLength(0);
  });
});
