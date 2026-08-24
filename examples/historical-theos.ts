import { type HistoricalTheoData, HttpTransport, InfoClient, type Instrument } from "@hypercallxyz/sdk";

const currency = "SPCX";
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const instruments = await info.instruments({ currency });
const firstInstrument: Instrument | undefined = instruments.result?.[0];

if (!firstInstrument) {
  console.log({ currency, historicalTheoPoints: 0 });
} else {
  const single = await info.historicalTheos({
    instrumentName: firstInstrument.instrument_name,
    interval: "1h",
    limit: 48,
  });

  const batch = await info.historicalTheosBatch({
    instrumentNames: [firstInstrument.instrument_name],
    interval: "1h",
    limit: 48,
  });

  const singleData: HistoricalTheoData | undefined = single.data;
  const batchData: HistoricalTheoData | undefined = batch.data?.[firstInstrument.instrument_name];

  console.log({
    instrument: firstInstrument.instrument_name,
    singlePoints: singleData?.points.length,
    batchPoints: batchData?.points.length,
    latestTheo: singleData?.points.at(-1)?.theoretical_price,
  });
}
