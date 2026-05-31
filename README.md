# Tissue Price Calculator

Kerio Care+ Pricing Engine is a mobile-friendly web calculator for estimating the selling price of a 40-roll bale of tissue or paper products.

The app is designed for quick pricing checks when product inputs change, such as mother-roll cost, transport cost, roll weight, inner-core cost, packaging format, bale-bag cost, and desired markup.

## Who this is for

This repository is intended for Kerio Care+ team members who need to understand, verify, or update the bale pricing calculator without needing background explanation from the original author.

Use this README to understand:

- what the calculator does,
- which inputs affect the price,
- how the price is calculated,
- where the current app logic lives,
- which assumptions should be reviewed before relying on the output.

## What the app calculates

For a selected product and packaging format, the app estimates:

- final market price for one 40-roll bale,
- all-in production cost before markup,
- gross profit per bale,
- material cost per roll,
- inner-core cost per roll when the selected product uses a core,
- base material/core cost for the 40 rolls before packaging and markup.

## How to run the app

This is a static browser app. No build step is required for the current version.

Open `index.html` directly in a browser, or serve the repository folder with a simple local static server:

```sh
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Current implementation status

The currently working app is implemented inside `index.html`.

Important details for new contributors:

- `index.html` contains the active HTML, inline CSS, and inline JavaScript used by the browser.
- The active pricing function is the inline `calc()` function near the bottom of `index.html`.
- `calculator.js`, `calculator.test.js`, `styles.css`, `manifest.json`, and `package.json` currently appear to contain patch/diff text from an attempted refactor rather than clean runnable files.
- Because `package.json` is not valid JSON in the current repository state, `npm test` does not run successfully yet.

Before moving logic out of `index.html`, clean the patch-style files into valid source files and confirm the app still produces the same pricing outputs.

## Product types

The app supports four product types:

| Product type | Default roll weight | Uses inner core? |
| --- | ---: | :---: |
| Regular Roll | 83 g | Yes |
| Jumbo Roll | 150 g | Yes |
| Tissue Paper | 55 g | No |
| Kitchen Towel | 110 g | Yes |

When a user changes the product type, the app updates the default roll weight and hides the inner-core section for products that do not use a core.

## Pricing inputs

The calculator uses these user-editable inputs:

| Input | Meaning |
| --- | --- |
| Tissue price | Factory price of the mother roll in KES per kg. |
| Transport price | Delivery or transport cost in KES per kg. |
| Roll weight | Weight of one finished roll in grams. |
| Core price | Cost of one 1450 mm inner-core rod. |
| Cuts per rod | Number of finished roll cores cut from one rod. |
| Markup % | Profit markup applied to the full production cost. |
| Packaging format | The packaging option used for the 40-roll bale. |

## Packaging formats

The current packaging assumptions are:

| Packaging format | Quantity per 40-roll bale | Packaging unit cost |
| --- | ---: | ---: |
| Single Rolls | 40 rolls | KES 1.16 per roll |
| Twin / 2-Pack | 20 packs | KES 2.00 per pack |
| Quad / 4-Pack | 10 packs | KES 5.00 per pack |
| Jumbo Pack | 40 ÷ 6 = 6.67 packs | KES 5.00 per pack |
| 10-Pack Naked | 4 packs | KES 4.00 per sleeve |

A fixed bale-bag cost of KES 11.60 is added to the selected packaging cost.

## Pricing formula

The calculator uses this formula:

1. Total mother-roll cost per kg = tissue price per kg + transport price per kg.
2. Roll weight in kg = roll weight in grams ÷ 1000.
3. Material cost per roll = total mother-roll cost per kg × roll weight in kg.
4. Core cost per roll = core price ÷ cuts per rod.
5. If the selected product does not use an inner core, core cost per roll is 0.
6. Roll cost = material cost per roll + core cost per roll.
7. Base 40-roll bale cost = roll cost × 40.
8. Packaging cost = selected packaging unit cost × selected packaging quantity + bale-bag cost.
9. Production cost = base 40-roll bale cost + packaging cost.
10. Market price = production cost × (1 + markup percentage ÷ 100).
11. Gross profit = market price - production cost.

## Example default calculation

Using the default Regular Roll values currently shown in the app:

- tissue price: KES 209.43/kg,
- transport price: KES 37.74/kg,
- total mother-roll cost: KES 247.17/kg,
- roll weight: 83 g,
- core price: KES 15.00 per rod,
- cuts per rod: 14,
- markup: 40%,
- packaging: Single Rolls,
- bale bag: KES 11.60.

The app calculates:

- material cost per roll = 247.17 × 0.083 = about KES 20.52,
- core cost per roll = 15 ÷ 14 = about KES 1.07,
- roll cost = about KES 21.59,
- base 40-roll bale cost = about KES 863.46,
- packaging and bale-bag cost = about KES 58.00,
- production cost before markup = about KES 921.46,
- final market price at 40% markup = about KES 1,290.05,
- gross profit per bale = about KES 368.58.

## Business assumptions to verify

Always verify current supplier prices before using the calculator output for sales or production decisions.

Pay special attention to:

- tissue price per kg,
- transport price per kg,
- roll weight per product,
- core price per rod,
- cuts per rod,
- packaging costs,
- bale-bag cost,
- markup percentage,
- Jumbo Pack pack size.

The Jumbo Pack calculation assumes 6 rolls per pack, which means a 40-roll bale requires 6.67 packs. Confirm this with the supplier before relying on Jumbo Pack pricing.

The 10-Pack Naked option includes only the sleeve cost in the packaging calculation. Tissue/material cost is still calculated separately through the roll-cost formula.

## Where to update values

For the current working app, update values in `index.html`:

- product defaults are in the `TYPES` object,
- packaging costs and quantities are in the `PACKS` array,
- bale-bag cost is in the `BALE_BAG` constant,
- default input values are in the form fields above the script.

If the app is later refactored to use `calculator.js`, move these assumptions into a single clean configuration object and update this README to match the new source of truth.

## Development notes

Recommended cleanup tasks for future contributors:

1. Convert `calculator.js` from patch text into valid JavaScript.
2. Convert `calculator.test.js` into a real Node test file or move it into a `tests/` directory.
3. Convert `package.json` into valid JSON so `npm test` can run.
4. Move inline CSS from `index.html` into `styles.css` only after confirming the visual layout remains unchanged.
5. Move inline calculator logic from `index.html` into `calculator.js` only after confirming the output matches the current app.
6. Fix `manifest.json` so the app can be installed as a proper progressive web app if needed.

## Quick file guide

| File | Purpose |
| --- | --- |
| `index.html` | Current working browser app, including markup, styling, and calculation logic. |
| `README.md` | Project explanation and onboarding guide. |
| `calculator.js` | Intended extracted pricing module, but currently stored as patch/diff text. |
| `calculator.test.js` | Intended pricing tests, but currently stored as patch/diff text. |
| `styles.css` | Intended extracted stylesheet, but currently stored as patch/diff text. |
| `manifest.json` | Intended web app manifest, but currently stored as patch/diff text. |
| `package.json` | Intended Node project metadata, but currently stored as patch/diff text and not valid JSON. |
| `icon.svg` | App icon asset. |
