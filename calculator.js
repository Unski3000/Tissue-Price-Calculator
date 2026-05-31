export const PRICING_CONFIG = {
  baleRollCount: 40,
  baleBagCost: 11.6,
  products: {
    regular: { label: 'Regular Roll', defaultWeightGrams: 83, hasCore: true },
    jumbo: { label: 'Jumbo Roll', defaultWeightGrams: 150, hasCore: true },
    tissue: { label: 'Tissue Paper', defaultWeightGrams: 55, hasCore: false },
    towel: { label: 'Kitchen Towel', defaultWeightGrams: 110, hasCore: true },
  },
  packaging: [
    { name: 'Single Rolls', tag: '×40', naked: false, packagingCost: 1.16, quantityPerBale: 40, rollsPerPack: 1, unit: 'roll' },
    { name: 'Twin / 2-Pack', tag: '×20', naked: false, packagingCost: 2, quantityPerBale: 20, rollsPerPack: 2, unit: 'pack' },
    { name: 'Quad / 4-Pack', tag: '×10', naked: false, packagingCost: 5, quantityPerBale: 10, rollsPerPack: 4, unit: 'pack' },
    { name: 'Jumbo Pack', tag: '×6⅔', naked: false, packagingCost: 5, quantityPerBale: 40 / 6, rollsPerPack: 6, unit: 'pack', assumption: 'Jumbo Pack assumes 6 rolls per pack (40 ÷ 6 = 6.67 packs/bale). Confirm with supplier.' },
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
};

let currentProductType = 'regular';

export function formatNumber(n, decimalPlaces = 0) {
  const value = Number.isFinite(n) ? n : 0;
  return value.toLocaleString('en-KE', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

export function calculatePrice(input, config = PRICING_CONFIG) {
  const product = config.products[input.productType] ?? config.products.regular;
  const packaging = config.packaging[Math.min(Math.max(input.packagingIndex, 0), config.packaging.length - 1)];
  const totalKgCost = input.tissuePrice + input.transportPrice;
  const rollWeightKg = input.rollWeightGrams / 1000;
  const materialCostPerRoll = totalKgCost * rollWeightKg;
  const safeCutsPerRod = Math.max(input.cutsPerRod, 1);
  const coreCostPerRoll = product.hasCore ? input.corePrice / safeCutsPerRod : 0;
  const rollCost = materialCostPerRoll + coreCostPerRoll;
  const baseBaleCost = rollCost * config.baleRollCount;
  const packagingCost = packaging.packagingCost * packaging.quantityPerBale + config.baleBagCost;
  const productionCost = baseBaleCost + packagingCost;
  const markupFactor = 1 + input.markupPercent / 100;
  const marketPrice = productionCost * markupFactor;
  const grossProfit = marketPrice - productionCost;

  return {
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
  const hasCore = result.product.hasCore;
  const packagingAssumption = result.packaging.assumption ?? 'Selected packaging cost includes pack/sleeve material and the fixed bale bag cost.';

  setText('[data-output="totalKgCost"]', `${formatNumber(result.totalKgCost, 2)} KES/kg`);
  document.getElementById('matRoll').value = formatNumber(result.materialCostPerRoll, 2);
  setText('[data-output="coreCostPerRoll"]', `${formatNumber(result.coreCostPerRoll, 3)} KES/roll`);

  setText('[data-output="marketPrice"]', `KES ${formatNumber(result.marketPrice, 0)}`);
  setText('[data-output="marketSummary"]', `${result.packaging.name} · includes material, core${hasCore ? '' : ' (no core)'}, packaging, bale bag, and ${formatNumber(input.markupPercent, 0)}% markup.`);
  setText('[data-output="productionCost"]', `KES ${formatNumber(result.productionCost, 0)}`);
  setText('[data-output="productionSummary"]', `Base ${formatNumber(result.baseBaleCost, 0)} + packaging ${formatNumber(result.packagingCost, 0)}`);
  setText('[data-output="grossProfit"]', `KES ${formatNumber(result.grossProfit, 0)}`);
  setText('[data-output="profitSummary"]', `At ${formatNumber(input.markupPercent, 0)}% markup`);
  setText('[data-output="packagingAssumption"]', packagingAssumption);

  setText('[data-output="rollCost"]', formatNumber(result.rollCost, 2));
  setText('[data-output="base40"]', formatNumber(result.baseBaleCost, 0));
  setText('[data-output="markupPercent"]', `${formatNumber(input.markupPercent, 0)}%`);
}

function updateProductType(productType) {
  currentProductType = PRICING_CONFIG.products[productType] ? productType : 'regular';
  const product = PRICING_CONFIG.products[currentProductType];

  document.querySelectorAll('[data-product-type]').forEach((button) => {
    const selected = button.dataset.productType === currentProductType;
    button.classList.toggle('on', selected);
    button.setAttribute('aria-pressed', String(selected));
  });

  const rollWeight = document.getElementById('rollWt');
  if (rollWeight) {
    rollWeight.value = product.defaultWeightGrams;
  }

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
