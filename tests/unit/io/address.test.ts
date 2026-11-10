/**
 * Address classification of the URL probe (SSRF guard, OWASP A10; A12.11). Blocked
 * addresses are never probed; private ranges only with the config opt-in.
 */
import { describe, expect, it } from "vitest";
import { classifyAddress, isAddressAllowed } from "../../../src/io/index.js";

const BLOCKED = [
  // this network, loopback
  "0.0.0.0",
  "0.1.2.3",
  "127.0.0.1",
  "127.255.255.254",
  "::1",
  "[::1]",
  "::",
  // link-local and cloud metadata
  "169.254.0.1",
  "169.254.169.254",
  "169.254.170.2",
  "fe80::1",
  "fe80::1%eth0",
  "febf::1",
  "fec0::1",
  "100.100.100.200",
  "168.63.129.16",
  "192.0.0.192",
  "fd00:ec2::254",
  // multicast and reserved
  "224.0.0.1",
  "239.255.255.255",
  "240.0.0.1",
  "255.255.255.255",
  "ff02::1",
  // IPv4-mapped and IPv4-compatible IPv6, public or not
  "::ffff:127.0.0.1",
  "::ffff:7f00:1",
  "::ffff:8.8.8.8",
  "0:0:0:0:0:ffff:a00:1",
  "::8.8.8.8",
  // IPv4 inside NAT64 and 6to4 take the verdict of the IPv4 address
  "64:ff9b::7f00:1",
  "64:ff9b::127.0.0.1",
  "2002:7f00:1::",
  "2002:a9fe:a9fe::",
  // IPv4-translated (SIIT), NAT64 local use, Teredo
  "::ffff:0:8.8.8.8",
  "::ffff:0:808:808",
  "::ffff:0:7f00:1",
  "64:ff9b:1::",
  "64:ff9b:1::808:808",
  "64:ff9b:1:ffff::1",
  "2001::1",
  "2001:0:4136:e378:8000:63bf:3fff:fdd2",
  // outside global unicast and unique local: reserved gaps, fail closed
  "fe00::1",
  "fe7f::1",
  "fbff::1",
  "100::1",
  "4000::1",
  "8000::1",
  // not an address: fail closed
  "",
  "not-an-ip",
  "1.2.3",
  "1.2.3.4.5",
  "256.1.1.1",
  "1::2::3",
  "12345::1",
];

const PRIVATE = ["10.0.0.1", "10.255.255.255", "172.16.0.1", "172.31.255.255", "192.168.1.1", "100.64.0.1", "100.127.255.255", "fc00::1", "fd12:3456::1", "64:ff9b::a00:1", "2002:c0a8:101::"];

const PUBLIC = ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.15.255.255", "172.32.0.1", "100.63.255.255", "100.128.0.1", "169.253.0.1", "223.255.255.255", "2606:4700:4700::1111", "2001:db8::1", "64:ff9b::808:808"];

describe("classifyAddress", () => {
  for (const address of BLOCKED) {
    it(`blocked: ${JSON.stringify(address)}`, () => expect(classifyAddress(address)).toBe("blocked"));
  }
  for (const address of PRIVATE) {
    it(`private: ${address}`, () => expect(classifyAddress(address)).toBe("private"));
  }
  for (const address of PUBLIC) {
    it(`public: ${address}`, () => expect(classifyAddress(address)).toBe("public"));
  }
});

describe("isAddressAllowed", () => {
  it("public is allowed with or without the opt-in", () => {
    for (const address of PUBLIC) {
      expect(isAddressAllowed(address, false)).toBe(true);
      expect(isAddressAllowed(address, true)).toBe(true);
    }
  });

  it("private is blocked by default and allowed only with the opt-in", () => {
    for (const address of PRIVATE) {
      expect(isAddressAllowed(address, false), address).toBe(false);
      expect(isAddressAllowed(address, true), address).toBe(true);
    }
  });

  it("blocked stays blocked even with the opt-in (loopback, link-local, metadata, mapped)", () => {
    for (const address of BLOCKED) expect(isAddressAllowed(address, true), address).toBe(false);
  });
});
