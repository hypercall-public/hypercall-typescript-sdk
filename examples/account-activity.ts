import { HttpTransport, InfoClient } from "@hypercallxyz/sdk";

const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const [binding, ownedCode, referred, transfers] = await Promise.all([
  info.referralBinding({ wallet }),
  info.referralCodeByOwner({ wallet }),
  info.referredWallets({ wallet, limit: 10, offset: 0 }),
  info.transfers({ wallet, limit: 10 }),
]);

console.log({
  referrer: binding.referrer_wallet,
  ownedReferralCode: ownedCode?.code,
  referredWallets: referred.data.length,
  latestTransfer: transfers.data[0]?.transaction_type,
  nextTransferCursor: transfers.page.next_cursor,
});
