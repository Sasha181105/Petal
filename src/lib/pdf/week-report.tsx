import "server-only";
import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WasteReason } from "@/db/schema";
import { change, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import type { WeekReport } from "@/lib/report";

// Petal's own type as TrueType: the PDF renderer can't reliably read WOFF.
// outputFileTracingIncludes in next.config.ts ships these with the server.
const font = (file: string) => path.join(process.cwd(), "src", "assets", "fonts", file);

Font.register({
  family: "Petal Sans",
  fonts: [
    { src: font("IBMPlexSans-Regular.ttf") },
    { src: font("IBMPlexSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.register({ family: "Petal Mono", src: font("IBMPlexMono-Regular.ttf") });
Font.register({
  family: "Petal Serif",
  fonts: [
    { src: font("InstrumentSerif-Regular.ttf") },
    { src: font("InstrumentSerif-Italic.ttf"), fontStyle: "italic" },
  ],
});
// Keep words whole; the default hyphenation splits flower names oddly.
Font.registerHyphenationCallback((word) => [word]);

const C = {
  // White page: reports get printed, and a tinted page wastes ink.
  paper: "#ffffff",
  hairline: "#d6cab5",
  soil: "#2f2a24",
  soilSoft: "#6f6558",
  moss: "#3f5a3c",
  clay: "#97573a",
  roseDeep: "#9a5b58",
  chartMoney: "#a0532f",
  roseWash: "#f1e1dc",
};

const REASON_LABEL: Record<WasteReason, string> = {
  wilted: "Wilted",
  damaged: "Damaged",
  unsold: "Unsold",
  other: "Other",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.soil,
    fontFamily: "Petal Sans",
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
  },
  caps: { fontFamily: "Petal Mono", fontSize: 7, letterSpacing: 1.2, textTransform: "uppercase", color: C.soilSoft },
  serif: { fontFamily: "Petal Serif" },
  rule: { borderBottomWidth: 0.75, borderBottomColor: C.hairline },
  ruleDark: { borderBottomWidth: 1, borderBottomColor: C.soil },
  row: { flexDirection: "row" },
  th: { paddingVertical: 4 },
  td: { paddingVertical: 3 },
  num: { textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

/** "down 12% vs week 38": words, not arrows (the PDF font subset has none). */
function delta(now: number, before: number, previousNumber: number) {
  const d = change(now, before);
  if (d === null) return "Nothing to compare with the week before";
  if (d === 0) return `No change vs week ${previousNumber}`;
  return `${d > 0 ? "Up" : "Down"} ${Math.abs(Math.round(d * 100))}% vs week ${previousNumber}`;
}

export function WeekReportDocument({ report, generatedOn }: { report: WeekReport; generatedOn: string }) {
  const { shop, week, now, before, flowers, entries, previousNumber } = report;
  const money = (c: number, decimals = 0) => formatMoney(c, shop.currency, decimals);
  // Purchase prices only come from deliveries: without them the report counts stems only.
  const withMoney = shop.deliveriesEnabled;
  const measure = (f: { lostCents: number; wastedStems: number }) => (withMoney ? f.lostCents : f.wastedStems);
  const top = [...flowers]
    .filter((f) => measure(f) > 0)
    .sort((a, b) => measure(b) - measure(a))
    .slice(0, 5);
  const topMax = Math.max(...top.map(measure), 1);
  const perDay = Math.round(now.wastedStems / 7);
  const range = `${fmtDate(week.start, { day: "numeric", month: "long" })} – ${fmtDate(week.end, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;

  // Flower table columns: [label, width, align]
  const cols: [string, string, "left" | "right"][] = withMoney
    ? [
        ["Flower", "34%", "left"],
        ["Wilted", "11%", "right"],
        ["Damaged", "11%", "right"],
        ["Unsold", "11%", "right"],
        ["Other", "9%", "right"],
        ["Binned", "11%", "right"],
        ["Lost", "13%", "right"],
      ]
    : [
        ["Flower", "40%", "left"],
        ["Wilted", "12%", "right"],
        ["Damaged", "12%", "right"],
        ["Unsold", "12%", "right"],
        ["Other", "12%", "right"],
        ["Binned", "12%", "right"],
      ];

  return (
    <Document title={`Petal · Week ${week.number} · ${shop.name}`} author="Petal" creator="Petal">
      <Page size="A4" style={s.page} wrap>
        {/* Masthead */}
        <View style={[s.row, s.rule, { justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 8 }]}>
          <Text style={[s.serif, { fontSize: 20, fontStyle: "italic" }]}>Petal</Text>
          <Text style={s.caps}>Weekly waste report · {shop.name}</Text>
        </View>

        {/* Title */}
        <View style={{ marginTop: 16 }}>
          <Text style={s.caps}>{range}</Text>
          <Text style={[s.serif, { fontSize: 40, marginTop: 4 }]}>
            Week {week.number} <Text style={{ fontStyle: "italic", color: C.roseDeep }}>in the bin.</Text>
          </Text>
        </View>

        {/* Headline figures */}
        <View style={[s.row, { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.soil }]}>
          <View style={{ width: "46%" }}>
            <Text style={s.caps}>{withMoney ? "Money lost" : "Stems binned"}</Text>
            <Text style={[s.serif, { fontSize: 46, color: C.clay, marginTop: 2 }]}>
              {withMoney ? money(now.lostCents) : formatNumber(now.wastedStems)}
            </Text>
            <Text style={{ color: C.soilSoft, marginTop: 2 }}>
              {withMoney
                ? delta(now.lostCents, before.lostCents, previousNumber)
                : delta(now.wastedStems, before.wastedStems, previousNumber)}
            </Text>
          </View>
          {(withMoney
            ? [
                ["Stems binned", formatNumber(now.wastedStems), delta(now.wastedStems, before.wastedStems, previousNumber)],
                ["Waste rate", now.wasteRate === null ? "—" : formatPercent(now.wasteRate), `of ${formatNumber(now.deliveredStems)} delivered`],
                ["Costliest", now.worstFlower?.name ?? "—", now.worstFlower ? `${money(now.worstFlower.lostCents)} lost` : "Nothing binned"],
              ]
            : [
                ["Entries", formatNumber(entries.length), "logged this week"],
                ["Per day", formatNumber(perDay), "stems on average"],
                ["Most binned", now.mostBinned?.name ?? "—", now.mostBinned ? `${formatNumber(now.mostBinned.stems)} stems` : "Nothing binned"],
              ]
          ).map(([label, value, note]) => (
            <View key={label} style={{ width: "18%", paddingLeft: 8, borderLeftWidth: 0.75, borderLeftColor: C.hairline }}>
              <Text style={s.caps}>{label}</Text>
              <Text style={[s.serif, { fontSize: 20, marginTop: 6 }]}>{value}</Text>
              <Text style={{ color: C.soilSoft, fontSize: 7.5, marginTop: 2 }}>{note}</Text>
            </View>
          ))}
        </View>

        {withMoney && now.unpricedFlowers > 0 && (
          <Text style={{ marginTop: 10, color: C.clay }}>
            {now.unpricedFlowers} flower{now.unpricedFlowers === 1 ? "" : "s"} binned this week had no delivery
            logged, so no price: money lost is lower than it really is.
          </Text>
        )}

        {/* Top five */}
        {top.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <Text style={[s.serif, { fontSize: 18 }]}>
              The five <Text style={{ fontStyle: "italic", color: C.roseDeep }}>worst</Text>
            </Text>
            <View style={[s.ruleDark, { marginTop: 6 }]} />
            {top.map((f, i) => (
              <View key={f.id} style={[s.row, s.rule, { alignItems: "center", paddingVertical: 3.5 }]}>
                <Text style={[s.caps, { width: 18 }]}>0{i + 1}</Text>
                <Text style={{ width: "28%", fontWeight: 600 }}>{f.name}</Text>
                <View style={{ flexGrow: 1, height: 7, marginRight: 8 }}>
                  <View
                    style={{
                      width: `${(measure(f) / topMax) * 100}%`,
                      height: 7,
                      backgroundColor: C.chartMoney,
                      borderTopRightRadius: 2,
                      borderBottomRightRadius: 2,
                    }}
                  />
                </View>
                <Text style={[s.num, { width: 70, fontWeight: 600 }]}>
                  {withMoney ? money(f.lostCents) : `${formatNumber(f.wastedStems)} stems`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Every flower, by reason */}
        <View style={{ marginTop: 18 }}>
          <Text style={[s.serif, { fontSize: 18 }]}>Every flower, by reason</Text>
          <View style={[s.row, s.ruleDark, { marginTop: 6 }]}>
            {cols.map(([label, width, align]) => (
              <Text key={label} style={[s.caps, s.th, { width, textAlign: align }]}>
                {label}
              </Text>
            ))}
          </View>
          {flowers.length === 0 && <Text style={[s.td, { color: C.soilSoft }]}>Nothing was binned this week.</Text>}
          {flowers.map((f) => (
            <View key={f.id} style={[s.row, s.rule]} wrap={false}>
              <Text style={[s.td, { width: cols[0][1] }]}>{f.name}</Text>
              {(["wilted", "damaged", "unsold", "other"] as WasteReason[]).map((r, i) => (
                <Text key={r} style={[s.td, s.num, { width: cols[i + 1][1], color: f.reasons[r] ? C.soil : C.hairline }]}>
                  {f.reasons[r] ? formatNumber(f.reasons[r]) : "–"}
                </Text>
              ))}
              <Text style={[s.td, s.num, { width: cols[5][1], fontWeight: withMoney ? 400 : 600 }]}>
                {formatNumber(f.wastedStems)}
              </Text>
              {withMoney && (
                <Text style={[s.td, s.num, { width: cols[6][1], fontWeight: 600 }]}>{money(f.lostCents)}</Text>
              )}
            </View>
          ))}
          {flowers.length > 0 && (
            <View style={[s.row, { borderTopWidth: 1, borderTopColor: C.soil }]}>
              <Text style={[s.td, { width: withMoney ? "76%" : "88%", fontWeight: 600 }]}>Total</Text>
              <Text style={[s.td, s.num, { width: withMoney ? "11%" : "12%", fontWeight: 600 }]}>
                {formatNumber(now.wastedStems)}
              </Text>
              {withMoney && (
                <Text style={[s.td, s.num, { width: "13%", fontWeight: 600 }]}>{money(now.lostCents)}</Text>
              )}
            </View>
          )}
        </View>

        {/* Every entry, straight after the table (no forced page break, so no half-empty pages). */}
        <View style={{ marginTop: 22 }}>
          <Text style={[s.serif, { fontSize: 18 }]} minPresenceAhead={60}>
            All entries <Text style={{ color: C.soilSoft, fontSize: 12 }}>· {entries.length}</Text>
          </Text>
          <View style={[s.row, s.ruleDark, { marginTop: 6 }]} wrap={false}>
            {[
              ["Date", "16%", "left"],
              ["Flower", "32%", "left"],
              ["Stems", "10%", "right"],
              ["Reason", "14%", "left"],
              ["Logged by", "28%", "left"],
            ].map(([label, width, align]) => (
              <Text
                key={label}
                style={[s.caps, s.th, { width, textAlign: align as "left" | "right", paddingLeft: align === "left" && label !== "Date" ? 8 : 0 }]}
              >
                {label}
              </Text>
            ))}
          </View>
          {entries.length === 0 && <Text style={[s.td, { color: C.soilSoft }]}>No entries this week.</Text>}
          {entries.map((e, i) => (
            <View key={i} style={[s.row, s.rule]} wrap={false}>
              <Text style={[s.td, { width: "16%" }]}>{fmtDate(e.date, { weekday: "short", day: "numeric", month: "short" })}</Text>
              <Text style={[s.td, { width: "32%", paddingLeft: 8 }]}>{e.flower}</Text>
              <Text style={[s.td, s.num, { width: "10%" }]}>{formatNumber(e.quantity)}</Text>
              <Text style={[s.td, { width: "14%", paddingLeft: 8 }]}>{REASON_LABEL[e.reason]}</Text>
              <Text style={[s.td, { width: "28%", paddingLeft: 8, color: C.soilSoft }]}>{e.loggedBy}</Text>
            </View>
          ))}
        </View>

        {/* Footer on every page */}
        <View style={s.footer} fixed>
          <Text style={s.caps}>
            Petal · Week {week.number} · generated {fmtDate(generatedOn, { day: "numeric", month: "short", year: "numeric" })}
          </Text>
          <Text style={s.caps} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
