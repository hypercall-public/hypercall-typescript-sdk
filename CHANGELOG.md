# Changelog

## 0.2.0 - Unreleased

- Add TEE perp trading: `teePerpSubmitOrder` (limit GTC/IOC/ALO, market as IOC), `teePerpSubmitTriggerOrder`
  (stop/take-profit, market or limit), `teePerpSubmitOrderBatch` (scale, `normalTpsl`, `positionTpsl`),
  `teePerpCancelByCloid`, `teePerpCancelByOid`, and `teePerpUpdateLeverage`, with typed responses, the 29
  `TeePerpErrorCode` values, and the 16 `PerpRejectionReasonCode` values.
- Add `teePerpPreview` (order, order batch, leverage) and `teePerpMarkets` info reads.
- Add TEE API wallet enrollment (`teeApiWalletApprovalRequest`, `teeApiWalletApprovalSubmit`,
  `teeApiWalletApprovalProgress`) and Hyperliquid `userRole` / `activeAssetData` readbacks.
- Add `@hypercallxyz/sdk/signing` TEE perp helpers: `HypercallApiSign` / `HypercallManagerSign` typed-data builders,
  server-clock nonces (`createServerClock`, `TeePerpNonceManager`), 1e8 encoding, market and trigger slippage pricing,
  scale-leg and bracket builders, and `Account.approveZeroFeeBuilder` calldata. EIP-712 digests are covered by
  known-answer tests computed with the server's alloy structs.
- `ExchangeInfoResponse` gains the optional `hl_builder_address`.

## 0.1.0 - 2026-08-24

- Prepare the first public npm release as `@hypercallxyz/sdk`.
- Refresh profile, portfolio, order, fill, and trade types against the production API contract.
- Add trade lookup, order status, risk grid, referral, transfer-history, and revoke-all-agents methods.
- Add reduce-only order and referral EIP-712 signing helpers with signature recovery coverage.
- Point npm package metadata to the `hypercall-public` repository and configure the scoped package for public access.
