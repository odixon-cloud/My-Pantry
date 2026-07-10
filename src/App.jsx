import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./App.css";
import { supabase } from "./supabaseClient";

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

    const parsedQuantity = Number.parseInt(quantity, 10);
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

    const { data: existingItem, error: existingItemError } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("name", itemName.trim())
      .eq("location", location)
      .eq("category", category)
      .maybeSingle();

    if (existingItemError) {
      alert(existingItemError.message);
      return;
    }

    if (existingItem) {
      const currentQuantity = Number.parseInt(
        existingItem.quantity || "0",
        10
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

  function scanBarcode() {
    setShowScanner(true);

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
  "reader",
  {
    fps: 10,
    qrbox: 250,
    videoConstraints: {
      facingMode: {
        ideal: "environment",
      },
    },
  },
  false
);

      scanner.render(
        async (decodedText) => {
          setBarcode(decodedText);
          await lookupBarcode(decodedText);
          await scanner.clear();
          setShowScanner(false);
          alert("Barcode Scanned: " + decodedText);
        },
        () => {}
      );
    }, 100);
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

  function getPriorityLabel(itemPriority) {
    const value = Number(itemPriority);

    if (value === 1) return "High";
    if (value === 2) return "Medium";
    return "Low";
  }

  function getShoppingListTitle() {
    if (shoppingListType === "quick") return "Quick Shopping List";
    if (shoppingListType === "medium") return "Medium Shopping List";
    if (shoppingListType === "full") return "Full Shopping List";
    return "";
  }

  function getShoppingListItems() {
    if (!shoppingListType) {
      return [];
    }

    return items
      .filter((item) => {
        const currentQuantity = Number(item.quantity);
        const targetQuantity = Number(item.target_quantity);
        const itemPriority = Number(item.priority);

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
      })
      .sort((a, b) => {
        const priorityDifference = Number(a.priority) - Number(b.priority);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (a.name || "").localeCompare(b.name || "");
      });
  }

  function getSuggestedBuyAmount(item) {
    return Math.max(
      0,
      Number(item.target_quantity) - Number(item.quantity)
    );
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
      const purchasedAmount = Number.parseInt(
        purchasedQuantities[item.id],
        10
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
          const currentQuantity = Number.parseInt(item.quantity || "0", 10);
          const purchasedAmount = Number.parseInt(
            purchasedQuantities[item.id],
            10
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

  const shoppingListItems = getShoppingListItems();

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
          <h3>Scanner Window</h3>

          <div id="reader"></div>

          <button onClick={() => setShowScanner(false)}>
            Close Scanner
          </button>
        </div>
      )}

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
            step="1"
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
            <option>Pantry</option>
            <option>Fridge</option>
            <option>Freezer</option>
            <option>Office Fridge</option>
            <option>Counter</option>
          </select>
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Baking</option>
            <option>Beverages</option>
            <option>Canned Goods</option>
            <option>Condiments</option>
            <option>Dairy</option>
            <option>Frozen</option>
            <option>Meat</option>
            <option>Produce</option>
            <option>Snacks</option>
            <option>Spices</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="1">High Priority</option>
            <option value="2">Medium Priority</option>
            <option value="3">Low Priority</option>
          </select>
        </label>

        <button onClick={scanBarcode}>
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
                      step="1"
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

          {items
            .filter((item) =>
              (item.name || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
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