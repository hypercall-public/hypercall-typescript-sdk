import { type DirectiveStatusResponse, HttpTransport, InfoClient } from "@hypercallxyz/sdk";

const wallet = "0xe55b5e5e38f73c30aa367d310d6247f3f9a5e86e";
const transport = new HttpTransport({ apiUrl: "https://api.hypercall.xyz" });
const info = new InfoClient({ transport });

const history = await info.withdrawalHistory({ wallet, limit: 5 });
const latest: DirectiveStatusResponse | undefined = history.withdrawals[0];

if (!latest) {
  console.log({ wallet, withdrawalCount: 0 });
} else {
  const status = await info.directiveStatus({
    directiveId: latest.directive_id,
  });

  console.log({
    directiveId: status.directive_id,
    actionKey: status.action_key,
    domainStatus: status.domain_status,
    deliveryStatus: status.delivery_status,
    txHash: status.tx_hash,
  });
}
