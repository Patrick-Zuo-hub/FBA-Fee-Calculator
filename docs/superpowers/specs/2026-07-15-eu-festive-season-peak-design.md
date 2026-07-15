# EU/UK Festive Season Peak Fees Design

## Goal

Add an optional festive-season peak fee mode to the EU/UK FBA calculator using Amazon's rate card effective 1 July 2026. The calculator must continue to calculate the existing non-peak fees when the option is off.

## Source And Period

- Source: `2026 Update/260630-FBA-Rate-Card-EN1.pdf`.
- Peak period: 15 October 2026 through 14 January 2027.
- From 15 January 2027, the rate card states that fees return to the unchanged 2026 non-peak rates.

## User Experience

- Add a `Festive season peak` checkbox in the EU/UK calculator's additional-conditions area.
- The checkbox defaults to off.
- When enabled, use the applicable 2026 peak fee column from the source rate card.
- The result must identify the peak fee and show its effective period.
- The result must include a warning that Amazon's source table excludes apparel, while this calculator does not collect an apparel flag; apparel results require manual review.
- Keep the existing 1.5% fuel and logistics surcharge as a separate, independently controlled calculation.
- Save and restore the peak toggle with each EU/UK local-history record.

## Fee Coverage

The data model will retain the existing non-peak tables and add peak variants only where Amazon supplies distinct peak values.

- Local and Pan-EU standard fees: apply peak values to large envelope, extra-large envelope, small parcel, and standard parcel where listed. Unchanged envelope and all oversize rows continue using non-peak values.
- Local and Pan-EU selected parcel categories: apply peak values to each listed parcel tier.
- EFN and UK/EU Remote standard fees: apply peak values to parcel tiers and the limited changed envelope rows supplied by the peak table. Oversize rows and any route without a peak-column value remain on non-peak rates.
- EFN and UK/EU Remote selected parcel categories: apply peak values for each listed tier and published route.
- Low-Price FBA remains outside the peak table and therefore remains unchanged.

## Architecture

- Store peak rows in `History/fba-fee-data.js`, adjacent to the corresponding non-peak tables, to preserve the existing classification and pricing helpers.
- Add one input property, `festiveSeasonPeak`, to the EU/UK form state.
- Select the peak data table inside the same local, EFN, and selected-category paths that currently select standard fee tables.
- Keep unsupported and unchanged rows explicit: fall back to their non-peak table rather than estimating an uplift.
- Add a view-model entry for the peak fee status so the result rendering can display it independently from the fuel surcharge.

## Testing

- Add automated tests that prove the toggle changes a published local parcel fee and an EFN/remote parcel fee.
- Add a test that unchanged oversize fees remain unchanged when peak mode is enabled.
- Add a test for the apparel manual-review warning.
- Extend UI tests to assert that the new option is present, unchecked by default, and persisted in history inputs.
- Run the existing surcharge, history, unified-site, and build tests after implementation.

## Non-Goals

- No automatic date-based activation; the user controls the scenario with the checkbox.
- No apparel classification field in this release.
- No changes to storage, referral, prep, return-processing, or fuel-surcharge rules.
