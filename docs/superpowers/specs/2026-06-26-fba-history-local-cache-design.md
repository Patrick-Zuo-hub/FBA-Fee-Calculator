# FBA History Local Cache Design

## Goal

Add a recent calculation history feature to each calculator page so users can continue from a recent successful FBA calculation after refreshing or reopening the page.

The feature is intended to behave like a calculator-style local memory:
- quick to save
- quick to restore
- not shared between users
- not synchronized across devices

## Scope

Pages in scope:
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`

Included in scope:
- page-local history for successful FBA calculations
- local persistence with `localStorage`
- recent-history UI entry and drawer
- restore flow that repopulates the FBA form and result state
- editable per-record note
- moving the primary `计算FBA费用` button below the dimensions / weight inputs

Out of scope for this version:
- profit-estimator history
- cross-page shared history
- cloud sync
- multi-device sync
- record comparison
- exports
- server storage

## Product Positioning

This feature is not an audit system or a shared team archive.

It is a per-browser convenience cache intended to solve:
- accidental refresh
- closing and reopening the page
- making small changes to a previous calculation without retyping every field

## Storage Model

Use `localStorage`.

Each calculator page stores its own independent record list. Histories must never mix across the three calculators.

Suggested storage keys:
- `fba-history-na`
- `fba-history-eu-uk`
- `fba-history-walmart`

Behavior:
- newest record is inserted at the beginning of the list
- maximum records per page: `20`
- when a 21st record is inserted, remove the oldest record at the end
- this is strict FIFO trimming for overflow

## Save Trigger

Create a history record only when:
- the user clicks `计算FBA费用`
- the calculation succeeds
- a visible result state is produced

Do not create a history record when:
- validation fails
- the page shows an error / unsupported path
- the user edits fields without calculating
- the user calculates gross margin in the profit estimator

Every successful FBA calculation creates a new record.

Even if the inputs are identical to the previous run:
- still create a new record
- do not overwrite the previous one

This preserves the user's iterative workflow and keeps the feature simple.

## Record Shape

Each history item is a complete FBA working snapshot for one page.

Required top-level fields:
- `id`
- `createdAt`
- `note`
- `inputs`
- `resultSummary`

### `id`

A unique identifier used for note editing and restore actions.

### `createdAt`

Timestamp of when the successful calculation was saved.

### `note`

Optional short user note.

Rules:
- may be empty
- editable later from the history drawer
- empty notes display as `未命名记录`

### `inputs`

Store all FBA input fields needed to fully restore the form for that page.

Examples:
- site / route selections
- dimensions
- weight
- price
- toggles
- additional condition fields

This must include all page-specific FBA input fields, not just the dimensions.

### `resultSummary`

Store the minimum result data needed for:
- history list display
- restoring the page to a visible, already-calculated state

At minimum this includes:
- total FBA fee
- dimensions for list display
- unit labels if needed for rendering
- any page-specific result identifiers needed for restoring the result panel consistently

## History Entry UI

Each calculator page gets a `History` entry button in the result workspace header area, aligned to the upper-right side of the result panel.

Visual direction:
- glass / soft-border style consistent with the current Apple-inspired interface
- light footprint
- looks like an auxiliary control, not the primary CTA

## Drawer Pattern

When the user opens history:

Desktop:
- open a right-side drawer
- overlay above the current page
- do not permanently reflow the main content

Mobile:
- open a right-side full-height panel
- may behave like a full-screen sheet for readability and touch comfort

The drawer should be dismissible by:
- close button
- tapping outside on desktop
- swipe / close button on mobile if implemented

## Drawer Header

The drawer header should contain:
- title: `历史记录`
- helper text: `最近 20 条，仅保存成功的 FBA 测算`
- action: `清空全部`

`清空全部` must require a lightweight confirmation before deleting records.

Automatic trimming when exceeding 20 records must not show any prompt or notice.

## List Presentation

Do not use large standalone cards.

Use a compact two-line list row pattern so 20 items remain scannable.

Each row shows:
- line 1 left: note or `未命名记录`
- line 1 right: FBA total fee
- line 2: timestamp + `长 × 宽 × 高`

Example:

```text
轻小件测试                       USD 3.17
06-26 14:32 · 13.8 × 9 × 0.7 in
```

or

```text
未命名记录                       GBP 3.54
06-26 14:32 · 58 × 40 × 30 cm
```

List rows should feel dense but readable, closer to a premium calculator history list than a dashboard card stack.

## Restore Behavior

Clicking a history row should:
- immediately overwrite the current FBA form fields
- restore the saved successful result state
- close the history drawer

This is intentionally direct restore behavior.

There is no preview step and no secondary confirmation.

The restore should affect:
- FBA form inputs
- visible FBA result panel

The restore should not load or preserve any separate profit-estimator history because profit history is out of scope.

The profit estimator may remain as-is on the page after restore, but it is not sourced from history in this version.

## Note Editing

Notes are not required at save time.

The save flow must not interrupt the user with a note modal or prompt.

Instead:
- records save automatically with an empty note if needed
- the user can add or edit a note later inside the drawer

Recommended interaction:
- note text area or inline note field on each row
- save on blur or explicit confirm action

The implementation should stay lightweight and avoid modal interruption.

## Layout Change

Move the primary `计算FBA费用` button to directly below the dimensions / weight input area.

Rationale:
- most users rely on the default advanced-condition settings
- most runs follow a short path: site -> dimensions -> weight -> calculate

Advanced / optional conditions remain available, but appear after the main CTA section as a secondary block.

This makes the primary workflow faster without removing configurability.

## Error Handling and Degradation

If `localStorage` is unavailable or throws:
- the calculator must still work normally
- history UI may show an empty / unavailable state
- no blocking error should break FBA calculation

If stored data is malformed:
- ignore invalid records
- fail soft
- keep the page usable

## Non-Goals

This version does not attempt to:
- merge histories across devices
- share history between colleagues
- persist to Vercel or any backend
- sync with GitHub, cookies, or URL params
- add history for the profit estimator

## Testing Expectations

The implementation should be covered with automated tests for:
- saving a successful calculation into history
- not saving failed / invalid calculations
- per-page isolation of storage keys
- trimming from 21 records down to 20 by removing the oldest
- restoring a record into the FBA form and result view
- note editing persistence
- `localStorage` failure graceful degradation
- updated button placement in the form layout
