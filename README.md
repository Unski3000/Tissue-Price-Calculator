# Tissue-Price-Calculator

Kerio Care+ Pricing Engine is a mobile-friendly static web app for estimating 40-roll bale prices for tissue and paper products.

## What it calculates

The calculator combines material, transport, inner-core, packaging, bale-bag, and markup inputs to estimate:

- final market price per 40-roll bale,
- all-in production cost before markup,
- gross profit per bale,
- material/core cost per roll,
- base material/core cost for a 40-roll bale.

## How to run locally

Serve the folder with a small static server so the browser loads the module script and companion assets from the correct paths:
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

Then visit <http://localhost:8000/>.

## Pricing formula

The calculation logic lives in `calculator.js` and follows this formula:

1. Mother roll cost = tissue price per kg + transport price per kg.
2. Material cost per roll = mother roll cost × roll weight in kg.
3. Core cost per roll = core price ÷ cuts per rod for products with an inner core.
4. Base bale cost = roll cost × 40 rolls.
5. Packaging cost = selected packaging unit cost × selected packaging quantity + bale bag cost.
6. Production cost = base bale cost + packaging cost.
7. Market price = production cost × (1 + markup percentage).
8. Gross profit = market price - production cost.

## Business assumptions

The default assumptions are centralized in `calculator.js`:

- Every bale contains 40 rolls.
- The bale bag cost is KES 11.60.
- Regular Roll default weight is 83 g and includes an inner core.
- Jumbo Roll default weight is 150 g and includes an inner core.
- Tissue Paper default weight is 55 g and does not include an inner core.
- Kitchen Towel default weight is 110 g and includes an inner core.
- Jumbo Pack assumes 6 rolls per pack, which means 40 ÷ 6 = 6.67 packs per bale. Verify this with the supplier before relying on the result.
- 10-Pack Naked packaging includes only sleeve cost; tissue/material cost is calculated separately.

## Updating prices and assumptions

Update product defaults, packaging prices, packaging quantities, and bale bag cost in the `PRICING_CONFIG` object inside `calculator.js`.

The main values to review when supplier prices change are:

- `baleBagCost`,
- `products[*].defaultWeightGrams`,
- `products[*].hasCore`,
- `packaging[*].packagingCost`,
- `packaging[*].quantityPerBale`,
- the default form values in `index.html`.

Always verify supplier costs before using the app output for sales or production decisions.

## Project structure

```text
index.html          # semantic app markup
styles.css          # app layout and visual design
calculator.js       # pricing configuration, formula, validation, and UI wiring
manifest.json       # installable web app metadata
assets/             # text-based SVG app and logo assets
tests/              # Node test coverage for pricing formulas
```

## Deployment checklist

When deploying or manually uploading the app, copy the whole project structure, not only `index.html`. The page depends on `styles.css`, `calculator.js`, `manifest.json`, and the SVG files under `assets/` being present at the documented paths.

Before publishing, run:

```sh
npm run check:deploy
```

This catches common manual-upload mistakes such as saving a Git diff as a real file, leaving `styles.css` or `calculator.js` out of the deployment, or placing `icon.svg` / `calculator.test.js` at the repo root instead of under `assets/` and `tests/`.

## Checks

Run the formula tests with:

```sh
npm test
```

Run a JavaScript syntax check with:

```sh
npm run check:js
```
