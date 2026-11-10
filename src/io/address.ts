/**
 * IP address classification for the URL probe (SSRF guard, OWASP A10, A12.11).
 *
 * `blocked` is never probed: "this network" 0.0.0.0/8, loopback (127.0.0.0/8, ::1),
 * unspecified (::), link-local (169.254.0.0/16, fe80::/10, which holds the
 * 169.254.169.254 metadata address), multicast and reserved (224.0.0.0/3, ff00::/8),
 * the other cloud metadata addresses (100.100.100.200, 168.63.129.16, 192.0.0.192,
 * fd00:ec2::254), IPv4-mapped, IPv4-compatible and IPv4-translated IPv6 (::ffff:a.b.c.d,
 * ::a.b.c.d, ::ffff:0:a.b.c.d), Teredo (2001::/32) and NAT64 local use (64:ff9b:1::/48).
 * NAT64 (64:ff9b::/96) and 6to4 (2002::/16) take the verdict of the IPv4 address
 * they carry. An IPv6 address outside global unicast 2000::/3 and the unique local
 * range is blocked (fail closed).
 *
 * `private` is probed only on explicit config opt-in (`allowPrivateNetworks`):
 * RFC 1918 (10/8, 172.16/12, 192.168/16), shared address space 100.64.0.0/10,
 * unique local fc00::/7.
 *
 * Anything that does not parse is `blocked` (fail closed).
 */

export type AddressClass = "public" | "private" | "blocked";

/** Dotted-quad IPv4 (canonical form, as the WHATWG URL parser and the resolver give it). */
export function parseIPv4(text: string): number[] | null {
  const parts = text.split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    octets.push(value);
  }
  return octets;
}

/** IPv6 as eight 16-bit groups. Handles `::` and an embedded IPv4 tail; strips a zone id. */
export function parseIPv6(text: string): number[] | null {
  const bare = (text.startsWith("[") && text.endsWith("]") ? text.slice(1, -1) : text).split("%")[0] ?? "";
  if (!bare.includes(":")) return null;
  // An embedded IPv4 tail (`::ffff:1.2.3.4`) becomes its two hex groups.
  let head = bare;
  const lastColon = bare.lastIndexOf(":");
  const tailText = bare.slice(lastColon + 1);
  if (tailText.includes(".")) {
    const v4 = parseIPv4(tailText);
    if (v4 === null) return null;
    const hexGroup = (high: number, low: number): string => ((high << 8) | low).toString(16);
    head = `${bare.slice(0, lastColon + 1)}${hexGroup(v4[0] ?? 0, v4[1] ?? 0)}:${hexGroup(v4[2] ?? 0, v4[3] ?? 0)}`;
  }
  const halves = head.split("::");
  if (halves.length > 2) return null;
  const groups = (part: string): number[] | null => {
    if (part === "") return [];
    const out: number[] = [];
    for (const group of part.split(":")) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
      out.push(parseInt(group, 16));
    }
    return out;
  };
  const left = groups(halves[0] ?? "");
  const right = halves.length === 2 ? groups(halves[1] ?? "") : [];
  if (left === null || right === null) return null;
  let all: number[];
  if (halves.length === 2) {
    const missing = 8 - left.length - right.length;
    if (missing < 1) return null;
    all = [...left, ...Array<number>(missing).fill(0), ...right];
  } else all = left;
  return all.length === 8 ? all : null;
}

const METADATA_V4 = new Set(["100.100.100.200", "168.63.129.16", "192.0.0.192"]);

function classifyV4(octets: readonly number[]): AddressClass {
  const [a = 0, b = 0] = octets;
  if (METADATA_V4.has(octets.join("."))) return "blocked";
  if (a === 0 || a === 127 || a >= 224) return "blocked";
  if (a === 169 && b === 254) return "blocked";
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return "private";
  if (a === 100 && b >= 64 && b <= 127) return "private";
  return "public";
}

const embedded = (high: number, low: number): number[] => [high >> 8, high & 0xff, low >> 8, low & 0xff];

function classifyV6(g: readonly number[]): AddressClass {
  const at = (index: number): number => g[index] ?? 0;
  const zeros = (from: number, to: number): boolean => g.slice(from, to).every((group) => group === 0);
  // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible (::a.b.c.d), :: and ::1.
  if (zeros(0, 5) && (at(5) === 0xffff || at(5) === 0)) return "blocked";
  // IPv4-translated (::ffff:0:a.b.c.d, SIIT).
  if (zeros(0, 4) && at(4) === 0xffff && at(5) === 0) return "blocked";
  if (at(0) === 0x64 && at(1) === 0xff9b) {
    // NAT64: the well-known /96 carries an IPv4 address; the rest of 64:ff9b::/32
    // (64:ff9b:1::/48 local use) is refused.
    return zeros(2, 6) ? classifyV4(embedded(at(6), at(7))) : "blocked";
  }
  if (at(0) === 0x2002) return classifyV4(embedded(at(1), at(2))); // 6to4
  if (at(0) === 0x2001 && at(1) === 0) return "blocked"; // Teredo 2001::/32
  if (at(0) === 0xfd00 && at(1) === 0x0ec2 && zeros(2, 7) && at(7) === 0x0254) return "blocked";
  if ((at(0) & 0xfe00) === 0xfc00) return "private"; // unique local fc00::/7
  // Only global unicast 2000::/3 is public. Everything else (fe00::/9 with link-local
  // fe80::/10 and site-local fec0::/10, multicast ff00::/8, the reserved gaps such as
  // fbff::1, discard 100::/64) is refused: fail closed.
  return (at(0) & 0xe000) === 0x2000 ? "public" : "blocked";
}

/** Class of an IP literal (IPv4 dotted quad, IPv6 with or without brackets). */
export function classifyAddress(address: string): AddressClass {
  const v4 = parseIPv4(address);
  if (v4 !== null) return classifyV4(v4);
  const v6 = parseIPv6(address);
  return v6 === null ? "blocked" : classifyV6(v6);
}

/** True when an address may be probed (`public`, or `private` with the opt-in). */
export function isAddressAllowed(address: string, allowPrivate: boolean): boolean {
  const verdict = classifyAddress(address);
  return verdict === "public" || (verdict === "private" && allowPrivate);
}

/** True for an IP literal (the resolver is skipped for it). */
export function isIpLiteral(host: string): boolean {
  return parseIPv4(host) !== null || parseIPv6(host) !== null;
}
