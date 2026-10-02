import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ISO_DATE, todayIn, weekStartOf } from "@/lib/dates";
import { WeekReportDocument } from "@/lib/pdf/week-report";
import { weekReport } from "@/lib/report";
import { requireShop } from "@/lib/shop";
import { weekStatuses } from "@/lib/weeks";

/** GET /weeks/2026-09-21/report → the PDF for that (closed) week. */
export async function GET(_req: Request, { params }: { params: Promise<{ start: string }> }) {
  const { start } = await params;
  const { shop, role } = await requireShop();
  if (role !== "manager") return new Response("Reports are for managers.", { status: 403 });

  if (!ISO_DATE.test(start) || weekStartOf(start) !== start) {
    return new Response("Not a week.", { status: 404 });
  }
  const status = (await weekStatuses(shop.id, [start])).get(start);
  if (status !== "closed") {
    return new Response("The report is ready once the week is closed.", { status: 409 });
  }

  const report = await weekReport(shop, start);
  const pdf = await renderToBuffer(
    createElement(WeekReportDocument, { report, generatedOn: todayIn() }) as Parameters<typeof renderToBuffer>[0],
  );

  const slug = shop.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `petal-${slug}-week-${report.week.number}-${start.slice(0, 4)}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
