# NA Peak Fulfillment Fees Design

## Goal

Add an optional 2026 peak-period fulfilment fee mode to the North America calculator for US and CA, covering October 15, 2026 through January 14, 2027.

## Behavior

- Add a user-controlled checkbox in the North America calculator optional conditions.
- Leave the checkbox off by default so existing calculations remain unchanged.
- When enabled for US non-apparel items, use the 2026 US peak fulfilment fee table instead of the current base fulfilment fee table.
- When enabled for CA, use the CA peak-period fulfilment fee column instead of the current non-peak fulfilment fee column.
- When enabled for US apparel or dangerous goods, keep the current base fee and show a note because the provided US peak table is marked as excluding apparel and does not include dangerous-goods rows.
- When enabled for MX, keep the current base fee and show a note because no MX peak fee table was provided.
- Continue applying fuel and logistics surcharge, SIPP adjustments, low-inventory fees, and overmax fees after the chosen base fee.

## Data Source

- `2026 Update/US 2026 Peak Fulfillment fees.docx`
- `2026 Update/CA 2026 Peak Fulfillment fees.docx`

## Test Strategy

- Add a targeted smoke test that proves US non-apparel peak mode changes the displayed total and includes the peak note.
- Add a targeted smoke test that proves CA peak mode changes the displayed total and includes the peak note.
- Add a targeted smoke test that proves US apparel keeps the non-peak base fee and shows an unsupported note.
