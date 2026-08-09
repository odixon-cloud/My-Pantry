import { getInventoryItemVisual } from "../utils/itemVisuals.js";

function InventoryItemVisual({ item, stockStatus }) {
  const visual = getInventoryItemVisual(item);
  const stockStatusClass = `stock-${stockStatus.toLowerCase()}`;
  const showStockBadge = stockStatus === "LOW" || stockStatus === "OUT";

  return (
    <div className={`product-placeholder visual-${visual.tone}`}>
      {showStockBadge && (
        <span className={`stock-status-badge ${stockStatusClass}`}>
          {stockStatus}
        </span>
      )}
      <span className="product-visual" role="img" aria-label={visual.label}>
        {visual.symbol}
      </span>
    </div>
  );
}

export default InventoryItemVisual;
