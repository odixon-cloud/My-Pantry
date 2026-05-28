import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./App.css";
import { supabase } from "./supabaseClient";

function App() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("Pantry");
  const [barcode, setBarcode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [items, setItems] = useState([]);

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

    const newItem = {
  name: itemName,
  quantity: quantity,
  location: location,
  barcode: barcode,
};

    const { data, error } = await supabase
      .from("pantry_items")
      .insert([newItem])
      .select();

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    setItems([...items, data[0]]);

    setItemName("");
    setQuantity("");
    setLocation("Pantry");
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
    } else {
      alert("Product not found");
    }
  } catch (error) {
    console.log(error);
    alert("Lookup failed");
  }
}

  function deleteItem(indexToDelete) {
  const updatedItems = items.filter(
    (_, index) => index !== indexToDelete
  );

  setItems(updatedItems);
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

        <button onClick={scanBarcode}>
          Scan Barcode
        </button>

        <button onClick={addItem}>
          Add Item
        </button>
      </div>

      <h2>Inventory</h2>

      <div className="inventory-header">
        <span>Item</span>
        <span>Quantity</span>
        <span>Location</span>
        <span>Action</span>
      </div>

            {items.map((item, index) => (
        <div key={item.id} className="inventory-item">
          <span>{item.name}</span>

          <span>{item.quantity}</span>

          <span>{item.location}</span>

          <button onClick={() => deleteItem(item.id)}>
            Delete
          </button>
        </div>
            ))}
    </div>
  );
}

export default App;
