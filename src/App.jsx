import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./App.css";
import InventoryItemVisual from "./components/InventoryItemVisual.jsx";
import KitchenStatus from "./components/KitchenStatus.jsx";
import NavIcon from "./components/NavIcon.jsx";
import {
  CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  PRIORITY_OPTIONS,
  STOCK_STATUS,
} from "./constants/inventory.js";
import { supabase } from "./supabaseClient";
import {
  filterInventoryItems,
  getStockStatus,
  getSuggestedBuyAmount,
  normalizeQuantity,
  selectShoppingListItems,
} from "./utils/inventory.js";

const PRIMARY_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", mobileLabel: "Home", icon: "home" },
  { id: "inventory", label: "Inventory", mobileLabel: "Inventory", icon: "inventory" },
  { id: "shopping", label: "Shopping List", mobileLabel: "Shopping", icon: "shopping" },
  { id: "settings", label: "Item Settings", mobileLabel: "Settings", icon: "settings" },
];

const FUTURE_NAV_ITEMS = ["Recipes", "Activity", "Timers", "Music"];

const SECTION_DETAILS = {
  dashboard: {
    title: "Kitchen Dashboard",
    subtitle: "A clear view of what is in your kitchen.",
  },
  inventory: {
    title: "Inventory",
    subtitle: "Search, review, and manage your pantry items.",
  },
  shopping: {
    title: "Shopping List",
    subtitle: "Shopping-list planning is coming in a future update.",
  },
  stock: {
    title: "Stock",
    subtitle: "Scan a batch of items before adding them to inventory.",
  },
  add: {
    title: "Add Item",
    subtitle: "Add a new item or update an existing one.",
  },
  use: {
    title: "Use Mode",
    subtitle: "Scan a batch of used items before updating inventory.",
  },
  settings: {
    title: "Item Settings",
    subtitle: "Manage item preferences and prepare future organization tools.",
  },
};

function createItemSettingsDraft(item) {
  return {
    priority: String(item.priority ?? 3),
    targetQuantity:
      item.target_quantity === null ||
      item.target_quantity === undefined ||
      item.target_quantity === ""
        ? ""
        : String(item.target_quantity),
  };
}

function App() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("Pantry");
  const [category, setCategory] = useState("Other");
  const [barcode, setBarcode] = useState("");
  const [scannerBarcode, setScannerBarcode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryLocation, setInventoryLocation] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [priority, setPriority] = useState("3");
  const [scannerMode, setScannerMode] = useState("add");
  const [stockScannerBarcode, setStockScannerBarcode] = useState("");
  const [stockBatch, setStockBatch] = useState([]);
  const [stockLookupsInProgress, setStockLookupsInProgress] = useState(0);
  const [savingStockBatch, setSavingStockBatch] = useState(false);
  const [useScannerBarcode, setUseScannerBarcode] = useState("");
  const [useBatch, setUseBatch] = useState([]);
  const [useLookupsInProgress, setUseLookupsInProgress] = useState(0);
  const [savingUseBatch, setSavingUseBatch] = useState(false);
  const [useSearchTerm, setUseSearchTerm] = useState("");
  const [selectedUseItem, setSelectedUseItem] = useState(null);
  const [useQuantity, setUseQuantity] = useState("1");
  const [usingItem, setUsingItem] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [settingsSearchTerm, setSettingsSearchTerm] = useState("");
  const [settingsLocation, setSettingsLocation] = useState("All");
  const [itemSettingsDrafts, setItemSettingsDrafts] = useState({});
  const [savingItemSettings, setSavingItemSettings] = useState({});
  const [itemSettingsFeedback, setItemSettingsFeedback] = useState({});
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [deletingSelectedItem, setDeletingSelectedItem] = useState(false);
  const scannerRef = useRef(null);
  const scannerBarcodeInputRef = useRef(null);
  const stockScannerInputRef = useRef(null);
  const stockSessionRef = useRef(0);
  const stockPendingLookupsRef = useRef(0);
  const useScannerInputRef = useRef(null);
  const useSessionRef = useRef(0);
  const usePendingLookupsRef = useRef(0);
  const inventorySearchRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (activeSection !== "add" || showScanner) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      scannerBarcodeInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [activeSection, showScanner]);

  useEffect(() => {
    if (activeSection !== "stock" || savingStockBatch) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      stockScannerInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [activeSection, savingStockBatch]);

  useEffect(() => {
    if (activeSection !== "use" || showScanner || savingUseBatch) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      useScannerInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [activeSection, showScanner, savingUseBatch]);

  useEffect(() => {
    if (!selectedInventoryItem) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setSelectedInventoryItem(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedInventoryItem]);

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
    savedTargetQuantity,
  }) {
    const memoryRecord = {
      barcode: code,
      product_name: productName,
      category: savedCategory,
      location: savedLocation,
      priority: savedPriority,
    };

    if (savedTargetQuantity !== undefined) {
      memoryRecord.target_quantity = savedTargetQuantity;
    }

    const { error } = await supabase
      .from("barcode_lookup")
      .upsert(
        [memoryRecord],
        { onConflict: "barcode" }
      );

    if (error) {
      console.log("Barcode memory error:", error);
    }

    return { error };
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
            throw new Error("No cameras were found.", {
              cause: environmentError,
            });
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

  async function getBarcodeProduct(
    code,
    {
      fallbackCategory = category,
      fallbackLocation = location,
      fallbackPriority = Number.parseInt(priority, 10),
      fallbackTargetQuantity = "",
      rememberNewProduct = true,
      allowUnknownProduct = false,
    } = {}
  ) {
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
        return {
          productName: cachedItem.product_name || "",
          category: cachedItem.category || fallbackCategory,
          location: cachedItem.location || fallbackLocation,
          priority: cachedItem.priority ?? fallbackPriority,
          targetQuantity:
            cachedItem.target_quantity === null ||
            cachedItem.target_quantity === undefined
              ? fallbackTargetQuantity
              : cachedItem.target_quantity,
          isRemembered: true,
        };
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

        if (rememberNewProduct) {
          await saveBarcodeMemory({
            code,
            productName,
            savedCategory: fallbackCategory,
            savedLocation: fallbackLocation,
            savedPriority: fallbackPriority,
          });
        }

        return {
          productName,
          category: fallbackCategory,
          location: fallbackLocation,
          priority: fallbackPriority,
          targetQuantity: fallbackTargetQuantity,
          isRemembered: false,
        };
      } else if (allowUnknownProduct) {
        return {
          productName: "",
          category: fallbackCategory,
          location: fallbackLocation,
          priority: fallbackPriority,
          targetQuantity: fallbackTargetQuantity,
          isRemembered: false,
        };
      } else {
        alert("Product not found");
        return null;
      }
    } catch (error) {
      console.log(error);
      alert("Lookup failed");
      return null;
    }
  }

  async function lookupBarcode(code) {
    const product = await getBarcodeProduct(code);

    if (!product) {
      return;
    }

    setItemName(product.productName);
    setCategory(product.category);
    setLocation(product.location);

    if (product.priority !== null && product.priority !== undefined) {
      setPriority(String(product.priority));
    }
  }

  async function submitScannerBarcode(event) {
    event.preventDefault();

    const completedBarcode = scannerBarcode.trim();

    if (!completedBarcode) {
      scannerBarcodeInputRef.current?.focus();
      return;
    }

    setScannerBarcode("");
    scannerBarcodeInputRef.current?.focus();

    if (!/^\d+$/.test(completedBarcode)) {
      alert("A barcode can only contain numbers.");
      scannerBarcodeInputRef.current?.focus();
      return;
    }

    setBarcode(completedBarcode);

    try {
      await lookupBarcode(completedBarcode);
    } finally {
      scannerBarcodeInputRef.current?.focus();
    }
  }

  async function submitStockBarcode(event) {
    event.preventDefault();

    const completedBarcode = stockScannerBarcode.trim();

    setStockScannerBarcode("");
    stockScannerInputRef.current?.focus();

    if (!completedBarcode) {
      return;
    }

    if (!/^\d+$/.test(completedBarcode)) {
      alert("A barcode can only contain numbers.");
      stockScannerInputRef.current?.focus();
      return;
    }

    const sessionId = stockSessionRef.current;

    stockPendingLookupsRef.current += 1;
    setStockLookupsInProgress((current) => current + 1);

    try {
      const product = await getBarcodeProduct(completedBarcode, {
        fallbackCategory: "Other",
        fallbackLocation: "Pantry",
        fallbackPriority: 3,
        fallbackTargetQuantity: "",
        rememberNewProduct: false,
        allowUnknownProduct: true,
      });

      if (!product || stockSessionRef.current !== sessionId) {
        return;
      }

      setStockBatch((currentBatch) => {
        const existingItem = currentBatch.find(
          (item) => item.barcode === completedBarcode
        );

        if (existingItem) {
          return currentBatch.map((item) =>
            item.barcode === completedBarcode
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        return [
          ...currentBatch,
          {
            barcode: completedBarcode,
            name: product.productName.trim(),
            quantity: 1,
            category: product.category || "Other",
            location: product.location || "Pantry",
            priority: String(product.priority ?? 3),
            targetQuantity:
              product.targetQuantity === null ||
              product.targetQuantity === undefined
                ? ""
                : String(product.targetQuantity),
            isRemembered: product.isRemembered,
          },
        ];
      });
    } finally {
      if (stockSessionRef.current === sessionId) {
        stockPendingLookupsRef.current = Math.max(
          0,
          stockPendingLookupsRef.current - 1
        );
        setStockLookupsInProgress((current) => Math.max(0, current - 1));
        stockScannerInputRef.current?.focus();
      }
    }
  }

  function updateStockBatchItem(barcodeToUpdate, field, value) {
    setStockBatch((currentBatch) =>
      currentBatch.map((item) =>
        item.barcode === barcodeToUpdate
          ? { ...item, [field]: value }
          : item
      )
    );
  }

  async function addStockBatch() {
    if (stockPendingLookupsRef.current > 0) {
      alert("Wait for the current barcode lookup to finish.");
      stockScannerInputRef.current?.focus();
      return;
    }

    if (stockBatch.length === 0) {
      alert("Scan at least one item first.");
      stockScannerInputRef.current?.focus();
      return;
    }

    const preparedBatch = [];

    for (const batchItem of stockBatch) {
      const normalizedName = batchItem.name.trim();
      const parsedPriority = Number.parseInt(batchItem.priority, 10);
      const targetValue = String(batchItem.targetQuantity ?? "").trim();
      let parsedTargetQuantity = null;

      if (!normalizedName) {
        alert(`Enter a product name for barcode ${batchItem.barcode}.`);
        return;
      }

      if (!LOCATION_OPTIONS.includes(batchItem.location)) {
        alert(`Choose a valid location for ${normalizedName}.`);
        return;
      }

      if (!CATEGORY_OPTIONS.includes(batchItem.category)) {
        alert(`Choose a valid category for ${normalizedName}.`);
        return;
      }

      if (![1, 2, 3].includes(parsedPriority)) {
        alert(`Choose a valid priority for ${normalizedName}.`);
        return;
      }

      if (targetValue !== "") {
        parsedTargetQuantity = Number(targetValue);

        if (!Number.isFinite(parsedTargetQuantity) || parsedTargetQuantity < 0) {
          alert(`Target quantity must be blank or 0 or greater for ${normalizedName}.`);
          return;
        }
      }

      preparedBatch.push({
        ...batchItem,
        name: normalizedName,
        priority: parsedPriority,
        targetQuantity: parsedTargetQuantity,
      });
    }

    setSavingStockBatch(true);
    let remainingBatch = [...preparedBatch];

    try {
      for (const batchItem of preparedBatch) {
        const memoryResult = await saveBarcodeMemory({
          code: batchItem.barcode,
          productName: batchItem.name,
          savedCategory: batchItem.category,
          savedLocation: batchItem.location,
          savedPriority: batchItem.priority,
          savedTargetQuantity: batchItem.targetQuantity,
        });

        if (memoryResult.error) {
          throw memoryResult.error;
        }

        const { data: existingItem, error: lookupError } = await supabase
          .from("pantry_items")
          .select("*")
          .eq("name", batchItem.name)
          .eq("location", batchItem.location)
          .eq("category", batchItem.category)
          .maybeSingle();

        if (lookupError) {
          throw lookupError;
        }

        let saveResult;

        if (existingItem) {
          const currentQuantity = normalizeQuantity(existingItem.quantity || "0");
          const newQuantity = currentQuantity + batchItem.quantity;

          saveResult = await supabase
            .from("pantry_items")
            .update({
              quantity: newQuantity.toString(),
              priority: batchItem.priority,
              target_quantity: batchItem.targetQuantity,
            })
            .eq("id", existingItem.id);
        } else {
          saveResult = await supabase.from("pantry_items").insert([
            {
              name: batchItem.name,
              quantity: batchItem.quantity.toString(),
              location: batchItem.location,
              barcode: batchItem.barcode,
              category: batchItem.category,
              priority: batchItem.priority,
              target_quantity: batchItem.targetQuantity,
            },
          ]);
        }

        if (saveResult.error) {
          throw saveResult.error;
        }

        remainingBatch = remainingBatch.filter(
          (item) => item.barcode !== batchItem.barcode
        );
      }

      setStockBatch([]);
      await fetchItems();
      alert("All stocked items were added to your pantry.");
    } catch (error) {
      console.log(error);
      setStockBatch(remainingBatch);
      await fetchItems();
      alert(error.message || "The stock batch could not be added.");
    } finally {
      setSavingStockBatch(false);
      stockScannerInputRef.current?.focus();
    }
  }

  function cancelStockMode() {
    stockSessionRef.current += 1;
    stockPendingLookupsRef.current = 0;
    setStockLookupsInProgress(0);
    setStockScannerBarcode("");
    setStockBatch([]);
    setActiveSection("dashboard");
  }

  async function submitUseBarcode(event) {
    event.preventDefault();

    const completedBarcode = useScannerBarcode.trim();

    setUseScannerBarcode("");
    useScannerInputRef.current?.focus();

    if (!completedBarcode) {
      return;
    }

    if (!/^\d+$/.test(completedBarcode)) {
      alert("A barcode can only contain numbers.");
      useScannerInputRef.current?.focus();
      return;
    }

    const existingBatchItem = useBatch.find(
      (item) => item.barcode === completedBarcode
    );

    if (existingBatchItem) {
      setUseBatch((currentBatch) =>
        currentBatch.map((item) =>
          item.barcode === completedBarcode
            ? { ...item, removalQuantity: item.removalQuantity + 1 }
            : item
        )
      );
      useScannerInputRef.current?.focus();
      return;
    }

    const sessionId = useSessionRef.current;

    usePendingLookupsRef.current += 1;
    setUseLookupsInProgress((current) => current + 1);

    try {
      const product = await getBarcodeProduct(completedBarcode, {
        fallbackCategory: "Other",
        fallbackLocation: "Pantry",
        fallbackPriority: 3,
        fallbackTargetQuantity: "",
        rememberNewProduct: false,
        allowUnknownProduct: true,
      });

      if (!product || useSessionRef.current !== sessionId) {
        return;
      }

      const barcodeMatch = await supabase
        .from("pantry_items")
        .select("*")
        .eq("barcode", completedBarcode)
        .maybeSingle();

      if (barcodeMatch.error) {
        console.log("Use Mode barcode inventory lookup error:", barcodeMatch.error);
      }

      let matchingItem = barcodeMatch.data;

      if (!matchingItem && product.productName.trim()) {
        const rememberedMatch = await supabase
          .from("pantry_items")
          .select("*")
          .eq("name", product.productName.trim())
          .eq("location", product.location || "Pantry")
          .eq("category", product.category || "Other")
          .maybeSingle();

        if (rememberedMatch.error) {
          console.log("Use Mode remembered inventory lookup error:", rememberedMatch.error);
        } else {
          matchingItem = rememberedMatch.data;
        }
      }

      if (!matchingItem) {
        matchingItem =
          items.find(
            (item) => String(item.barcode || "") === completedBarcode
          ) ||
          items.find(
            (item) =>
              item.name === product.productName.trim() &&
              item.location === (product.location || "Pantry") &&
              item.category === (product.category || "Other")
          ) ||
          null;
      }

      setUseBatch((currentBatch) => {
        const duplicateItem = currentBatch.find(
          (item) => item.barcode === completedBarcode
        );

        if (duplicateItem) {
          return currentBatch.map((item) =>
            item.barcode === completedBarcode
              ? { ...item, removalQuantity: item.removalQuantity + 1 }
              : item
          );
        }

        return [
          ...currentBatch,
          {
            barcode: completedBarcode,
            inventoryItemId: matchingItem?.id ?? null,
            name:
              matchingItem?.name ||
              product.productName.trim() ||
              "Unknown barcode",
            removalQuantity: 1,
            currentQuantity: matchingItem
              ? normalizeQuantity(matchingItem.quantity || "0")
              : 0,
            location: matchingItem?.location || product.location || "Pantry",
            category: matchingItem?.category || product.category || "Other",
            isInInventory: Boolean(matchingItem),
          },
        ];
      });
    } finally {
      if (useSessionRef.current === sessionId) {
        usePendingLookupsRef.current = Math.max(
          0,
          usePendingLookupsRef.current - 1
        );
        setUseLookupsInProgress((current) => Math.max(0, current - 1));
        useScannerInputRef.current?.focus();
      }
    }
  }

  async function removeUseBatch() {
    if (usePendingLookupsRef.current > 0) {
      alert("Wait for the current barcode lookup to finish.");
      useScannerInputRef.current?.focus();
      return;
    }

    if (useBatch.length === 0) {
      alert("Scan at least one item first.");
      useScannerInputRef.current?.focus();
      return;
    }

    setSavingUseBatch(true);
    let remainingBatch = [...useBatch];

    try {
      for (const batchItem of useBatch) {
        if (!batchItem.isInInventory || batchItem.inventoryItemId === null) {
          remainingBatch = remainingBatch.filter(
            (item) => item.barcode !== batchItem.barcode
          );
          continue;
        }

        const { data: currentItem, error: lookupError } = await supabase
          .from("pantry_items")
          .select("*")
          .eq("id", batchItem.inventoryItemId)
          .maybeSingle();

        if (lookupError) {
          throw lookupError;
        }

        if (currentItem) {
          const currentQuantity = normalizeQuantity(currentItem.quantity || "0");
          const newQuantity = Math.max(
            0,
            currentQuantity - batchItem.removalQuantity
          );
          const { error: updateError } = await supabase
            .from("pantry_items")
            .update({ quantity: newQuantity.toString() })
            .eq("id", currentItem.id);

          if (updateError) {
            throw updateError;
          }
        }

        remainingBatch = remainingBatch.filter(
          (item) => item.barcode !== batchItem.barcode
        );
      }

      setUseBatch([]);
      await fetchItems();
      alert("Used items were removed from your pantry.");
    } catch (error) {
      console.log(error);
      setUseBatch(remainingBatch);
      await fetchItems();
      alert(error.message || "The removal batch could not be completed.");
    } finally {
      setSavingUseBatch(false);
      useScannerInputRef.current?.focus();
    }
  }

  function cancelUseMode() {
    useSessionRef.current += 1;
    usePendingLookupsRef.current = 0;
    setUseLookupsInProgress(0);
    setUseScannerBarcode("");
    setUseBatch([]);
    setActiveSection("dashboard");
  }

  function editItem(item) {
    setEditingId(item.id);
    setItemName(item.name || "");
    setQuantity(String(item.quantity ?? ""));
    setLocation(item.location || "Pantry");
    setCategory(item.category || "Other");
    setBarcode(item.barcode || "");
    setPriority(String(item.priority ?? 3));
    setActiveSection("add");

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
      return false;
    }

    setItems(items.filter((item) => item.id !== idToDelete));
    return true;
  }

  function editSelectedInventoryItem() {
    if (!selectedInventoryItem) {
      return;
    }

    editItem(selectedInventoryItem);
    setSelectedInventoryItem(null);
  }

  async function deleteSelectedInventoryItem() {
    if (!selectedInventoryItem) {
      return;
    }

    setDeletingSelectedItem(true);
    const wasDeleted = await deleteItem(selectedInventoryItem.id);
    setDeletingSelectedItem(false);

    if (wasDeleted) {
      setSelectedInventoryItem(null);
    }
  }

  function clearInventorySearch() {
    setSearchTerm("");
    inventorySearchRef.current?.focus();
  }

  function getItemSettingsDraft(item) {
    return itemSettingsDrafts[item.id] || createItemSettingsDraft(item);
  }

  function updateItemSettingsDraft(item, field, value) {
    const initialDraft = createItemSettingsDraft(item);

    setItemSettingsDrafts((current) => ({
      ...current,
      [item.id]: {
        ...(current[item.id] || initialDraft),
        [field]: value,
      },
    }));
    setItemSettingsFeedback((current) => ({
      ...current,
      [item.id]: null,
    }));
  }

  async function saveItemSettings(item) {
    const draft = getItemSettingsDraft(item);
    const parsedPriority = Number(draft.priority);
    const targetValue = String(draft.targetQuantity ?? "").trim();
    let parsedTargetQuantity = null;

    if (![1, 2, 3].includes(parsedPriority)) {
      setItemSettingsFeedback((current) => ({
        ...current,
        [item.id]: {
          type: "error",
          message: "Choose a valid priority.",
        },
      }));
      return;
    }

    if (targetValue !== "") {
      parsedTargetQuantity = Number(targetValue);

      if (
        !Number.isFinite(parsedTargetQuantity) ||
        parsedTargetQuantity < 0
      ) {
        setItemSettingsFeedback((current) => ({
          ...current,
          [item.id]: {
            type: "error",
            message: "Target must be blank or 0 or greater.",
          },
        }));
        return;
      }
    }

    setSavingItemSettings((current) => ({
      ...current,
      [item.id]: true,
    }));
    setItemSettingsFeedback((current) => ({
      ...current,
      [item.id]: null,
    }));

    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({
          priority: parsedPriority,
          target_quantity: parsedTargetQuantity,
        })
        .eq("id", item.id);

      if (error) {
        setItemSettingsFeedback((current) => ({
          ...current,
          [item.id]: {
            type: "error",
            message: error.message,
          },
        }));
        return;
      }

      await fetchItems();
      setItemSettingsDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[item.id];
        return nextDrafts;
      });
      setItemSettingsFeedback((current) => ({
        ...current,
        [item.id]: {
          type: "success",
          message: "Saved",
        },
      }));
    } catch (error) {
      console.log(error);
      setItemSettingsFeedback((current) => ({
        ...current,
        [item.id]: {
          type: "error",
          message: "Settings could not be saved.",
        },
      }));
    } finally {
      setSavingItemSettings((current) => ({
        ...current,
        [item.id]: false,
      }));
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

  const dashboardShoppingItems = selectShoppingListItems(items, "full");
  const dashboardAttentionItems = items
    .filter((item) => {
      const status = getStockStatus(item);

      return status === STOCK_STATUS.LOW || status === STOCK_STATUS.OUT;
    })
    .slice(0, 6);
  const dashboardShoppingPreviewItems = dashboardShoppingItems.slice(0, 6);
  const lowOrOutOfStockCount = items.filter((item) => {
    const status = getStockStatus(item);

    return status === STOCK_STATUS.LOW || status === STOCK_STATUS.OUT;
  }).length;
  const activeSectionDetails = SECTION_DETAILS[activeSection];
  const selectedInventoryStockStatus = selectedInventoryItem
    ? getStockStatus(selectedInventoryItem)
    : null;
  const visibleInventoryItems = filterInventoryItems(items, searchTerm).filter(
    (item) =>
      inventoryLocation === "All" || item.location === inventoryLocation
  );
  const visibleSettingsItems = filterInventoryItems(
    items,
    settingsSearchTerm
  ).filter(
    (item) =>
      settingsLocation === "All" || item.location === settingsLocation
  );
  const inventoryGroups = visibleInventoryItems.reduce((groups, item) => {
    const groupName = item.category || "Other";
    const existingGroup = groups.find((group) => group.name === groupName);

    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      groups.push({ name: groupName, items: [item] });
    }

    return groups;
  }, []);

  function navigateToSection(section) {
    if (section === "stock" && activeSection !== "stock") {
      stockSessionRef.current += 1;
      stockPendingLookupsRef.current = 0;
      setStockLookupsInProgress(0);
      setStockScannerBarcode("");
      setStockBatch([]);
    }

    if (section === "use" && activeSection !== "use") {
      useSessionRef.current += 1;
      usePendingLookupsRef.current = 0;
      setUseLookupsInProgress(0);
      setUseScannerBarcode("");
      setUseBatch([]);
    }

    setActiveSection(section);

    if (section === "inventory") {
      setShowInventory(true);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">MP</span>
          <div>
            <strong>My Pantry</strong>
            <span>Kitchen companion</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeSection === item.id ? "nav-item active" : "nav-item"}
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={() => navigateToSection(item.id)}
            >
              <span className="nav-icon"><NavIcon name={item.icon} /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="future-nav" aria-label="Coming later">
          <span className="future-nav-label">Coming Later</span>
          {FUTURE_NAV_ITEMS.map((item) => (
            <button key={item} type="button" className="nav-item future" disabled>
              <span className="nav-icon" aria-hidden="true">·</span>
              <span>{item}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true"></span>
          Pantry ready
        </div>
      </aside>

      <div className="content-shell">
        <header className="top-header">
          <div className="top-header-copy">
            <span className="eyebrow">My Pantry</span>
            <h1>{activeSectionDetails.title}</h1>
            <p>{activeSectionDetails.subtitle}</p>
          </div>
          <div className="header-status-area">
            <KitchenStatus />
            <div className="inventory-count-pill">
              <strong>{items.length}</strong>
              <span>items tracked</span>
            </div>
          </div>
        </header>

        <main
          className={`main-content${
            activeSection === "dashboard" || activeSection === "inventory"
              ? " has-floating-actions"
              : ""
          }`}
        >
          {showScanner && (
            <div className="scanner-panel">
              <h2>{scannerMode === "use" ? "Scan Item to Use" : "Scanner Window"}</h2>
              <div id="reader"></div>
              <button onClick={stopScanner}>Close Scanner</button>
            </div>
          )}

          {activeSection === "dashboard" && (
            <section className="dashboard-view" aria-labelledby="dashboard-heading">
              <div className="dashboard-welcome">
                <div>
                  <span className="eyebrow">At a glance</span>
                  <h2 id="dashboard-heading">Your kitchen, organized.</h2>
                  <p>Check stock levels, plan a shopping trip, or update an item in a few taps.</p>
                </div>
                <button type="button" onClick={() => navigateToSection("add")}>
                  Add an item
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-panel">
                  <span className="summary-icon"><NavIcon name="inventory" /></span>
                  <div className="summary-copy">
                    <span>Total inventory</span>
                    <strong>{items.length}</strong>
                    <small>Unique items tracked</small>
                  </div>
                </div>
                <div className="summary-panel attention">
                  <span className="summary-icon"><NavIcon name="use" /></span>
                  <div className="summary-copy">
                    <span>Needs attention</span>
                    <strong>{lowOrOutOfStockCount}</strong>
                    <small>Low or out of stock</small>
                  </div>
                </div>
                <div className="summary-panel shopping">
                  <span className="summary-icon"><NavIcon name="shopping" /></span>
                  <div className="summary-copy">
                    <span>Shopping list</span>
                    <strong>{dashboardShoppingItems.length}</strong>
                    <small>Items below target</small>
                  </div>
                </div>
              </div>

              <div className="dashboard-preview-grid">
                <section className="dashboard-preview-panel" aria-labelledby="attention-preview-heading">
                  <div className="dashboard-section-heading">
                    <div>
                      <span className="eyebrow">Stock check</span>
                      <h2 id="attention-preview-heading">Low &amp; out of stock</h2>
                    </div>
                    <button type="button" className="secondary-button dashboard-view-link" onClick={() => navigateToSection("inventory")}>View Inventory</button>
                  </div>

                  {dashboardAttentionItems.length === 0 ? (
                    <div className="dashboard-preview-empty">
                      <span className="empty-state-icon"><NavIcon name="inventory" /></span>
                      <p>Everything with a target quantity is well stocked.</p>
                    </div>
                  ) : (
                    <div className="dashboard-preview-list">
                      {dashboardAttentionItems.map((item) => {
                        const stockStatus = getStockStatus(item);
                        const hasTargetQuantity =
                          item.target_quantity !== null &&
                          item.target_quantity !== undefined &&
                          item.target_quantity !== "";

                        return (
                          <div className="dashboard-attention-item" key={item.id}>
                            <InventoryItemVisual item={item} stockStatus={stockStatus} compact showBadge={false} />
                            <div className="dashboard-preview-copy">
                              <strong>{item.name}</strong>
                              <span>
                                Current: {item.quantity}
                                {hasTargetQuantity ? ` · Target: ${item.target_quantity}` : ""}
                              </span>
                            </div>
                            <span className={`dashboard-status-badge stock-${stockStatus.toLowerCase()}`}>{stockStatus}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="dashboard-preview-panel" aria-labelledby="shopping-preview-heading">
                  <div className="dashboard-section-heading">
                    <div>
                      <span className="eyebrow">Next shop</span>
                      <h2 id="shopping-preview-heading">Shopping list preview</h2>
                    </div>
                    <button type="button" className="secondary-button dashboard-view-link" onClick={() => navigateToSection("shopping")}>Open List</button>
                  </div>

                  {dashboardShoppingPreviewItems.length === 0 ? (
                    <div className="dashboard-preview-empty">
                      <span className="empty-state-icon"><NavIcon name="shopping" /></span>
                      <p>Your full shopping list is clear.</p>
                    </div>
                  ) : (
                    <div className="dashboard-preview-list">
                      {dashboardShoppingPreviewItems.map((item) => (
                        <div className="dashboard-shopping-item" key={item.id}>
                          <span className="dashboard-shopping-icon"><NavIcon name="shopping" /></span>
                          <strong>{item.name}</strong>
                          <span className="dashboard-needed-quantity">Need {getSuggestedBuyAmount(item)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="quick-actions-panel">
                <div>
                  <span className="eyebrow">Quick access</span>
                  <h2>What would you like to do?</h2>
                </div>
                <div className="quick-actions">
                  <button type="button" className="quick-action-button" onClick={() => navigateToSection("inventory")}><span><NavIcon name="inventory" /></span>View Inventory</button>
                  <button type="button" className="quick-action-button" onClick={() => navigateToSection("add")}><span><NavIcon name="add" /></span>Add Item</button>
                  <button type="button" className="quick-action-button" onClick={() => navigateToSection("use")}><span><NavIcon name="use" /></span>Use Item</button>
                  <button type="button" className="quick-action-button" onClick={() => navigateToSection("shopping")}><span><NavIcon name="shopping" /></span>Shopping List</button>
                </div>
              </div>

            </section>
          )}

          {activeSection === "stock" && (
            <section className="feature-panel stock-mode-section" aria-labelledby="stock-heading">
              <div className="stock-mode-heading">
                <div className="panel-heading">
                  <span className="eyebrow">Stock Mode</span>
                  <h2 id="stock-heading">Scan a stock batch</h2>
                  <p>Remembered details fill automatically. Review each item before choosing Add All.</p>
                </div>
                <span className="stock-batch-count">
                  {stockBatch.reduce((total, item) => total + item.quantity, 0)} items
                </span>
              </div>

              <form className="stock-scanner-form" onSubmit={submitStockBarcode}>
                <label htmlFor="stock-scanner-input">
                  Bluetooth Barcode Scanner
                  <input
                    id="stock-scanner-input"
                    ref={stockScannerInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="done"
                    placeholder="Scan a barcode"
                    value={stockScannerBarcode}
                    disabled={savingStockBatch}
                    onChange={(event) => setStockScannerBarcode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitStockBarcode(event);
                      }
                    }}
                  />
                </label>
                <span aria-live="polite">
                  {stockLookupsInProgress > 0
                    ? `Looking up ${stockLookupsInProgress} ${stockLookupsInProgress === 1 ? "barcode" : "barcodes"}...`
                    : "Ready to scan"}
                </span>
              </form>

              <div className="stock-batch" aria-live="polite" aria-busy={stockLookupsInProgress > 0}>
                <div className="stock-batch-title-row">
                  <h3>Current batch</h3>
                  <span>{stockBatch.length} unique</span>
                </div>

                {stockBatch.length === 0 ? (
                  <div className="stock-batch-empty">
                    <span className="empty-state-icon"><NavIcon name="stock" /></span>
                    <strong>Ready for your first scan</strong>
                    <p>Each new barcode starts with a quantity of 1.</p>
                  </div>
                ) : (
                  <div className="stock-batch-list">
                    {stockBatch.map((batchItem) => (
                      <article className="stock-batch-item" key={batchItem.barcode}>
                        <div className="stock-batch-product">
                          <label>
                            Product name
                            <input
                              value={batchItem.name}
                              placeholder="Enter product name"
                              onChange={(event) =>
                                updateStockBatchItem(batchItem.barcode, "name", event.target.value)
                              }
                            />
                          </label>
                          <span>{batchItem.barcode}</span>
                          <small>{batchItem.isRemembered ? "Remembered details" : "New barcode — review details"}</small>
                        </div>
                        <div className="stock-batch-quantity">
                          <span>Batch quantity</span>
                          <strong>{batchItem.quantity}</strong>
                        </div>
                        <label>
                          Location
                          <select
                            value={batchItem.location}
                            onChange={(event) =>
                              updateStockBatchItem(batchItem.barcode, "location", event.target.value)
                            }
                          >
                            {LOCATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label>
                          Category
                          <select
                            value={batchItem.category}
                            onChange={(event) =>
                              updateStockBatchItem(batchItem.barcode, "category", event.target.value)
                            }
                          >
                            {CATEGORY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label>
                          Priority
                          <select
                            value={batchItem.priority}
                            onChange={(event) =>
                              updateStockBatchItem(batchItem.barcode, "priority", event.target.value)
                            }
                          >
                            {PRIORITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Target quantity
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Optional"
                            value={batchItem.targetQuantity}
                            onChange={(event) =>
                              updateStockBatchItem(batchItem.barcode, "targetQuantity", event.target.value)
                            }
                          />
                        </label>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="stock-mode-actions">
                <button
                  type="button"
                  onClick={addStockBatch}
                  disabled={
                    savingStockBatch ||
                    stockLookupsInProgress > 0 ||
                    stockBatch.length === 0
                  }
                >
                  {savingStockBatch ? "Adding..." : "Add All"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelStockMode}
                  disabled={savingStockBatch}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {activeSection === "use" && (
            <section className="feature-panel use-item-section" aria-labelledby="use-mode-heading">
              <div className="use-mode-heading">
                <div className="panel-heading">
                  <span className="eyebrow">Bulk removal</span>
                  <h2 id="use-mode-heading">Use Mode</h2>
                  <p>Scan each used item. Inventory changes only when you choose Remove All.</p>
                </div>
                <span className="use-batch-count">
                  {useBatch.reduce((total, item) => total + item.removalQuantity, 0)} removals
                </span>
              </div>

              <form className="use-scanner-form" onSubmit={submitUseBarcode}>
                <label htmlFor="use-scanner-input">
                  Bluetooth Barcode Scanner
                  <input
                    id="use-scanner-input"
                    ref={useScannerInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="done"
                    placeholder="Scan a barcode"
                    value={useScannerBarcode}
                    disabled={savingUseBatch}
                    onChange={(event) => setUseScannerBarcode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitUseBarcode(event);
                      }
                    }}
                  />
                </label>
                <span aria-live="polite">
                  {useLookupsInProgress > 0
                    ? `Looking up ${useLookupsInProgress} ${useLookupsInProgress === 1 ? "barcode" : "barcodes"}...`
                    : "Ready to scan"}
                </span>
              </form>

              <div className="use-batch" aria-live="polite" aria-busy={useLookupsInProgress > 0}>
                <div className="use-batch-title-row">
                  <h3>Removal batch</h3>
                  <span>{useBatch.length} unique</span>
                </div>

                {useBatch.length === 0 ? (
                  <div className="use-batch-empty">
                    <span className="empty-state-icon"><NavIcon name="use" /></span>
                    <strong>Ready for your first scan</strong>
                    <p>Each scan defaults to removing 1.</p>
                  </div>
                ) : (
                  <div className="use-batch-list">
                    {useBatch.map((batchItem) => (
                      <article
                        className={`use-batch-item${batchItem.isInInventory ? "" : " not-in-inventory"}`}
                        key={batchItem.barcode}
                      >
                        <div className="use-batch-product">
                          <strong>{batchItem.name}</strong>
                          <span>{batchItem.barcode}</span>
                          {!batchItem.isInInventory && (
                            <small>Not in inventory — no changes will be made</small>
                          )}
                        </div>
                        <dl>
                          <div>
                            <dt>Remove</dt>
                            <dd>{batchItem.removalQuantity}</dd>
                          </div>
                          <div>
                            <dt>Current</dt>
                            <dd>{batchItem.isInInventory ? batchItem.currentQuantity : "—"}</dd>
                          </div>
                          <div>
                            <dt>Location</dt>
                            <dd>{batchItem.location}</dd>
                          </div>
                          <div>
                            <dt>Category</dt>
                            <dd>{batchItem.category}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="use-mode-actions">
                <button
                  type="button"
                  onClick={removeUseBatch}
                  disabled={
                    savingUseBatch ||
                    useLookupsInProgress > 0 ||
                    useBatch.length === 0
                  }
                >
                  {savingUseBatch ? "Removing..." : "Remove All"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelUseMode}
                  disabled={savingUseBatch}
                >
                  Cancel
                </button>
              </div>

              <div className="single-use-tools">
                <div className="panel-heading">
                  <span className="eyebrow">Single item tools</span>
                  <h3>Search or use the camera scanner</h3>
                </div>

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
                  <button onClick={() => scanBarcode("use")}>Scan Item to Use</button>
                </div>

                {!selectedUseItem && matchingUseItems.length > 0 && (
                  <div className="use-search-results">
                    {matchingUseItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => selectItemToUse(item)}>
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
                      <input type="number" min="0.1" step="0.1" value={useQuantity} onChange={(e) => setUseQuantity(e.target.value)} />
                    </label>
                    <button onClick={useSelectedItem} disabled={usingItem}>
                      {usingItem ? "Updating..." : "Remove from Inventory"}
                    </button>
                    <button type="button" className="secondary-button" onClick={clearUseItem}>Cancel</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === "add" && (
            <section className="feature-panel" aria-labelledby="add-item-heading">
              <div className="panel-heading">
                <span className="eyebrow">Pantry details</span>
                <h2 id="add-item-heading">{editingId !== null ? "Edit Item" : "Add Item"}</h2>
                <p className="barcode-value">Barcode: {barcode || "None"}</p>
              </div>

              <form className="bluetooth-scanner-form" onSubmit={submitScannerBarcode}>
                <label htmlFor="scanner-barcode-input">
                  Bluetooth Barcode Scanner
                  <input
                    id="scanner-barcode-input"
                    ref={scannerBarcodeInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    enterKeyHint="done"
                    placeholder="Scan a barcode or enter its number"
                    value={scannerBarcode}
                    onChange={(event) => setScannerBarcode(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        submitScannerBarcode(event);
                      }
                    }}
                  />
                </label>
                <p>Scans are looked up when the scanner sends Enter. Products are not added automatically.</p>
              </form>

              <div className="add-item-row">
                <label>
                  Item Name
                  <input placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </label>
                <label>
                  Quantity
                  <input type="number" min="0" step="0.1" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </label>
                <label>
                  Location
                  <select value={location} onChange={(e) => setLocation(e.target.value)}>
                    {LOCATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  Category
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <button onClick={() => scanBarcode("add")}>Scan Barcode</button>
                <button onClick={addItem}>{editingId !== null ? "Update Item" : "Add Item"}</button>
                {editingId !== null && <button className="secondary-button" onClick={resetForm}>Cancel Edit</button>}
              </div>
            </section>
          )}

          {activeSection === "shopping" && (
            <section className="feature-panel shopping-placeholder" aria-labelledby="shopping-heading">
              <span className="empty-state-icon"><NavIcon name="shopping" /></span>
              <span className="eyebrow">Coming later</span>
              <h2 id="shopping-heading">Shopping List</h2>
              <p>Shopping-list planning will be available here in a future update.</p>
            </section>
          )}

          {activeSection === "settings" && (
            <section className="feature-panel settings-panel" aria-labelledby="settings-heading">
              <div className="panel-heading">
                <span className="eyebrow">Restock preferences</span>
                <h2 id="settings-heading">Item Settings</h2>
                <p>Set priority and target quantity now. More product, category, and location tools can live here later.</p>
              </div>

              <div className="settings-controls">
                <label className="settings-search">
                  <span>Search items</span>
                  <input
                    type="text"
                    placeholder="Search by item name..."
                    value={settingsSearchTerm}
                    onChange={(e) => setSettingsSearchTerm(e.target.value)}
                  />
                </label>

                <div className="location-filters" aria-label="Filter item settings by location">
                  {["All", ...LOCATION_OPTIONS].map((locationOption) => (
                    <button
                      key={locationOption}
                      type="button"
                      className={settingsLocation === locationOption ? "active" : ""}
                      aria-pressed={settingsLocation === locationOption}
                      onClick={() => setSettingsLocation(locationOption)}
                    >
                      {locationOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-results-summary">
                {visibleSettingsItems.length} {visibleSettingsItems.length === 1 ? "item" : "items"}
              </div>

              {visibleSettingsItems.length === 0 ? (
                <div className="inventory-empty-state">
                  <strong>No matching items</strong>
                  <span>Try another search or location.</span>
                </div>
              ) : (
                <div className="settings-list">
                  <div className="settings-list-header" aria-hidden="true">
                    <span>Item</span>
                    <span>Current</span>
                    <span>Location</span>
                    <span>Category</span>
                    <span>Priority</span>
                    <span>Target</span>
                    <span>Action</span>
                  </div>

                  {visibleSettingsItems.map((item) => {
                    const draft = getItemSettingsDraft(item);
                    const feedback = itemSettingsFeedback[item.id];
                    const isSaving = Boolean(savingItemSettings[item.id]);

                    return (
                      <div key={item.id} className="settings-item-row">
                        <div className="settings-item-name">
                          <span className="settings-field-label">Item</span>
                          <strong>{item.name}</strong>
                        </div>

                        <div className="settings-readonly-cell">
                          <span className="settings-field-label">Current quantity</span>
                          <strong>{item.quantity}</strong>
                        </div>

                        <div className="settings-readonly-cell">
                          <span className="settings-field-label">Location</span>
                          <span>{item.location}</span>
                        </div>

                        <div className="settings-readonly-cell">
                          <span className="settings-field-label">Category</span>
                          <span>{item.category || "Other"}</span>
                        </div>

                        <label className="settings-input-cell">
                          <span className="settings-field-label">Priority</span>
                          <select
                            value={draft.priority}
                            onChange={(e) => updateItemSettingsDraft(item, "priority", e.target.value)}
                          >
                            {PRIORITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label.replace(" Priority", "")}</option>
                            ))}
                          </select>
                        </label>

                        <label className="settings-input-cell">
                          <span className="settings-field-label">Target quantity</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Unset"
                            value={draft.targetQuantity}
                            onChange={(e) => updateItemSettingsDraft(item, "targetQuantity", e.target.value)}
                          />
                        </label>

                        <div className="settings-save-cell">
                          <button type="button" onClick={() => saveItemSettings(item)} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          {feedback && (
                            <span className={`settings-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
                              {feedback.message}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeSection === "inventory" && (
            <section className="feature-panel" aria-labelledby="inventory-heading">
              <div className="inventory-toolbar">
                <div className="panel-heading">
                  <span className="eyebrow">Pantry records</span>
                  <h2 id="inventory-heading">Inventory</h2>
                </div>
                <div className="inventory-toolbar-actions">
                  <button type="button" className="secondary-button" onClick={() => navigateToSection("settings")}>
                    Item Settings
                  </button>
                  <button type="button" className="secondary-button" onClick={() => setShowInventory(!showInventory)}>
                    {showInventory ? "Hide Inventory" : "Show Inventory"}
                  </button>
                </div>
              </div>

              {showInventory && (
                <>
                  <div className="location-filters" aria-label="Filter inventory by location">
                    {["All", ...LOCATION_OPTIONS].map((locationOption) => (
                      <button
                        key={locationOption}
                        type="button"
                        className={inventoryLocation === locationOption ? "active" : ""}
                        aria-pressed={inventoryLocation === locationOption}
                        onClick={() => setInventoryLocation(locationOption)}
                      >
                        {locationOption}
                      </button>
                    ))}
                  </div>

                  <div className="inventory-search-wrap">
                    <input
                      ref={inventorySearchRef}
                      className="inventory-search"
                      type="text"
                      placeholder="Search inventory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="inventory-search-clear"
                        aria-label="Clear inventory search"
                        onClick={clearInventorySearch}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="inventory-results-summary">
                    <span>{visibleInventoryItems.length} {visibleInventoryItems.length === 1 ? "item" : "items"}</span>
                    <span>{inventoryLocation === "All" ? "All locations" : inventoryLocation}</span>
                  </div>

                  {inventoryGroups.length === 0 ? (
                    <div className="inventory-empty-state">
                      <strong>No matching items</strong>
                      <span>Try another search or location.</span>
                    </div>
                  ) : (
                    <div className="inventory-groups">
                      {inventoryGroups.map((group) => (
                        <section key={group.name} className="inventory-category-group" aria-labelledby={`category-${group.name.replace(/\s+/g, "-").toLowerCase()}`}>
                          <div className="category-heading">
                            <h3 id={`category-${group.name.replace(/\s+/g, "-").toLowerCase()}`}>{group.name}</h3>
                            <span>{group.items.length}</span>
                          </div>

                          <div className="inventory-card-grid">
                            {group.items.map((item) => {
                              const stockStatus = getStockStatus(item);

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  className={`inventory-card stock-${stockStatus.toLowerCase()}`}
                                  aria-label={`View details for ${item.name}`}
                                  onClick={() => setSelectedInventoryItem(item)}
                                >
                                  <InventoryItemVisual item={item} stockStatus={stockStatus} />

                                  <div className="inventory-card-body">
                                    <h4>{item.name} <span>({item.quantity})</span></h4>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {(activeSection === "dashboard" || activeSection === "inventory") && (
            <div className="dashboard-floating-actions" aria-label="Pantry modes">
              <button
                type="button"
                className="dashboard-floating-action stock-action"
                onClick={() => navigateToSection("stock")}
              >
                <span className="dashboard-floating-icon" aria-hidden="true">
                  <NavIcon name="stock" />
                </span>
                <span>Stock</span>
              </button>

              <button
                type="button"
                className={`dashboard-floating-action use-action${
                  activeSection === "inventory" ? " inventory-use-drop-target" : ""
                }`}
                data-future-drop-target={
                  activeSection === "inventory" ? "inventory-use" : undefined
                }
                onClick={() => navigateToSection("use")}
              >
                <span className="dashboard-floating-icon" aria-hidden="true">
                  <NavIcon name="use" />
                </span>
                <span>Use</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {selectedInventoryItem && (
        <div className="item-detail-backdrop" onClick={() => setSelectedInventoryItem(null)}>
          <div
            className="item-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="item-detail-close"
              aria-label="Close item details"
              onClick={() => setSelectedInventoryItem(null)}
            >
              ×
            </button>

            <InventoryItemVisual
              item={selectedInventoryItem}
              stockStatus={selectedInventoryStockStatus}
            />

            <div className="item-detail-content">
              <span className="eyebrow">Inventory item</span>
              <h2 id="item-detail-title">{selectedInventoryItem.name}</h2>

              <dl className="item-detail-grid">
                <div>
                  <dt>Current quantity</dt>
                  <dd>{selectedInventoryItem.quantity}</dd>
                </div>
                <div>
                  <dt>Stock status</dt>
                  <dd className={`detail-stock-status stock-${selectedInventoryStockStatus.toLowerCase()}`}>
                    {selectedInventoryStockStatus}
                  </dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{selectedInventoryItem.category || "Other"}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selectedInventoryItem.location}</dd>
                </div>
                {selectedInventoryItem.barcode && (
                  <div className="item-detail-barcode">
                    <dt>Barcode</dt>
                    <dd>{selectedInventoryItem.barcode}</dd>
                  </div>
                )}
              </dl>

              <div className="item-detail-actions">
                <button type="button" onClick={editSelectedInventoryItem}>Edit Item</button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={deleteSelectedInventoryItem}
                  disabled={deletingSelectedItem}
                >
                  {deletingSelectedItem ? "Deleting..." : "Delete Item"}
                </button>
                <button type="button" className="secondary-button" onClick={() => setSelectedInventoryItem(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeSection === item.id ? "active" : ""}
            aria-current={activeSection === item.id ? "page" : undefined}
            onClick={() => navigateToSection(item.id)}
          >
            <span className="mobile-nav-icon"><NavIcon name={item.icon} /></span>
            <span>{item.mobileLabel}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
