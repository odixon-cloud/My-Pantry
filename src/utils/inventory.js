import { PRIORITY_LABELS, STOCK_STATUS } from "../constants/inventory.js";

export function normalizeNumericValue(value) {
  return Number(value);
}

export function normalizeQuantity(value) {
  return Number.parseFloat(value);
}

export function getPriorityLabel(itemPriority) {
  const value = normalizeNumericValue(itemPriority);

  return PRIORITY_LABELS[value] || PRIORITY_LABELS[3];
}

export function isShoppingListItemEligible(item, shoppingListType) {
  const currentQuantity = normalizeNumericValue(item.quantity);
  const targetQuantity = normalizeNumericValue(item.target_quantity);
  const itemPriority = normalizeNumericValue(item.priority);

  if (
    item.target_quantity === null ||
    item.target_quantity === undefined ||
    item.target_quantity === ""
  ) {
    return false;
  }

  if (
    Number.isNaN(currentQuantity) ||
    Number.isNaN(targetQuantity) ||
    targetQuantity <= currentQuantity
  ) {
    return false;
  }

  if (shoppingListType === "quick") {
    return itemPriority === 1;
  }

  if (shoppingListType === "medium") {
    return itemPriority === 1 || itemPriority === 2;
  }

  return true;
}

export function compareShoppingListItems(a, b) {
  const priorityDifference =
    normalizeNumericValue(a.priority) - normalizeNumericValue(b.priority);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return (a.name || "").localeCompare(b.name || "");
}

export function selectShoppingListItems(items, shoppingListType) {
  if (!shoppingListType) {
    return [];
  }

  return items
    .filter((item) =>
      isShoppingListItemEligible(item, shoppingListType)
    )
    .sort(compareShoppingListItems);
}

export function getSuggestedBuyAmount(item) {
  return Math.max(
    0,
    normalizeNumericValue(item.target_quantity) -
      normalizeNumericValue(item.quantity)
  );
}

export function filterInventoryItems(items, searchTerm) {
  return items.filter((item) =>
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
}

export function getStockStatus(item) {
  if (
    item.target_quantity === null ||
    item.target_quantity === undefined ||
    item.target_quantity === ""
  ) {
    return STOCK_STATUS.UNKNOWN;
  }

  const currentQuantity = normalizeNumericValue(item.quantity);
  const targetQuantity = normalizeNumericValue(item.target_quantity);

  if (
    Number.isNaN(currentQuantity) ||
    Number.isNaN(targetQuantity) ||
    targetQuantity <= 0
  ) {
    return STOCK_STATUS.UNKNOWN;
  }

  if (currentQuantity <= 0) {
    return STOCK_STATUS.OUT;
  }

  if (currentQuantity < targetQuantity) {
    return STOCK_STATUS.LOW;
  }

  return STOCK_STATUS.OK;
}
