import { HttpTransport, InfoClient, type RfqQuote } from "@hypercallxyz/sdk";

const rfqId: string | undefined = undefined;
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

if (!rfqId) {
  console.log({ message: "Set rfqId to an RFQ ID returned by the submit flow." });
} else {
  const rfq = await info.rfqStatus({ rfqId });
  const bestQuote: RfqQuote | undefined = rfq.quotes[0];

  console.log({
    rfqId: rfq.rfq_id,
    status: rfq.status,
    quoteCount: rfq.quotes.length,
    bestQuoteId: bestQuote?.quote_id,
    bestQuoteNetPremium: bestQuote?.net_premium,
  });
}
