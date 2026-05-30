import { useState, useEffect } from "react";
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

    setItems(data);
  }

  async function addItem() {
  if (itemName.trim() === "" || quantity.trim() === "") {
    return;
  }

  if (editingId) {
    const { error } = await supabase
      .from("pantry_items")
      .update({
        name: itemName,
        quantity: quantity,
        location: location,
        category: category,
      })
      .eq("id", editingId);

    if (error) {
      alert(error.message);
      return;
    }

    fetchItems();

    setEditingId(null);
    setItemName("");
    setQuantity("");
    setLocation("Pantry");
    setCategory("Other");
    setBarcode("");

    return;
  }

  const { data: existingItem } = await supabase
  .from("pantry_items")
  .select("*")
  .eq("name", itemName)
  .eq("location", location)
  .eq("category", category)
  .maybeSingle();

if (existingItem) {
  const newQuantity =
    parseInt(existingItem.quantity || 0) +
    parseInt(quantity || 0);

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

  fetchItems();
} else {
  const newItem = {
    name: itemName,
    quantity: quantity,
    location: location,
    barcode: barcode,
    category: category,
  };

  const { data, error } = await supabase
    .from("pantry_items")
    .insert([newItem])
    .select();

  if (error) {
    alert(error.message);
    return;
  }

  setItems([...items, data[0]]);
}

  if (barcode && itemName) {
    await supabase
      .from("barcode_lookup")
      .update({
        product_name: itemName,
        category: category,
        location: location,
      })
      .eq("barcode", barcode);
  }

  

setItemName("");
setQuantity("");
setLocation("Pantry");
setCategory("Other");
setBarcode("");
  }

  function scanBarcode() {
  setShowScanner(true);

  setTimeout(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
  (decodedText) => {
    setBarcode(decodedText);

    lookupBarcode(decodedText);

    scanner.clear();

    setShowScanner(false);

    alert("Barcode Scanned: " + decodedText);
  },
  () => {}
);
  }, 100);
}
  async function lookupBarcode(code) {
  try {

    const { data: cachedItem } = await supabase
      .from("barcode_lookup")
      .select("*")
      .eq("barcode", code)
      .single();

    if (cachedItem) {
  setItemName(cachedItem.product_name);

  if (cachedItem.category) {
    setCategory(cachedItem.category);
  }
 if (cachedItem.location) {
    setLocation(cachedItem.location);
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
      setItemName(data.product.product_name);

      await supabase
        .from("barcode_lookup")
        .insert([
          {
            barcode: code,
            product_name: data.product.product_name,
          },
        ]);

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
  setItemName(item.name);
  setQuantity(item.quantity);
  setLocation(item.location);
  setCategory(item.category);
  setBarcode(item.barcode || "");
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

  return (
    <div className="container">
      <h1>My Pantry</h1>

      <h2>Add Item</h2>
      <p>Barcode: {barcode}</p>
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
        <input
          placeholder="Item name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />

        <input
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

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

        <button onClick={scanBarcode}>
          Scan Barcode
        </button>

        <button onClick={addItem}>
  {editingId ? "Update Item" : "Add Item"}
</button>
      </div>

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
  <span>Location</span>
  <span>Category</span>
  <span>Action</span>
</div>

            {items
  .filter((item) =>
    item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )
  .map((item, index) => (
        <div key={item.id} className="inventory-item">
          <span>{item.name}</span>

          <span>{item.quantity}</span>

          <span>{item.location}</span>

<span>{item.category}</span>

<button onClick={() => editItem(item)}>
  Edit
</button>

<button onClick={() => deleteItem(item.id)}>
  Delete
</button>
        </div>
            ))}
    </div>
  );
}

export default App;
