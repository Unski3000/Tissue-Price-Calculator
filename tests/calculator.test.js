import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrice, PRICING_CONFIG } from '../calculator.js';

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

  assert.equal(Number(result.totalKgCost.toFixed(2)), 247.17);
  assert.equal(Number(result.materialCostPerRoll.toFixed(4)), 20.5151);
  assert.equal(Number(result.coreCostPerRoll.toFixed(4)), 1.0714);
  assert.equal(Number(result.rollCost.toFixed(4)), 21.5865);
  assert.equal(Number(result.baseBaleCost.toFixed(2)), 863.46);
  assert.equal(Number(result.packagingCost.toFixed(2)), 58.00);
  assert.equal(Number(result.productionCost.toFixed(2)), 921.46);
  assert.equal(Number(result.marketPrice.toFixed(2)), 1290.05);
  assert.equal(Number(result.grossProfit.toFixed(2)), 368.58);
});

test('omits core cost for tissue paper products', () => {
  const result = calculatePrice({
    ...defaultInput,
    productType: 'tissue',
    rollWeightGrams: PRICING_CONFIG.products.tissue.defaultWeightGrams,
  });

  assert.equal(result.product.hasCore, false);
  assert.equal(result.coreCostPerRoll, 0);
  assert.equal(Number(result.rollCost.toFixed(4)), 13.5944);
});

test('uses selected packaging plus bale bag in production cost', () => {
  const result = calculatePrice({
    ...defaultInput,
    packagingIndex: 3,
  });

  assert.equal(result.packaging.name, 'Jumbo Pack');
  assert.equal(Number(result.packagingCost.toFixed(2)), 44.93);
  assert.equal(Number(result.productionCost.toFixed(2)), 908.39);
});

test('protects core calculation from zero cuts per rod', () => {
  const result = calculatePrice({
    ...defaultInput,
    cutsPerRod: 0,
  });

  assert.equal(result.coreCostPerRoll, 15);
});
