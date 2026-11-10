/**
 * Registry of the per-family tag visitors, one list per region. This is the
 * ONLY hand-kept list of families in src/tags: a new family adds its visitor
 * here (A9 can check that every fmTagBody / bodyTagBody alternative has one).
 * Order does not matter: each visitor answers only for its own parser rule.
 */
import type { BodyTagData, FamilyVisitor, FrontmatterTagData } from "./base.js";
import { ContentVisitor } from "./content.js";
import { CountVisitor } from "./count.js";
import { FilenameVisitor } from "./filename.js";
import { FormatVisitor } from "./format.js";
import { IoVisitor } from "./io.js";
import { BodyOrderVisitor, OrderVisitor } from "./order.js";
import { PatternVisitor } from "./pattern.js";
import { BodyPresenceVisitor, FrontmatterPresenceVisitor } from "./presence.js";
import { RangeVisitor } from "./range.js";
import { RepeatVisitor } from "./repeat.js";
import { BodyUniqueNamesVisitor, FrontmatterUniqueNamesVisitor } from "./unique-names.js";
import { ValueVisitor } from "./value.js";

export const FRONTMATTER_TAG_VISITORS: readonly FamilyVisitor<FrontmatterTagData>[] = [
  new FrontmatterPresenceVisitor(),
  new FormatVisitor(),
  new ValueVisitor(),
  new CountVisitor(),
  new RangeVisitor(),
  new OrderVisitor(),
  new IoVisitor(),
  new FilenameVisitor(),
  new FrontmatterUniqueNamesVisitor(),
];

export const BODY_TAG_VISITORS: readonly FamilyVisitor<BodyTagData>[] = [new BodyPresenceVisitor(), new ContentVisitor(), new PatternVisitor(), new RepeatVisitor(), new BodyOrderVisitor(), new BodyUniqueNamesVisitor()];
