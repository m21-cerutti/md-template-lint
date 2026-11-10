/**
 * Production RuleIo URL probe (docs/spec.md 2.8; A12.11 security requirements, OWASP
 * A10). Table of one reachable URL and many refused or failing ones. Injected fetch and
 * resolver only: no network, and a blocked address is refused BEFORE any fetch.
 */
import { describe, expect, it } from "vitest";
import { BlockedAddressError, createRealIo, type ResolveFn } from "../../../src/io/index.js";
import {
  fakeFetch,
  fakeResolve,
  PUBLIC_ADDRESS,
  PUBLIC_HOST,
  status,
  type Handler,
} from "../../helpers/io.js";

const REFUSED = "refused-before-any-request";

interface Case {
  readonly name: string;
  readonly url: string;
  /** Host name -> addresses. */
  readonly dns?: Readonly<Record<string, readonly string[]>>;
  readonly handler?: Handler;
  /** Methods the transport must see, in order. */
  readonly methods: readonly string[];
  readonly reason: string | null;
  readonly resolves?: number;
  /** The resolver rejects with this error code instead of answering. */
  readonly dnsError?: string;
}

const ok: Handler = () => status(200);
const dns = { [PUBLIC_HOST]: [PUBLIC_ADDRESS] };

/** Exactly 1 passing case (reachable), failing cases >= passing. */
const CASES: readonly Case[] = [
  {
    name: "pass-head-200",
    url: `https://${PUBLIC_HOST}/a`,
    dns,
    handler: ok,
    methods: ["HEAD"],
    reason: null,
    resolves: 1,
  },
  // scheme allow-list, before any I/O
  ...[
    "file:///etc/passwd",
    "ftp://ok.example.com/x",
    "javascript:alert(1)",
    "gopher://ok.example.com/",
  ].map((url): Case => ({
    name: `fail-scheme-${url.split(":")[0]}`,
    url,
    dns,
    methods: [],
    reason: "unsupported scheme",
    resolves: 0,
  })),
  {
    name: "fail-not-a-url",
    url: "not a url",
    dns,
    methods: [],
    reason: "invalid URL",
    resolves: 0,
  },
  { name: "fail-empty", url: "", dns, methods: [], reason: "invalid URL", resolves: 0 },
  // blocked literals and spellings of them
  ...[
    ["loopback", "http://127.0.0.1/"],
    ["loopback-other", "http://127.8.8.8:8080/x"],
    ["localhost", "http://localhost:8080/"],
    ["localhost-subdomain", "http://app.localhost/"],
    ["this-network", "http://0.0.0.0/"],
    ["link-local", "http://169.254.1.1/"],
    ["aws-metadata", "http://169.254.169.254/latest/meta-data/"],
    ["alibaba-metadata", "http://100.100.100.200/"],
    ["azure-wireserver", "http://168.63.129.16/"],
    ["ipv6-loopback", "http://[::1]:3000/"],
    ["ipv6-link-local", "http://[fe80::1]/"],
    ["ipv6-metadata", "http://[fd00:ec2::254]/"],
    ["ipv4-mapped-ipv6", "http://[::ffff:7f00:1]/"],
    ["ipv4-mapped-ipv6-dotted", "http://[::ffff:127.0.0.1]/"],
    ["ipv4-mapped-ipv6-public", "http://[::ffff:8.8.8.8]/"],
    ["decimal-ip", "http://2130706433/"],
    ["hex-ip", "http://0x7f000001/"],
    ["octal-ip", "http://0177.0.0.1/"],
    ["short-ip", "http://127.1/"],
    ["decimal-spelling-of-a-public-ip", "http://134744072/"],
    ["trailing-dot-spelling", "http://127.0.0.1./"],
    ["private-10", "http://10.1.2.3/"],
    ["private-172", "http://172.16.0.9/"],
    ["private-192", "http://192.168.0.1/"],
    ["private-ipv6", "http://[fd12:3456::1]/"],
  ].map(([name, url]): Case => ({
    name: `fail-blocked-${name}`,
    url: url as string,
    dns,
    methods: [],
    reason: "blocked address",
    resolves: 0,
  })),
  // more spellings: trailing dot, zone id, IDN mapping, fullwidth forms, missing slashes
  ...[
    ["localhost-trailing-dot", "http://localhost./"],
    ["localhost-subdomain-trailing-dot", "http://app.localhost./"],
    ["circled-letters-map-to-localhost", "http://ⓛⓞⓒⓐⓛⓗⓞⓢⓣ/"],
    ["fullwidth-digits", "http://１２７.０.０.１/"],
    ["ideographic-dots", "http://127。0。0。1/"],
    ["fullwidth-decimal-ip", "http://２１３０７０６４３３/"],
    ["single-slash-decimal-ip", "http:/134744072/"],
    ["no-slash-decimal-ip", "http:134744072"],
    ["triple-slash-decimal-ip", "http:///134744072/"],
    ["backslashes-decimal-ip", "http:\\\\134744072\\"],
    ["tab-inside-decimal-ip", "http://134\t744072/"],
    ["userinfo-before-decimal-ip", "http://user:pw@134744072:80/"],
    ["ipv6-reserved-fe00", "http://[fe00::1]/"],
    ["ipv6-reserved-fbff", "http://[fbff::1]/"],
    ["ipv6-reserved-fe7f", "http://[fe7f::1]/"],
    ["ipv6-nat64-local-use", "http://[64:ff9b:1::]/"],
    ["ipv6-nat64-local-use-host", "http://[64:ff9b:1::808:808]/"],
    ["ipv6-translated-public", "http://[::ffff:0:8.8.8.8]/"],
    ["ipv6-teredo", "http://[2001::1]/"],
    ["ipv6-discard", "http://[100::1]/"],
    ["ipv6-multicast", "http://[ff02::1]/"],
  ].map(([name, url]): Case => ({
    name: `fail-blocked-${name}`,
    url: url as string,
    dns,
    methods: [],
    reason: "blocked address",
    resolves: 0,
  })),
  // a zone id is not valid in a URL host: refused as an invalid URL, nothing is sent
  ...[
    ["encoded-percent", "http://[fe80::1%25eth0]/"],
    ["raw-percent", "http://[fe80::1%eth0]/"],
    ["loopback-with-port", "http://[::1%25lo]:80/"],
  ].map(([name, url]): Case => ({
    name: `fail-invalid-zone-id-${name}`,
    url: url as string,
    dns,
    methods: [],
    reason: "invalid URL",
    resolves: 0,
  })),
  // an IDN name is resolved in its punycode form; the resolved address decides
  {
    name: "fail-blocked-idn-name-resolves-to-loopback",
    url: "http://bücher.example/",
    dns: { "xn--bcher-kva.example": ["127.0.0.1"] },
    methods: [],
    reason: "blocked address",
    resolves: 1,
  },
  {
    name: "fail-idn-name-not-found",
    url: "http://bücher.example/",
    dns,
    methods: [],
    reason: "DNS failure",
    resolves: 1,
  },
  // resolver error codes are all a DNS failure
  ...["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL", "EAI_NODATA", "ETIMEOUT", "SERVFAIL"].map(
    (code): Case => ({
      name: `fail-resolver-rejects-${code.toLowerCase()}`,
      url: "https://dns.example.com/",
      dns,
      dnsError: code,
      methods: [],
      reason: "DNS failure",
      resolves: 1,
    }),
  ),
  ...["EAI_AGAIN", "EAI_FAIL", "EAI_NODATA"].map((code): Case => ({
    name: `fail-transport-error-${code.toLowerCase()}`,
    url: `https://${PUBLIC_HOST}/lookup`,
    dns,
    handler: () => {
      throw Object.assign(new Error(`getaddrinfo ${code} ok.example.com`), { code });
    },
    methods: ["HEAD", "GET"],
    reason: "DNS failure",
  })),
  // the RESOLVED address decides for a name
  {
    name: "fail-blocked-name-resolves-to-loopback",
    url: "http://rebind.example.com/",
    dns: { "rebind.example.com": ["127.0.0.1"] },
    methods: [],
    reason: "blocked address",
    resolves: 1,
  },
  {
    name: "fail-blocked-name-resolves-to-metadata",
    url: "https://metadata.example.com/",
    dns: { "metadata.example.com": ["169.254.169.254"] },
    methods: [],
    reason: "blocked address",
    resolves: 1,
  },
  {
    name: "fail-blocked-name-resolves-to-mapped-ipv6",
    url: "https://mapped.example.com/",
    dns: { "mapped.example.com": ["::ffff:7f00:1"] },
    methods: [],
    reason: "blocked address",
    resolves: 1,
  },
  {
    name: "fail-blocked-one-bad-address-among-good-ones",
    url: "https://mixed.example.com/",
    dns: { "mixed.example.com": [PUBLIC_ADDRESS, "10.0.0.1"] },
    methods: [],
    reason: "blocked address",
    resolves: 1,
  },
  {
    name: "fail-dns-failure",
    url: "https://nowhere.example.com/",
    dns,
    methods: [],
    reason: "DNS failure",
    resolves: 1,
  },
  {
    name: "fail-dns-empty-answer",
    url: "https://empty.example.com/",
    dns: { "empty.example.com": [] },
    methods: [],
    reason: "DNS failure",
    resolves: 1,
  },
  // statuses
  {
    name: "fail-http-404-after-head-and-get",
    url: `https://${PUBLIC_HOST}/gone`,
    dns,
    handler: () => status(404),
    methods: ["HEAD", "GET"],
    reason: "HTTP 404",
  },
  {
    name: "fail-http-503",
    url: `https://${PUBLIC_HOST}/busy`,
    dns,
    handler: () => status(503),
    methods: ["HEAD", "GET"],
    reason: "HTTP 503",
  },
  {
    name: "fail-status-outside-http-range",
    url: `https://${PUBLIC_HOST}/odd`,
    dns,
    handler: () => status(0),
    methods: ["HEAD", "GET"],
    reason: "request failed",
  },
  {
    name: "fail-remote-status-text-is-never-echoed",
    url: `https://${PUBLIC_HOST}/text`,
    dns,
    handler: () => ({ status: 500, statusText: "<script>evil\u001b[31m", body: null }),
    methods: ["HEAD", "GET"],
    reason: "HTTP 500",
  },
  // errors
  {
    name: "fail-connection-refused",
    url: `https://${PUBLIC_HOST}/refused`,
    dns,
    handler: () => {
      throw Object.assign(new Error("connect ECONNREFUSED 93.184.216.34:443"), {
        code: "ECONNREFUSED",
      });
    },
    methods: ["HEAD", "GET"],
    reason: "connection refused",
  },
  {
    name: "fail-connection-refused-in-error-cause",
    url: `https://${PUBLIC_HOST}/cause`,
    dns,
    handler: () => {
      throw new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } });
    },
    methods: ["HEAD", "GET"],
    reason: "connection refused",
  },
  {
    name: "fail-connection-refused-in-aggregate-error",
    url: `https://${PUBLIC_HOST}/aggregate`,
    dns,
    handler: () => {
      throw Object.assign(new AggregateError([{ code: "ECONNREFUSED" }]), { code: undefined });
    },
    methods: ["HEAD", "GET"],
    reason: "connection refused",
  },
  {
    name: "fail-dns-error-from-the-transport",
    url: `https://${PUBLIC_HOST}/lookup`,
    dns,
    handler: () => {
      throw Object.assign(new Error("getaddrinfo ENOTFOUND ok.example.com"), { code: "ENOTFOUND" });
    },
    methods: ["HEAD", "GET"],
    reason: "DNS failure",
  },
  {
    name: "fail-raw-error-message-is-never-echoed",
    url: `https://${PUBLIC_HOST}/raw`,
    dns,
    handler: () => {
      throw new Error("secret at C:\\Users\\me\\token \u001b[31m");
    },
    methods: ["HEAD", "GET"],
    reason: "request failed",
  },
  {
    name: "fail-blocked-at-connect-time-is-not-retried",
    url: `https://${PUBLIC_HOST}/rebound`,
    dns,
    handler: () => {
      throw new BlockedAddressError();
    },
    methods: ["HEAD"],
    reason: "blocked address",
  },
];

describe("URL probe: table layout", () => {
  it("has exactly 1 pass- case and at least as many fail- cases", () => {
    const passing = CASES.filter((testCase) => testCase.name.startsWith("pass-"));
    const failing = CASES.filter((testCase) => testCase.name.startsWith("fail-"));
    expect(passing).toHaveLength(1);
    expect(failing.length).toBeGreaterThanOrEqual(passing.length);
    expect(passing.length + failing.length).toBe(CASES.length);
    expect(new Set(CASES.map((testCase) => testCase.name)).size).toBe(CASES.length);
  });
});

describe("URL probe: reason from a fixed vocabulary, nothing requested before the checks", () => {
  for (const testCase of CASES) {
    it(`${testCase.name}`, async () => {
      const { fetch, calls } = fakeFetch(testCase.handler ?? (() => status(200)));
      const fake = fakeResolve(testCase.dns ?? {});
      const resolves = fake.calls;
      const resolve: ResolveFn =
        testCase.dnsError === undefined
          ? fake.resolve
          : (hostname) => {
              resolves.push(hostname);
              return Promise.reject(
                Object.assign(new Error("lookup failed"), { code: testCase.dnsError }),
              );
            };
      const io = createRealIo({ fetch, resolve });
      const answer = await io.probeUrl(testCase.url, 5000);
      expect(calls.map((call) => call.init.method)).toEqual(testCase.methods);
      if (testCase.resolves !== undefined) expect(resolves).toHaveLength(testCase.resolves);
      if (testCase.reason === null) expect(answer).toEqual({ reachable: true });
      else expect(answer).toEqual({ reachable: false, reason: testCase.reason });
    });
  }

  it(`${REFUSED}: every refusal in the table made zero requests`, () => {
    const refused = CASES.filter(
      (testCase) => testCase.reason !== null && testCase.methods.length === 0,
    );
    expect(refused.length).toBeGreaterThan(60);
  });

  it("a name whose resolver throws instead of rejecting is a DNS failure, not an exception", async () => {
    const { fetch, calls } = fakeFetch(() => status(200));
    const resolve: ResolveFn = () => {
      throw new Error("resolver exploded");
    };
    const answer = await createRealIo({ fetch, resolve }).probeUrl(`https://${PUBLIC_HOST}/`, 5000);
    expect(answer).toEqual({ reachable: false, reason: "DNS failure" });
    expect(calls).toHaveLength(0);
  });
});
