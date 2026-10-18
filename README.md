# Tissue-Price-Calculator

Kerio Care+ Pricing Engine is a responsive static web app for estimating product bale prices for tissue and paper products. The layout is mobile-first and expands into a two-column desktop workspace on larger screens.

## What it calculates

The calculator combines material, transport, inner-core, packaging, bale-bag, and markup inputs to estimate:

- final market price per product bale,
- all-in production cost before markup,
- gross profit per bale,
- material/core cost per roll,
- base material/core cost for a product bale.

## How to run locally

Serve the folder with a small static server so the browser loads the module script and companion assets from the correct paths:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/>.

## Pricing formula

The calculation logic lives in `calculator.js` and follows this formula:

1. Mother roll cost = tissue price per kg + transport price per kg.
2. Material cost per roll = mother roll cost × roll weight in kg.
3. Core cost per roll = core price ÷ cuts per rod for products with an inner core.
4. Base bale cost = roll cost × product bale count (40 regular; 12 jumbo).
5. Packaging cost = selected packaging unit cost × selected packaging quantity + bale bag cost.
6. Production cost = base bale cost + packaging cost.
7. Market price = production cost × (1 + markup percentage).
8. Gross profit = market price - production cost.

## Business assumptions

The default assumptions are centralized in `calculator.js`:

- Regular, tissue and kitchen towel bales contain 40 rolls; jumbo contains 12 individually wrapped rolls.
- Jumbo defaults to 20% markup; other products default to 40%. Markup is editable and is a percentage of production cost, not selling-price margin.
- The bale bag cost is KES 11.60.
- Regular Roll default weight is 83 g and includes an inner core.
- Jumbo Roll default weight is 150 g and includes an inner core.
- Tissue Paper default weight is 55 g and does not include an inner core.
- Kitchen Towel default weight is 110 g and includes an inner core.
- 10-Pack Naked packaging includes only sleeve cost; tissue/material cost is calculated separately.

## Updating prices and assumptions

Update product defaults, packaging prices, packaging quantities, and bale bag cost in the `PRICING_CONFIG` object inside `calculator.js`.

The main values to review when supplier prices change are:

- `baleBagCost`,
- `products[*].defaultWeightGrams`,
- `products[*].hasCore`,
- `packaging[*].packagingCost`,
- `products[*].baleRollCount` (falls back to `baleRollCount`),
- `products[*].defaultMarkupPercent`,
- `packaging[*].rollsPerPack` (pack quantity is derived from bale count),
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


## Jumbo pricing and editable assumptions

Jumbo always uses the Single Rolls format: 12 individual wraps plus one bale bag.
The obsolete six-roll Jumbo Pack option has been removed. Output labels follow the selected product's bale count.
Wrap/sleeve cost and bale bag cost can be edited directly, alongside material, transport, weight, core and markup inputs.
Product switching restores that product's edited weight, markup, packaging selection, wrapping cost and bag cost for the current session. Material, transport and core inputs remain shared and editable.
Changing packaging format loads its configured unit cost; edit that value as required.

Existing weights and cost defaults are retained assumptions, not newly verified supplier quotes.
In particular, the existing KES 1.16 single-wrap default is reused for jumbo and must be verified or replaced by the user. No jumbo-specific supplier cost has been invented.
The calculation covers the listed cost components only; include any additional production overhead in your costing process.
