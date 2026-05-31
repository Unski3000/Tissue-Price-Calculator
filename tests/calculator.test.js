import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrice, normalizePricingInput, PRICING_CONFIG } from '../calculator.js';

function assertClose(actual, expected, precision = 2) {
  assert.equal(Number(actual.toFixed(precision)), expected);
}

const defaultInput = {
  productType: 'regular',
  tissuePrice: 209.43,
  transportPrice: 37.74,
  rollWeightGrams: 83,
  corePrice: 15,
  cutsPerRod: 14,
  markupPercent: 40,
  packagingIndex: 0,
};

test('calculates default regular-roll bale pricing', () => {
  const result = calculatePrice(defaultInput);

  assert.equal(result.product.label, 'Regular Roll');
  assert.equal(result.packaging.name, 'Single Rolls');
  assertClose(result.totalKgCost, 247.17);
  assertClose(result.materialCostPerRoll, 20.515, 3);
  assertClose(result.coreCostPerRoll, 1.071, 3);
  assertClose(result.rollCost, 21.587, 3);
  assertClose(result.baseBaleCost, 863.46);
  assertClose(result.packagingCost, 58.00);
  assertClose(result.productionCost, 921.46);
  assertClose(result.marketPrice, 1290.05);
  assertClose(result.grossProfit, 368.58);
});

test('omits core cost for tissue paper products', () => {
  const result = calculatePrice({
    ...defaultInput,
    productType: 'tissue',
    rollWeightGrams: 55,
    corePrice: 99,
  });

  assert.equal(result.product.hasCore, false);
  assert.equal(result.coreCostPerRoll, 0);
  assertClose(result.rollCost, 13.594, 3);
});

test('uses selected packaging plus bale bag in production cost', () => {
  const result = calculatePrice({ ...defaultInput, packagingIndex: 2 });

  assert.equal(result.packaging.name, 'Quad / 4-Pack');
  assert.equal(result.packagingCost, 61.6);
  assertClose(result.productionCost, 925.06);
});

test('protects core calculation from zero cuts per rod', () => {
  const result = calculatePrice({ ...defaultInput, cutsPerRod: 0 });

  assert.equal(result.input.cutsPerRod, 1);
  assert.equal(result.coreCostPerRoll, 15);
});

test('normalizes missing and invalid values to safe defaults', () => {
  const input = normalizePricingInput({
    productType: 'unknown',
    tissuePrice: Number.NaN,
    transportPrice: -20,
    rollWeightGrams: undefined,
    corePrice: -5,
    cutsPerRod: Number.NaN,
    markupPercent: -40,
    packagingIndex: Number.NaN,
  });

  assert.deepEqual(input, {
    productType: 'regular',
    tissuePrice: 0,
    transportPrice: 0,
    rollWeightGrams: PRICING_CONFIG.products.regular.defaultWeightGrams,
    corePrice: 0,
    cutsPerRod: 1,
    markupPercent: 0,
    packagingIndex: 0,
  });
});

test('clamps packaging index to the available packaging range', () => {
  assert.equal(calculatePrice({ ...defaultInput, packagingIndex: 999 }).packaging.name, '10-Pack (Naked)');
  assert.equal(calculatePrice({ ...defaultInput, packagingIndex: -1 }).packaging.name, 'Single Rolls');
  assert.equal(calculatePrice({ ...defaultInput, packagingIndex: '3' }).packaging.name, 'Jumbo Pack');
});
