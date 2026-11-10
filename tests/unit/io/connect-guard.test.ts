/**
 * Connect-time address check (DNS rebinding, A12.11): the default transport resolves
 * again when it connects and refuses a blocked address. No packet is sent: the guard
 * refuses before any socket is opened, and the test resolver never answers with a
 * routable address that is reached.
 */
import { describe, expect, it } from "vitest";
import { BlockedAddressError, createGuardedLookup, createRealIo, type ResolveFn } from "../../../src/io/index.js";

interface Answer {
  readonly error: NodeJS.ErrnoException | null;
  readonly address: unknown;
  readonly family: number | undefined;
}

/** Call a `lookup` like the socket does and wait for its callback. */
function lookupOf(resolve: ResolveFn, host: string, all: boolean, allowPrivate = false) {
  const lookup = createGuardedLookup(resolve, allowPrivate);
  return new Promise<Answer>((done) => {
    lookup(host, { all }, (error, address, family) => done({ error, address, family }));
  });
}

const answers =
  (...addresses: string[]): ResolveFn =>
  () =>
    Promise.resolve(addresses);

describe("createGuardedLookup", () => {
  it("a public address is handed to the socket (single and all forms)", async () => {
    const single = await lookupOf(answers("93.184.216.34"), "a.example.com", false);
    expect(single).toEqual({ error: null, address: "93.184.216.34", family: 4 });
    const many = await lookupOf(answers("93.184.216.34", "2606:4700::1111"), "a.example.com", true);
    expect(many.error).toBeNull();
    expect(many.address).toEqual([
      { address: "93.184.216.34", family: 4 },
      { address: "2606:4700::1111", family: 6 },
    ]);
  });

  it("fails: a blocked address is refused with BlockedAddressError", async () => {
    for (const address of ["127.0.0.1", "::1", "169.254.169.254", "::ffff:7f00:1", "10.0.0.1"]) {
      const answer = await lookupOf(answers(address), "a.example.com", false);
      expect(answer.error, address).toBeInstanceOf(BlockedAddressError);
      expect(answer.error?.code).toBe("EBLOCKED");
    }
  });

  it("fails: one blocked address among good ones refuses the whole answer", async () => {
    const answer = await lookupOf(answers("93.184.216.34", "127.0.0.1"), "a.example.com", true);
    expect(answer.error).toBeInstanceOf(BlockedAddressError);
  });

  it("the opt-in lets a private address through, never a loopback one", async () => {
    const priv = await lookupOf(answers("10.0.0.9"), "a.example.com", false, true);
    expect(priv.error).toBeNull();
    const loop = await lookupOf(answers("127.0.0.1"), "a.example.com", false, true);
    expect(loop.error).toBeInstanceOf(BlockedAddressError);
  });

  it("fails: no address and a failing resolver keep a DNS error code", async () => {
    const none = await lookupOf(answers(), "a.example.com", false);
    expect(none.error?.code).toBe("ENOTFOUND");
    const failing: ResolveFn = () => Promise.reject(Object.assign(new Error("x"), { code: "EAI_AGAIN" }));
    const failed = await lookupOf(failing, "a.example.com", false);
    expect(failed.error?.code).toBe("EAI_AGAIN");
  });
});

describe("default transport: DNS rebinding", () => {
  it("a name that is public for the pre-check and loopback at connect time is refused, once", async () => {
    let calls = 0;
    const resolve: ResolveFn = () => {
      calls += 1;
      return Promise.resolve(calls === 1 ? ["93.184.216.34"] : ["127.0.0.1"]);
    };
    const io = createRealIo({ resolve });
    const answer = await io.probeUrl("http://rebind.example.com/", 5000);
    expect(answer).toEqual({ reachable: false, reason: "blocked address" });
    // 1 for the pre-check, 1 at connect time; a blocked address is not retried with GET.
    expect(calls).toBe(2);
  });

  it("a name resolving to loopback is refused by the pre-check before the transport", async () => {
    let calls = 0;
    const resolve: ResolveFn = () => {
      calls += 1;
      return Promise.resolve(["127.0.0.1"]);
    };
    const answer = await createRealIo({ resolve }).probeUrl("https://loop.example.com/", 5000);
    expect(answer).toEqual({ reachable: false, reason: "blocked address" });
    expect(calls).toBe(1);
  });
});
