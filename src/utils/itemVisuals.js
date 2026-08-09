const ITEM_NAME_VISUALS = [
  { keywords: ["frozen vegetables", "frozen veggies"], symbol: "🥦", label: "Frozen vegetables", tone: "frozen" },
  { keywords: ["frozen pizza"], symbol: "🍕", label: "Frozen pizza", tone: "frozen" },
  { keywords: ["ice cream"], symbol: "🍨", label: "Ice cream", tone: "frozen" },
  { keywords: ["ground beef"], symbol: "🥩", label: "Ground beef", tone: "protein" },
  { keywords: ["peanut butter"], symbol: "🥜", label: "Peanut butter", tone: "pantry" },
  { keywords: ["sour cream"], symbol: "🥣", label: "Sour cream", tone: "dairy" },
  { keywords: ["strawberry", "strawberries"], symbol: "🍓", label: "Strawberry", tone: "produce" },
  { keywords: ["broccoli"], symbol: "🥦", label: "Broccoli", tone: "produce" },
  { keywords: ["avocado", "avocados"], symbol: "🥑", label: "Avocado", tone: "produce" },
  { keywords: ["lettuce"], symbol: "🥬", label: "Lettuce", tone: "produce" },
  { keywords: ["carrot", "carrots"], symbol: "🥕", label: "Carrot", tone: "produce" },
  { keywords: ["onion", "onions"], symbol: "🧅", label: "Onion", tone: "produce" },
  { keywords: ["tomato", "tomatoes"], symbol: "🍅", label: "Tomato", tone: "produce" },
  { keywords: ["potato", "potatoes"], symbol: "🥔", label: "Potato", tone: "produce" },
  { keywords: ["grape", "grapes"], symbol: "🍇", label: "Grapes", tone: "produce" },
  { keywords: ["banana", "bananas"], symbol: "🍌", label: "Banana", tone: "produce" },
  { keywords: ["apple", "apples"], symbol: "🍎", label: "Apple", tone: "produce" },
  { keywords: ["orange", "oranges"], symbol: "🍊", label: "Orange", tone: "produce" },
  { keywords: ["lemon", "lemons"], symbol: "🍋", label: "Lemon", tone: "produce" },
  { keywords: ["lime", "limes"], symbol: "🍋", label: "Lime", tone: "produce" },
  { keywords: ["chicken"], symbol: "🍗", label: "Chicken", tone: "protein" },
  { keywords: ["bacon"], symbol: "🥓", label: "Bacon", tone: "protein" },
  { keywords: ["sausage", "sausages"], symbol: "🌭", label: "Sausage", tone: "protein" },
  { keywords: ["salmon"], symbol: "🐟", label: "Salmon", tone: "protein" },
  { keywords: ["shrimp", "prawns"], symbol: "🍤", label: "Shrimp", tone: "protein" },
  { keywords: ["turkey"], symbol: "🍗", label: "Turkey", tone: "protein" },
  { keywords: ["steak"], symbol: "🥩", label: "Steak", tone: "protein" },
  { keywords: ["beef"], symbol: "🥩", label: "Beef", tone: "protein" },
  { keywords: ["pork"], symbol: "🥩", label: "Pork", tone: "protein" },
  { keywords: ["ham"], symbol: "🍖", label: "Ham", tone: "protein" },
  { keywords: ["fish"], symbol: "🐟", label: "Fish", tone: "protein" },
  { keywords: ["egg", "eggs"], symbol: "🥚", label: "Eggs", tone: "protein" },
  { keywords: ["milk"], symbol: "🥛", label: "Milk", tone: "dairy" },
  { keywords: ["cheese"], symbol: "🧀", label: "Cheese", tone: "dairy" },
  { keywords: ["butter"], symbol: "🧈", label: "Butter", tone: "dairy" },
  { keywords: ["yogurt", "yoghurt"], symbol: "🥣", label: "Yogurt", tone: "dairy" },
  { keywords: ["cream"], symbol: "🥛", label: "Cream", tone: "dairy" },
  { keywords: ["bread"], symbol: "🍞", label: "Bread", tone: "pantry" },
  { keywords: ["rice"], symbol: "🍚", label: "Rice", tone: "pantry" },
  { keywords: ["pasta", "noodles"], symbol: "🍝", label: "Pasta", tone: "pantry" },
  { keywords: ["cereal"], symbol: "🥣", label: "Cereal", tone: "pantry" },
  { keywords: ["flour"], symbol: "🥣", label: "Flour", tone: "pantry" },
  { keywords: ["sugar"], symbol: "🥣", label: "Sugar", tone: "pantry" },
  { keywords: ["bean", "beans"], symbol: "🫘", label: "Beans", tone: "pantry" },
  { keywords: ["soup"], symbol: "🍲", label: "Soup", tone: "pantry" },
  { keywords: ["coffee"], symbol: "☕", label: "Coffee", tone: "beverage" },
  { keywords: ["water"], symbol: "💧", label: "Water", tone: "beverage" },
  { keywords: ["soda", "pop"], symbol: "🥤", label: "Soda", tone: "beverage" },
  { keywords: ["juice"], symbol: "🧃", label: "Juice", tone: "beverage" },
  { keywords: ["tea"], symbol: "🍵", label: "Tea", tone: "beverage" },
];

const CATEGORY_VISUALS = {
  Baking: { symbol: "🥣", label: "Baking item", tone: "baking" },
  Beverages: { symbol: "🥤", label: "Beverage", tone: "beverage" },
  "Canned Goods": { symbol: "🥫", label: "Canned good", tone: "canned" },
  Condiments: { symbol: "🧂", label: "Condiment", tone: "condiment" },
  Dairy: { symbol: "🥛", label: "Dairy item", tone: "dairy" },
  Frozen: { symbol: "❄️", label: "Frozen item", tone: "frozen" },
  Meat: { symbol: "🍖", label: "Meat or protein", tone: "protein" },
  Produce: { symbol: "🥬", label: "Produce item", tone: "produce" },
  Snacks: { symbol: "🍿", label: "Snack", tone: "snack" },
  Spices: { symbol: "🌿", label: "Spice", tone: "spice" },
  Other: { symbol: "🧺", label: "Pantry item", tone: "generic" },
};

const GENERIC_VISUAL = {
  symbol: "🧺",
  label: "Pantry item",
  tone: "generic",
};

function normalizeSearchText(value) {
  return ` ${String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

export function getInventoryItemVisual(item) {
  const searchableName = normalizeSearchText(item.name);
  const nameMatch = ITEM_NAME_VISUALS.find((visual) =>
    visual.keywords.some((keyword) =>
      searchableName.includes(` ${keyword} `)
    )
  );

  if (nameMatch) {
    return {
      symbol: nameMatch.symbol,
      label: nameMatch.label,
      tone: nameMatch.tone,
      source: "name",
    };
  }

  const categoryMatch = CATEGORY_VISUALS[item.category];

  if (categoryMatch) {
    return {
      ...categoryMatch,
      source: "category",
    };
  }

  return {
    ...GENERIC_VISUAL,
    source: "generic",
  };
}
