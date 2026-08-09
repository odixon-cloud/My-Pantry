import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./App.css";
import {
  CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  PRIORITY_OPTIONS,
} from "./constants/inventory";
import { supabase } from "./supabaseClient";
import {
  filterInventoryItems,
  getPriorityLabel,
  getSuggestedBuyAmount,
  normalizeQuantity,
  selectShoppingListItems,
} from "./utils/inventory";

function App() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("Pantry");
  const [category, setCategory] = useState("Other");
  const [barcode, setBarcode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [priority, setPriority] = useState("3");
  const [shoppingListType, setShoppingListType] = useState("");
  const [selectedPurchasedItems, setSelectedPurchasedItems] = useState({});
  const [purchasedQuantities, setPurchasedQuantities] = useState({});
  const [savingPurchasedItems, setSavingPurchasedItems] = useState(false);
  const [scannerMode, setScannerMode] = useState("add");
  const [useSearchTerm, setUseSearchTerm] = useState("");
  const [selectedUseItem, setSelectedUseItem] = useState(null);
  const [useQuantity, setUseQuantity] = useState("1");
  const [usingItem, setUsingItem] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setItems(data || []);
  }

  function resetForm() {
    setEditingId(null);
    setItemName("");
    setQuantity("");
    setLocation("Pantry");
    setCategory("Other");
    setBarcode("");
    setPriority("3");
  }

  async function addItem() {
    if (itemName.trim() === "" || quantity.trim() === "") {
      alert("Enter an item name and quantity.");
      return;
    }

    const parsedQuantity = normalizeQuantity(quantity);
    const parsedPriority = Number.parseInt(priority, 10);

    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      alert("Quantity must be 0 or greater.");
      return;
    }

    if (![1, 2, 3].includes(parsedPriority)) {
      alert("Choose a valid priority.");
      return;
    }

    if (editingId !== null) {
      const { error } = await supabase
        .from("pantry_items")
        .update({
          name: itemName.trim(),
          quantity: parsedQuantity.toString(),
          location,
          category,
          barcode,
          priority: parsedPriority,
        })
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }

      if (barcode) {
        await saveBarcodeMemory({
          code: barcode,
          productName: itemName.trim(),
          savedCategory: category,
          savedLocation: location,
          savedPriority: parsedPriority,
        });
      }

      await fetchItems();
      resetForm();
      return;
    }

    let existingItem = null;
    let existingItemError = null;

    if (barcode) {
      const barcodeLookup = await supabase
        .from("pantry_items")
        .select("*")
        .eq("barcode", barcode)
        .maybeSingle();

      existingItem = barcodeLookup.data;
      existingItemError = barcodeLookup.error;
    }

    if (!existingItem && !existingItemError) {
      const nameLookup = await supabase
        .from("pantry_items")
        .select("*")
        .eq("name", itemName.trim())
        .eq("location", location)
        .eq("category", category)
        .maybeSingle();

      existingItem = nameLookup.data;
      existingItemError = nameLookup.error;
    }

    if (existingItemError) {
      alert(existingItemError.message);
      return;
    }

    if (existingItem) {
      const currentQuantity = normalizeQuantity(
        existingItem.quantity || "0"
      );

      const newQuantity = currentQuantity + parsedQuantity;

      const { error } = await supabase
        .from("pantry_items")
        .update({
          quantity: newQuantity.toString(),
        })
        .eq("id", existingItem.id);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const newItem = {
        name: itemName.trim(),
        quantity: parsedQuantity.toString(),
        location,
        barcode,
        category,
        priority: parsedPriority,
      };

      const { error } = await supabase
        .from("pantry_items")
        .insert([newItem]);

      if (error) {
        alert(error.message);
        return;
      }
    }

    if (barcode) {
      await saveBarcodeMemory({
        code: barcode,
        productName: itemName.trim(),
        savedCategory: category,
        savedLocation: location,
        savedPriority: parsedPriority,
      });
    }

    await fetchItems();
    resetForm();
  }

  async function saveBarcodeMemory({
    code,
    productName,
    savedCategory,
    savedLocation,
    savedPriority,
  }) {
    const { error } = await supabase
      .from("barcode_lookup")
      .upsert(
        [
          {
            barcode: code,
            product_name: productName,
            category: savedCategory,
            location: savedLocation,
            priority: savedPriority,
          },
        ],
        { onConflict: "barcode" }
      );

    if (error) {
      console.log("Barcode memory error:", error);
    }
  }

  async function stopScanner() {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }

        await scanner.clear();
      } catch (error) {
        console.log("Scanner cleanup error:", error);
      }

      scannerRef.current = null;
    }

    setShowScanner(false);
  }

  function findRearCamera(cameras) {
    const rearCameraWords =
      /back|rear|environment|world|后置|後置|背面|trasera|trás|arrière|rück/i;

    return (
      cameras.find((camera) => rearCameraWords.test(camera.label || "")) ||
      cameras[cameras.length - 1]
    );
  }

  async function improveCameraFocus(scanner) {
    try {
      const capabilities = scanner.getRunningTrackCameraCapabilities();
      const constraints = {};

      if (
        capabilities.focusMode &&
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("continuous")
      ) {
        constraints.focusMode = "continuous";
      }

      if (capabilities.zoom) {
        const minimumZoom = Number(capabilities.zoom.min ?? 1);
        const maximumZoom = Number(capabilities.zoom.max ?? minimumZoom);
        const preferredZoom = Math.min(
          maximumZoom,
          Math.max(minimumZoom, 1.5)
        );

        constraints.zoom = preferredZoom;
      }

      if (Object.keys(constraints).length > 0) {
        await scanner.applyVideoConstraints({
          advanced: [constraints],
        });
      }
    } catch (error) {
      console.log("Camera focus controls are not available:", error);
    }
  }

  function scanBarcode(mode = "add") {
    setScannerMode(mode);
    setShowScanner(true);

    setTimeout(async () => {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      const scanConfig = {
        fps: 8,
        qrbox: { width: 300, height: 180 },
        aspectRatio: 1.777778,
      };

      let candidateBarcode = "";
      let matchingReadCount = 0;
      let scannerReady = false;

      const onScanSuccess = async (decodedText) => {
        if (!scannerReady) {
          return;
        }

        if (decodedText === candidateBarcode) {
          matchingReadCount += 1;
        } else {
          candidateBarcode = decodedText;
          matchingReadCount = 1;
        }

        if (matchingReadCount < 3) {
          return;
        }

        scannerReady = false;
        await stopScanner();

        if (mode === "use") {
          const matchingItem = items.find(
            (item) => String(item.barcode || "") === String(decodedText)
          );

          if (matchingItem) {
            setSelectedUseItem(matchingItem);
            setUseSearchTerm(matchingItem.name || "");
            setUseQuantity("1");
          } else {
            alert("That barcode is not currently in your pantry.");
          }

          return;
        }

        setBarcode(decodedText);
        await lookupBarcode(decodedText);
      };

      const onScanFailure = () => {};

      try {
        await scanner.start(
          { facingMode: { exact: "environment" } },
          scanConfig,
          onScanSuccess,
          onScanFailure
        );

        await improveCameraFocus(scanner);
        setTimeout(() => {
          scannerReady = true;
        }, 1200);
      } catch (environmentError) {
        console.log(
          "Exact rear camera request failed. Trying camera list:",
          environmentError
        );

        try {
          const cameras = await Html5Qrcode.getCameras();

          if (!cameras || cameras.length === 0) {
            throw new Error("No cameras were found.");
          }

          const rearCamera = findRearCamera(cameras);

          await scanner.start(
            rearCamera.id,
            scanConfig,
            onScanSuccess,
            onScanFailure
          );

          await improveCameraFocus(scanner);
          setTimeout(() => {
            scannerReady = true;
          }, 1200);
        } catch (cameraError) {
          console.log("Camera start error:", cameraError);
          alert(
            "The rear camera could not be opened. Check Safari camera permission and try again."
          );
          await stopScanner();
        }
      }
    }, 150);
  }

  async function lookupBarcode(code) {
    try {
      const { data: cachedItem, error: cacheError } = await supabase
        .from("barcode_lookup")
        .select("*")
        .eq("barcode", code)
        .maybeSingle();

      if (cacheError) {
        console.log("Barcode cache lookup error:", cacheError);
      }

      if (cachedItem) {
        setItemName(cachedItem.product_name || "");

        if (cachedItem.category) {
          setCategory(cachedItem.category);
        }

        if (cachedItem.location) {
          setLocation(cachedItem.location);
        }

        if (
          cachedItem.priority !== null &&
          cachedItem.priority !== undefined
        ) {
          setPriority(String(cachedItem.priority));
        }

        return;
      }

      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`
      );

      const data = await response.json();

      if (
        data.status === 1 &&
        data.product &&
        data.product.product_name
      ) {
        const productName = data.product.product_name;

        setItemName(productName);

        await saveBarcodeMemory({
          code,
          productName,
          savedCategory: category,
          savedLocation: location,
          savedPriority: Number.parseInt(priority, 10),
        });
      } else {
        alert("Product not found");
      }
    } catch (error) {
      console.log(error);
      alert("Lookup failed");
    }
  }

  function editItem(item) {
    setEditingId(item.id);
    setItemName(item.name || "");
    setQuantity(String(item.quantity ?? ""));
    setLocation(item.location || "Pantry");
    setCategory(item.category || "Other");
    setBarcode(item.barcode || "");
    setPriority(String(item.priority ?? 3));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteItem(idToDelete) {
    const { error } = await supabase
      .from("pantry_items")
      .delete()
      .eq("id", idToDelete);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    setItems(items.filter((item) => item.id !== idToDelete));
  }

  function getShoppingListTitle() {
    if (shoppingListType === "quick") return "Quick Shopping List";
    if (shoppingListType === "medium") return "Medium Shopping List";
    if (shoppingListType === "full") return "Full Shopping List";
    return "";
  }

  function togglePurchasedItem(item) {
    const isCurrentlySelected = Boolean(selectedPurchasedItems[item.id]);

    setSelectedPurchasedItems((current) => ({
      ...current,
      [item.id]: !isCurrentlySelected,
    }));

    if (!isCurrentlySelected && purchasedQuantities[item.id] === undefined) {
      setPurchasedQuantities((current) => ({
        ...current,
        [item.id]: getSuggestedBuyAmount(item),
      }));
    }
  }

  function updatePurchasedQuantity(itemId, value) {
    setPurchasedQuantities((current) => ({
      ...current,
      [itemId]: value,
    }));
  }

  async function addPurchasedItemsToPantry() {
    const selectedItems = shoppingListItems.filter(
      (item) => selectedPurchasedItems[item.id]
    );

    if (selectedItems.length === 0) {
      alert("Check at least one purchased item first.");
      return;
    }

    for (const item of selectedItems) {
      const purchasedAmount = normalizeQuantity(
        purchasedQuantities[item.id]
      );

      if (Number.isNaN(purchasedAmount) || purchasedAmount <= 0) {
        alert(`Enter a purchased quantity greater than 0 for ${item.name}.`);
        return;
      }
    }

    setSavingPurchasedItems(true);

    try {
      const updateResults = await Promise.all(
        selectedItems.map(async (item) => {
          const currentQuantity = normalizeQuantity(item.quantity || "0");
          const purchasedAmount = normalizeQuantity(
            purchasedQuantities[item.id]
          );
          const newQuantity = currentQuantity + purchasedAmount;

          return supabase
            .from("pantry_items")
            .update({
              quantity: newQuantity.toString(),
            })
            .eq("id", item.id);
        })
      );

      const failedUpdate = updateResults.find((result) => result.error);

      if (failedUpdate) {
        alert(failedUpdate.error.message);
        return;
      }

      await fetchItems();
      setSelectedPurchasedItems({});
      setPurchasedQuantities({});
      alert("Purchased items were added to your pantry.");
    } catch (error) {
      console.log(error);
      alert("The purchased items could not be added.");
    } finally {
      setSavingPurchasedItems(false);
    }
  }

  function selectItemToUse(item) {
    setSelectedUseItem(item);
    setUseSearchTerm(item.name || "");
    setUseQuantity("1");
  }

  function clearUseItem() {
    setSelectedUseItem(null);
    setUseSearchTerm("");
    setUseQuantity("1");
  }

  async function useSelectedItem() {
    if (!selectedUseItem) {
      alert("Search for an item or scan its barcode first.");
      return;
    }

    const amountUsed = normalizeQuantity(useQuantity);
    const currentQuantity = normalizeQuantity(selectedUseItem.quantity || "0");

    if (Number.isNaN(amountUsed) || amountUsed <= 0) {
      alert("Enter an amount greater than 0.");
      return;
    }

    if (amountUsed > currentQuantity) {
      const confirmUseAll = window.confirm(
        `You only have ${currentQuantity} of ${selectedUseItem.name}. Set it to 0?`
      );

      if (!confirmUseAll) {
        return;
      }
    }

    const newQuantity = Math.max(0, currentQuantity - amountUsed);

    setUsingItem(true);

    const { error } = await supabase
      .from("pantry_items")
      .update({
        quantity: newQuantity.toString(),
      })
      .eq("id", selectedUseItem.id);

    setUsingItem(false);

    if (error) {
      alert(error.message);
      return;
    }

    await fetchItems();
    clearUseItem();
    alert("Inventory updated.");
  }

  const matchingUseItems = useSearchTerm.trim()
    ? items
        .filter((item) =>
          (item.name || "")
            .toLowerCase()
            .includes(useSearchTerm.trim().toLowerCase())
        )
        .slice(0, 8)
    : [];

  const shoppingListItems = selectShoppingListItems(items, shoppingListType);

  return (
    <div className="container">
      <h1>My Pantry</h1>

      <h2>{editingId !== null ? "Edit Item" : "Add Item"}</h2>

      <p>Barcode: {barcode || "None"}</p>

      {showScanner && (
        <div
          style={{
            background: "black",
            color: "white",
            padding: "20px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h3>{scannerMode === "use" ? "Scan Item to Use" : "Scanner Window"}</h3>

          <div id="reader"></div>

          <button onClick={stopScanner}>
            Close Scanner
          </button>
        </div>
      )}

      <div className="use-item-section">
        <h2>Use Item</h2>

        <div className="use-item-search-row">
          <input
            type="text"
            placeholder="Search for an item..."
            value={useSearchTerm}
            onChange={(e) => {
              setUseSearchTerm(e.target.value);
              setSelectedUseItem(null);
            }}
          />

          <button onClick={() => scanBarcode("use")}>
            Scan Item to Use
          </button>
        </div>

        {!selectedUseItem && matchingUseItems.length > 0 && (
          <div className="use-search-results">
            {matchingUseItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItemToUse(item)}
              >
                {item.name} — Current: {item.quantity}
              </button>
            ))}
          </div>
        )}

        {selectedUseItem && (
          <div className="selected-use-item">
            <div>
              <strong>{selectedUseItem.name}</strong>
              <span>Current quantity: {selectedUseItem.quantity}</span>
            </div>

            <label>
              Amount Used
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={useQuantity}
                onChange={(e) => setUseQuantity(e.target.value)}
              />
            </label>

            <button onClick={useSelectedItem} disabled={usingItem}>
              {usingItem ? "Updating..." : "Remove from Inventory"}
            </button>

            <button type="button" onClick={clearUseItem}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="add-item-row">
        <label>
          Item Name
          <input
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </label>

        <label>
          Quantity
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        <label>
          Location
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button onClick={() => scanBarcode("add")}>
          Scan Barcode
        </button>

        <button onClick={addItem}>
          {editingId !== null ? "Update Item" : "Add Item"}
        </button>

        {editingId !== null && (
          <button onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      <div className="shopping-list-controls">
        <h2>Generate Shopping List</h2>

        <button onClick={() => setShoppingListType("quick")}>
          Quick List
        </button>

        <button onClick={() => setShoppingListType("medium")}>
          Medium List
        </button>

        <button onClick={() => setShoppingListType("full")}>
          Full List
        </button>

        {shoppingListType && (
          <button onClick={() => setShoppingListType("")}>
            Hide List
          </button>
        )}
      </div>

      {shoppingListType && (
        <div className="shopping-list">
          <h2>{getShoppingListTitle()}</h2>

          {shoppingListItems.length === 0 ? (
            <p>No items are currently needed for this list.</p>
          ) : (
            <>
              <div className="shopping-list-header">
                <span>Bought</span>
                <span>Item</span>
                <span>Suggested</span>
                <span>Purchased</span>
                <span>Category</span>
                <span>Priority</span>
              </div>

              {shoppingListItems.map((item) => {
                const suggestedBuyAmount = getSuggestedBuyAmount(item);
                const purchasedValue =
                  purchasedQuantities[item.id] ?? suggestedBuyAmount;

                return (
                  <div key={item.id} className="shopping-list-item">
                    <input
                      className="shopping-checkbox"
                      type="checkbox"
                      checked={Boolean(selectedPurchasedItems[item.id])}
                      onChange={() => togglePurchasedItem(item)}
                      aria-label={`Mark ${item.name} as purchased`}
                    />

                    <span>{item.name}</span>
                    <span>Buy: {suggestedBuyAmount}</span>

                    <input
                      className="purchased-quantity-input"
                      type="number"
                      min="1"
                      step="0.1"
                      value={purchasedValue}
                      onChange={(e) =>
                        updatePurchasedQuantity(item.id, e.target.value)
                      }
                    />

                    <span>{item.category}</span>
                    <span>{getPriorityLabel(item.priority)}</span>
                  </div>
                );
              })}

              <button
                className="add-purchased-button"
                onClick={addPurchasedItemsToPantry}
                disabled={savingPurchasedItems}
              >
                {savingPurchasedItems
                  ? "Adding Items..."
                  : "Add Purchased Items to Pantry"}
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setShowInventory(!showInventory)}
        style={{ marginTop: "30px" }}
      >
        {showInventory ? "Hide Inventory" : "Show Inventory"}
      </button>

      {showInventory && (
        <>
          <h2>Inventory</h2>

          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              marginBottom: "10px",
              width: "100%",
              padding: "8px",
            }}
          />

          <div className="inventory-header">
            <span>Item</span>
            <span>Quantity</span>
            <span>Target</span>
            <span>Priority</span>
            <span>Location</span>
            <span>Category</span>
            <span>Action</span>
          </div>

          {filterInventoryItems(items, searchTerm)
            .map((item) => (
              <div key={item.id} className="inventory-item">
                <span>{item.name}</span>
                <span>{item.quantity}</span>
                <span>{item.target_quantity ?? "Not set"}</span>
                <span>{getPriorityLabel(item.priority)}</span>
                <span>{item.location}</span>
                <span>{item.category}</span>

                <div>
                  <button onClick={() => editItem(item)}>
                    Edit
                  </button>

                  <button onClick={() => deleteItem(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}

export default App;
