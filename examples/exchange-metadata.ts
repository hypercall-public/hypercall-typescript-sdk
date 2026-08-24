import { type ExchangeInfoResponse, HttpTransport, InfoClient } from "@hypercallxyz/sdk";

const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const exchangeInfo: ExchangeInfoResponse = await info.exchangeInfo();

console.log({
  exchangeAddress: exchangeInfo.exchange_address,
  chainId: exchangeInfo.chain_id,
  signingDomain: exchangeInfo.signing_domain.name,
});
