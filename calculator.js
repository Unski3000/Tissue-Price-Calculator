export const PRICING_CONFIG = {
  baleRollCount: 40,
  baleBagCost: 11.6,
  products: {
    regular: { label: 'Regular Roll', defaultMarkupPercent: 40, defaultWeightGrams: 83, hasCore: true },
    jumbo: { label: 'Jumbo Roll', baleRollCount: 12, defaultMarkupPercent: 20, defaultWeightGrams: 150, hasCore: true },
    tissue: { label: 'Tissue Paper', defaultMarkupPercent: 40, defaultWeightGrams: 55, hasCore: false },
    towel: { label: 'Kitchen Towel', defaultMarkupPercent: 40, defaultWeightGrams: 110, hasCore: true },
  },
  packaging: [
    { name: 'Single Rolls', tag: '×40', naked: false, packagingCost: 1.16, quantityPerBale: 40, rollsPerPack: 1, unit: 'roll' },
    { name: 'Twin / 2-Pack', tag: '×20', naked: false, packagingCost: 2, quantityPerBale: 20, rollsPerPack: 2, unit: 'pack' },
    { name: 'Quad / 4-Pack', tag: '×10', naked: false, packagingCost: 5, quantityPerBale: 10, rollsPerPack: 4, unit: 'pack' },
    { name: '10-Pack (Naked)', tag: '×4 Naked', naked: true, packagingCost: 4, quantityPerBale: 4, rollsPerPack: 10, unit: 'pack' },
  ],
};

const FIELD_LABELS = {
  tissueP: 'Tissue price',
  transP: 'Transport price',
  rollWt: 'Roll weight',
  coreP: 'Core price',
  cutsP: 'Cuts per rod',
  mkup: 'Markup',
  packCost: 'Packaging unit cost',
  bagCost: 'Bale bag cost',
};

let currentProductType = 'regular';
const productEdits = new Map();

export function formatNumber(n, decimalPlaces = 0) {
  const value = Number.isFinite(n) ? n : 0;
  return value.toLocaleString('en-KE', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nonNegativeNumber(value, fallback = 0) {
  return Math.max(finiteNumber(value, fallback), 0);
}

function atLeastOne(value, fallback = 1) {
  return Math.max(finiteNumber(value, fallback), 1);
}

function clampIndex(value, length) {
  const index = Math.trunc(finiteNumber(value, 0));
  return Math.min(Math.max(index, 0), Math.max(length - 1, 0));
}

export function normalizePricingInput(input = {}, config = PRICING_CONFIG) {
  const product = config.products[input.productType] ?? config.products.regular;

  return {
    productType: config.products[input.productType] ? input.productType : 'regular',
    tissuePrice: nonNegativeNumber(input.tissuePrice),
    transportPrice: nonNegativeNumber(input.transportPrice),
    rollWeightGrams: nonNegativeNumber(input.rollWeightGrams, product.defaultWeightGrams),
    corePrice: nonNegativeNumber(input.corePrice),
    cutsPerRod: atLeastOne(input.cutsPerRod),
    markupPercent: nonNegativeNumber(input.markupPercent, product.defaultMarkupPercent),
    packagingIndex: input.productType === 'jumbo' ? 0 : clampIndex(input.packagingIndex, config.packaging.length),
    packagingUnitCost: nonNegativeNumber(input.packagingUnitCost, config.packaging[input.productType === 'jumbo' ? 0 : clampIndex(input.packagingIndex, config.packaging.length)].packagingCost),
    baleBagCost: nonNegativeNumber(input.baleBagCost, config.baleBagCost),
  };
}

export function calculatePrice(input = {}, config = PRICING_CONFIG) {
  const normalizedInput = normalizePricingInput(input, config);
  const product = config.products[normalizedInput.productType];
  const baleRollCount = product.baleRollCount ?? config.baleRollCount;
  const selectedPackaging = config.packaging[normalizedInput.packagingIndex];
  const packaging = { ...selectedPackaging, quantityPerBale: baleRollCount / selectedPackaging.rollsPerPack };
  const totalKgCost = normalizedInput.tissuePrice + normalizedInput.transportPrice;
  const rollWeightKg = normalizedInput.rollWeightGrams / 1000;
  const materialCostPerRoll = totalKgCost * rollWeightKg;
  const coreCostPerRoll = product.hasCore ? normalizedInput.corePrice / normalizedInput.cutsPerRod : 0;
  const rollCost = materialCostPerRoll + coreCostPerRoll;
  const baseBaleCost = rollCost * baleRollCount;
  const packagingCost = normalizedInput.packagingUnitCost * packaging.quantityPerBale + normalizedInput.baleBagCost;
  const productionCost = baseBaleCost + packagingCost;
  const markupFactor = 1 + normalizedInput.markupPercent / 100;
  const marketPrice = productionCost * markupFactor;
  const grossProfit = marketPrice - productionCost;

  return {
    baleRollCount,
    input: normalizedInput,
    product,
    packaging,
    totalKgCost,
    materialCostPerRoll,
    coreCostPerRoll,
    rollCost,
    baseBaleCost,
    packagingCost,
    productionCost,
    marketPrice,
    grossProfit,
  };
}

function getNumber(id, fallback = 0) {
  const el = document.getElementById(id);
  const n = Number.parseFloat(el?.value);
  return Number.isFinite(n) ? n : fallback;
}

function readForm() {
  const product = PRICING_CONFIG.products[currentProductType] ?? PRICING_CONFIG.products.regular;
  return {
    productType: currentProductType,
    tissuePrice: getNumber('tissueP', 0),
    transportPrice: getNumber('transP', 0),
    rollWeightGrams: getNumber('rollWt', product.defaultWeightGrams),
    corePrice: getNumber('coreP', 15),
    cutsPerRod: getNumber('cutsP', 14),
    markupPercent: getNumber('mkup', 0),
    packagingUnitCost: getNumber('packCost'),
    baleBagCost: getNumber('bagCost'),
    packagingIndex: Number.parseInt(document.getElementById('packSelect')?.value || '0', 10),
  };
}

function validateForm() {
  const invalidFields = [];

  document.querySelectorAll('[data-pricing-input]').forEach((input) => {
    const field = input.closest('.field');
    field?.classList.remove('invalid');

    if (input.closest('[hidden]') || input.tagName === 'SELECT') {
      return;
    }

    const value = Number.parseFloat(input.value);
    const min = input.min === '' ? undefined : Number.parseFloat(input.min);
    const isInvalid = !Number.isFinite(value) || (Number.isFinite(min) && value < min);

    if (isInvalid) {
      invalidFields.push(FIELD_LABELS[input.id] ?? input.id);
      field?.classList.add('invalid');
    }
  });

  const validationMessage = document.getElementById('validationMessage');
  if (!validationMessage) {
    return invalidFields.length === 0;
  }

  if (invalidFields.length === 0) {
    validationMessage.hidden = true;
    validationMessage.textContent = '';
    return true;
  }

  validationMessage.hidden = false;
  validationMessage.textContent = `Check these inputs before using the result: ${invalidFields.join(', ')}.`;
  return false;
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) {
    el.textContent = value;
  }
}

function renderResult(result, input) {
  const inputValues = result.input ?? input;
  const coreSummary = result.product.hasCore ? 'core' : 'no core';
  setText('#output-title', `${result.baleRollCount}-Roll Bale Output`);
  setText('[data-output="marketLabel"]', `Final market price / ${result.baleRollCount}-roll bale`);
  setText('#packHelp', result.input.productType === 'jumbo' ? '12 individually wrapped rolls per bale. Wrapping cost is per roll; verify it for jumbo.' : `${result.packaging.quantityPerBale} packs per ${result.baleRollCount}-roll bale.`);
  const packagingAssumption = result.packaging.assumption ?? 'Selected packaging cost includes pack/sleeve material and the editable bale bag cost.';

  setText('[data-output="totalKgCost"]', `${formatNumber(result.totalKgCost, 2)} KES/kg`);
  document.getElementById('matRoll').value = formatNumber(result.materialCostPerRoll, 2);
  setText('[data-output="coreCostPerRoll"]', `${formatNumber(result.coreCostPerRoll, 3)} KES/roll`);

  setText('[data-output="marketPrice"]', `KES ${formatNumber(result.marketPrice, 0)}`);
  setText('[data-output="marketSummary"]', `${result.packaging.name} · includes material, ${coreSummary}, packaging, bale bag, and ${formatNumber(inputValues.markupPercent, 0)}% markup.`);
  setText('[data-output="productionCost"]', `KES ${formatNumber(result.productionCost, 0)}`);
  setText('[data-output="productionSummary"]', `Base ${formatNumber(result.baseBaleCost, 0)} + packaging ${formatNumber(result.packagingCost, 0)}`);
  setText('[data-output="grossProfit"]', `KES ${formatNumber(result.grossProfit, 0)}`);
  setText('[data-output="profitSummary"]', `At ${formatNumber(inputValues.markupPercent, 0)}% markup`);
  setText('[data-output="packagingAssumption"]', packagingAssumption);

  setText('[data-output="rollCost"]', formatNumber(result.rollCost, 2));
  setText('[data-output="base40"]', formatNumber(result.baseBaleCost, 0));
  setText('[data-output="markupPercent"]', `${formatNumber(inputValues.markupPercent, 0)}%`);
}

function updateProductType(productType) {
  if (document.getElementById('packCost').value !== '') productEdits.set(currentProductType, readForm());
  currentProductType = PRICING_CONFIG.products[productType] ? productType : 'regular';
  const product = PRICING_CONFIG.products[currentProductType];

  document.querySelectorAll('[data-product-type]').forEach((button) => {
    const selected = button.dataset.productType === currentProductType;
    button.classList.toggle('on', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  const rollWeight = document.getElementById('rollWt');
  if (rollWeight) {
    rollWeight.value = productEdits.get(currentProductType)?.rollWeightGrams ?? product.defaultWeightGrams;
  }

  const saved = productEdits.get(currentProductType);
  document.getElementById('mkup').value = saved?.markupPercent ?? product.defaultMarkupPercent;
  const select = document.getElementById('packSelect');
  select.value = saved?.packagingIndex ?? 0;
  select.disabled = currentProductType === 'jumbo';
  if (select.disabled) select.value = 0;
  document.getElementById('packCost').value = saved?.packagingUnitCost ?? PRICING_CONFIG.packaging[select.value].packagingCost;
  document.getElementById('bagCost').value = saved?.baleBagCost ?? PRICING_CONFIG.baleBagCost;

  const coreBox = document.getElementById('coreBox');
  if (coreBox) {
    coreBox.hidden = !product.hasCore;
  }
}

function refresh() {
  const valid = validateForm();
  const input = readForm();
  const result = calculatePrice(input);
  renderResult(result, input);
  return valid;
}

function init() {
  document.querySelectorAll('[data-product-type]').forEach((button) => {
    button.addEventListener('click', () => {
      updateProductType(button.dataset.productType);
      refresh();
    });
  });

  document.getElementById('packSelect').addEventListener('change', (event) => {
    document.getElementById('packCost').value = PRICING_CONFIG.packaging[event.target.value].packagingCost;
  });

  document.querySelectorAll('[data-pricing-input]').forEach((control) => {
    control.addEventListener('input', refresh);
    control.addEventListener('change', refresh);
  });

  updateProductType(currentProductType);
  refresh();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
