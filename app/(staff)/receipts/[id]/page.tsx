import Link from "next/link";
import { receipt } from "@/lib/collections";
import { money } from "@/lib/money";
import { Print, Void } from "./controls";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const r = await receipt((await params).id);
  return (
    <>
      <article className="panel receipt">
        <p>Calvary Baptist Church</p>
        <h1>Receipt {r.receipt}</h1>
        {r.collection_voids && (
          <p className="alert">
            <strong>VOID</strong> · {r.collection_voids.reason}
          </p>
        )}
        <dl>
          <dt>Received from</dt>
          <dd>{r.payer}</dd>
          <dt>Date and method</dt>
          <dd>
            {r.business_date} · {r.method}
          </dd>
          <dt>Received by</dt>
          <dd>{r.officer}</dd>
        </dl>
        {r.reference && <p>Reference: {r.reference}</p>}
        {r.allocations.map((l) => (
          <p key={l.id}>
            {l.category_label} · {money(r.currency, l.amount)}
          </p>
        ))}
        <h2>Total {money(r.currency, r.total)}</h2>
        {r.replacement && (
          <p>
            <Link href={"/receipts/" + r.replacement.id}>
              Replacement {r.replacement.receipt}
            </Link>
          </p>
        )}
        {r.replaces && (
          <p>
            <Link href={"/receipts/" + r.replaces}>Original receipt</Link>
          </p>
        )}
      </article>
      <div className="commands no-print">
        <Print />
        <a href={"/receipts/" + r.id + "/pdf"}>Download PDF</a>
        {!r.collection_voids && (
          <>
            <Link href={"/contributions/new?replace=" + r.id}>
              Correct receipt
            </Link>
            <Void id={r.id} />
          </>
        )}
      </div>
    </>
  );
}
