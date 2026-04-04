# Unified Fee Studio Design

**Date:** 2026-04-03

**Status:** Approved in brainstorming

## Goal

Create a unified public-facing static site that brings together the existing three fee calculators into one coherent experience:

- Amazon NA FBA
- Amazon EU & UK FBA
- Walmart WFS

The site should be suitable for a public domain, primarily used by internal teammates, and remain fast and practical on mobile.

## Product Direction

The chosen product model is:

- a unified homepage
- separate tool pages for each calculator
- a shared changelog page

This is intentionally not a single mega-calculator page and not a simple link directory. The homepage should feel like a polished tool hub while each calculator keeps its own logic and dedicated workspace.

## Experience Principles

- Internal-tool efficiency comes first.
- The design should feel premium and calm, with Apple-inspired polish rather than enterprise dashboard heaviness.
- Mobile use is a first-class requirement, especially for quick access and repeated checking.
- Existing calculator logic should remain independent to reduce migration risk.
- Version visibility should be built into the product, not treated as an afterthought.

## Visual Direction

The selected visual direction is closest to a tool-first homepage with Apple-like restraint and clarity.

### Core qualities

- high whitespace
- minimal chrome
- soft gradients and subtle glass surfaces
- large-radius cards
- restrained blue accents
- clean typography
- lightweight motion only where it improves hierarchy

### Visual tone

This should feel like:

`Apple-style precision for an internal operations tool.`

It should not feel like:

- a marketing landing page
- a generic admin dashboard
- a colorful multi-module SaaS template

## Site Structure

The planned route structure is:

- `/` homepage
- `/na` Amazon NA calculator
- `/eu-uk` Amazon EU & UK calculator
- `/walmart` Walmart WFS calculator
- `/changelog` update log

## Homepage Design

The homepage should act as a premium tool workspace rather than a promotional landing page.

### Homepage sections

1. Minimal top navigation
   - site name
   - calculators
   - changelog

2. Hero / command area
   - strong one-line headline
   - short descriptive subline
   - compact status card showing:
     - last updated date
     - number of supported tools
     - current rules status highlights

3. Primary tool cards
   - Amazon NA
   - Amazon EU & UK
   - Walmart WFS

4. Recent updates section
   - latest 3 to 5 product or rule updates

5. Lightweight scope / disclaimer section
   - what the tools cover
   - which fee categories are intentionally excluded from estimates

### Homepage card content

Each calculator card should show:

- tool name
- coverage range
- recent update date
- one-line rule status summary
- open tool CTA

## Tool Page Framework

Each calculator page should keep its existing calculation logic but adopt a unified outer shell.

### Shared page shell

- top navigation
- tool title block
- version and update information
- primary calculator area
- results area
- notes / edge cases area
- links back to homepage and changelog

### Calculator-specific pages

#### `/na`

- supports US / CA / MX
- keeps current logic structure
- includes newly added fuel surcharge toggle behavior

#### `/eu-uk`

- keeps current local / EFN / remote logic
- adopts shared layout and visual system

#### `/walmart`

- remains fully independent in calculation logic
- adopts the same shell and visual language as the Amazon tools

## Mobile Strategy

Mobile is a first-class use case.

### Requirements

- homepage cards stack vertically
- primary CTA remains visible quickly
- update information is compressed into short, scannable lines
- tool pages should remain fully usable without pinch-zoom
- navigation stays simple and lightweight

The mobile version should not be a shrunk desktop page. It should prioritize speed of access and clarity of result output.

## Changelog Strategy

The site needs first-class version visibility because updates may happen only a few times per year.

### `/changelog`

The changelog page should use a reverse-chronological layout and include:

- release date
- affected module
- update summary
- rules or logic notes
- any scope limitations or manual-review notes

### Tool-level version info

Each calculator page should display:

- current rule version
- effective period or rule source label
- latest update date
- shortcut to changelog

### Homepage update feed

The homepage should surface recent updates in short form, for example:

- date
- module name
- one-line summary

## Technical Architecture

This project should be implemented as a static site.

### Directory concept

- `/index.html`
- `/na/index.html`
- `/eu-uk/index.html`
- `/walmart/index.html`
- `/changelog/index.html`
- `/assets/` shared styles, scripts, icons
- `/data/versions.json` shared version metadata

### Integration approach

Do not merge all three calculators into one calculation application.

Instead:

- keep the three calculation engines separate
- unify the shell, navigation, styling, and version presentation
- reuse shared assets for layout and product consistency

This lowers migration risk and keeps future rule updates isolated by module.

## Migration Strategy

Implementation should happen in phases:

1. Build the shared site shell
   - homepage
   - shared navigation
   - shared styling
   - changelog page

2. Migrate Amazon NA into the shared shell

3. Migrate Amazon EU & UK into the shared shell

4. Migrate Walmart into the shared shell

This sequence keeps the rollout manageable and allows verification page by page.

## Content Strategy

Content should remain concise and useful.

### Avoid

- long-form marketing copy
- oversized FAQ sections
- repeated explanatory text across pages

### Prefer

- short product-quality labels
- clean status summaries
- precise update descriptions
- concise scope disclaimers

## Deployment Intent

The final product should be deployable to a public domain as a static site.

This design intentionally avoids requiring:

- authentication
- server-side rendering
- complex backend services

The domain should function as a stable public URL while the actual audience remains internal teammates.

## Risks And Controls

### Risks

- over-stylizing the site into a marketing page
- over-merging calculators and increasing logic coupling
- making mobile layout look elegant but not practical
- scattering version information across pages

### Controls

- keep homepage tool-first
- preserve separate calculation logic per module
- treat mobile usability as a hard requirement
- centralize version metadata and changelog structure

## Out Of Scope For This Phase

- account systems
- analytics backend
- user-specific saved calculations
- full calculator logic unification
- domain purchase and DNS setup work

## Approved Design Summary

This design defines a premium static tool portal with:

- Apple-inspired visual language
- a tool-first homepage
- separate calculator pages for NA, EU & UK, and Walmart
- a shared changelog page
- mobile-first usability
- shared version visibility
- independent calculation logic per module
