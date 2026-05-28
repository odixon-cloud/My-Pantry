import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("Pantry");
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

      <button onClick={addItem}>Add Item</button>

      <h2>Inventory</h2>

      <ul>
        {items.map((item, index) => (
          <li key={item.id}>
            {item.name} - {item.quantity} - {item.location}

            <button onClick={() => deleteItem(index)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;