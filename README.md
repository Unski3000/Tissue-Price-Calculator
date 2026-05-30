diff --git a/README.md b/README.md
index 5ff2d08c9cde6629b631cb5aa8ec6d431936edd7..d9a953df223f32cf50ed148d5b8ff2fc252ac0f4 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,89 @@
 # Tissue-Price-Calculator
-Pricing Engine
+
+Kerio Care+ Pricing Engine is a mobile-friendly static web app for estimating 40-roll bale prices for tissue and paper products.
+
+## What it calculates
+
+The calculator combines material, transport, inner-core, packaging, bale-bag, and markup inputs to estimate:
+
+- final market price per 40-roll bale,
+- all-in production cost before markup,
+- gross profit per bale,
+- material/core cost per roll,
+- base material/core cost for a 40-roll bale.
+
+## How to run locally
+
+Open `index.html` directly in a browser, or serve the folder with a small static server:
+
+```sh
+python3 -m http.server 8000
+```
+
+Then visit <http://localhost:8000/>.
+
+## Pricing formula
+
+The calculation logic lives in `calculator.js` and follows this formula:
+
+1. Mother roll cost = tissue price per kg + transport price per kg.
+2. Material cost per roll = mother roll cost × roll weight in kg.
+3. Core cost per roll = core price ÷ cuts per rod for products with an inner core.
+4. Base bale cost = roll cost × 40 rolls.
+5. Packaging cost = selected packaging unit cost × selected packaging quantity + bale bag cost.
+6. Production cost = base bale cost + packaging cost.
+7. Market price = production cost × (1 + markup percentage).
+8. Gross profit = market price - production cost.
+
+## Business assumptions
+
+The default assumptions are centralized in `calculator.js`:
+
+- Every bale contains 40 rolls.
+- The bale bag cost is KES 11.60.
+- Regular Roll default weight is 83 g and includes an inner core.
+- Jumbo Roll default weight is 150 g and includes an inner core.
+- Tissue Paper default weight is 55 g and does not include an inner core.
+- Kitchen Towel default weight is 110 g and includes an inner core.
+- Jumbo Pack assumes 6 rolls per pack, which means 40 ÷ 6 = 6.67 packs per bale. Verify this with the supplier before relying on the result.
+- 10-Pack Naked packaging includes only sleeve cost; tissue/material cost is calculated separately.
+
+## Updating prices and assumptions
+
+Update product defaults, packaging prices, packaging quantities, and bale bag cost in the `PRICING_CONFIG` object inside `calculator.js`.
+
+The main values to review when supplier prices change are:
+
+- `baleBagCost`,
+- `products[*].defaultWeightGrams`,
+- `products[*].hasCore`,
+- `packaging[*].packagingCost`,
+- `packaging[*].quantityPerBale`,
+- the default form values in `index.html`.
+
+Always verify supplier costs before using the app output for sales or production decisions.
+
+## Project structure
+
+```text
+index.html          # semantic app markup
+styles.css          # app layout and visual design
+calculator.js       # pricing configuration, formula, validation, and UI wiring
+manifest.json       # installable web app metadata
+assets/             # extracted image assets
+tests/              # Node test coverage for pricing formulas
+```
+
+## Checks
+
+Run the formula tests with:
+
+```sh
+npm test
+```
+
+Run a JavaScript syntax check with:
+
+```sh
+npm run check:js
+```
