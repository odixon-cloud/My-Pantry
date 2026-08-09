const SPECIFIC_ITEM_VISUALS = [
  { keywords: ["frozen vegetables", "frozen veggies"], symbol: "🥦", label: "Frozen vegetables", tone: "frozen" },
  { keywords: ["frozen fruit"], symbol: "🍓", label: "Frozen fruit", tone: "frozen" },
  { keywords: ["frozen pizza"], symbol: "🍕", label: "Frozen pizza", tone: "frozen" },
  { keywords: ["frozen chicken"], symbol: "🍗", label: "Frozen chicken", tone: "frozen" },
  { keywords: ["frozen meal", "frozen meals", "frozen dinner", "frozen dinners"], symbol: "❄️", label: "Frozen meal", tone: "frozen" },
  { keywords: ["french fries"], symbol: "🍟", label: "French fries", tone: "frozen" },
  { keywords: ["tater tots"], symbol: "🥔", label: "Tater tots", tone: "frozen" },
  { keywords: ["ice cream"], symbol: "🍨", label: "Ice cream", tone: "frozen" },
  { keywords: ["canned chicken", "can of chicken"], symbol: "🥫", label: "Canned chicken", tone: "canned" },
  { keywords: ["canned tuna", "can of tuna"], symbol: "🥫", label: "Canned tuna", tone: "canned" },
  { keywords: ["black beans"], symbol: "🫘", label: "Black beans", tone: "canned" },
  { keywords: ["kidney beans"], symbol: "🫘", label: "Kidney beans", tone: "canned" },
  { keywords: ["baked beans"], symbol: "🫘", label: "Baked beans", tone: "canned" },
  { keywords: ["diced tomatoes"], symbol: "🥫", label: "Diced tomatoes", tone: "canned" },
  { keywords: ["tomato paste"], symbol: "🥫", label: "Tomato paste", tone: "canned" },
  { keywords: ["tomato sauce"], symbol: "🫙", label: "Tomato sauce", tone: "condiment" },
  { keywords: ["pasta sauce", "spaghetti sauce"], symbol: "🫙", label: "Pasta sauce", tone: "condiment" },
  { keywords: ["bbq sauce", "barbecue sauce"], symbol: "🫙", label: "Barbecue sauce", tone: "condiment" },
  { keywords: ["hot sauce"], symbol: "🌶️", label: "Hot sauce", tone: "condiment" },
  { keywords: ["soy sauce"], symbol: "🫙", label: "Soy sauce", tone: "condiment" },
  { keywords: ["teriyaki sauce"], symbol: "🫙", label: "Teriyaki sauce", tone: "condiment" },
  { keywords: ["salad dressing"], symbol: "🫙", label: "Salad dressing", tone: "condiment" },
  { keywords: ["steak sauce"], symbol: "🫙", label: "Steak sauce", tone: "condiment" },
  { keywords: ["orange juice"], symbol: "🧃", label: "Orange juice", tone: "beverage" },
  { keywords: ["apple juice"], symbol: "🧃", label: "Apple juice", tone: "beverage" },
  { keywords: ["bottled water"], symbol: "💧", label: "Bottled water", tone: "beverage" },
  { keywords: ["sports drink", "sports drinks", "gatorade"], symbol: "🥤", label: "Sports drink", tone: "beverage" },
  { keywords: ["energy drink", "energy drinks"], symbol: "🥤", label: "Energy drink", tone: "beverage" },
  { keywords: ["sweet potato", "sweet potatoes"], symbol: "🍠", label: "Sweet potato", tone: "produce" },
  { keywords: ["bell pepper", "bell peppers"], symbol: "🫑", label: "Bell pepper", tone: "produce" },
  { keywords: ["green beans"], symbol: "🫘", label: "Green beans", tone: "produce" },
  { keywords: ["chicken breast", "chicken breasts"], symbol: "🍗", label: "Chicken breast", tone: "protein" },
  { keywords: ["chicken thigh", "chicken thighs"], symbol: "🍗", label: "Chicken thigh", tone: "protein" },
  { keywords: ["chicken wing", "chicken wings"], symbol: "🍗", label: "Chicken wings", tone: "protein" },
  { keywords: ["ground beef", "hamburger meat", "ground chuck"], symbol: "🥩", label: "Ground beef", tone: "protein" },
  { keywords: ["pork chop", "pork chops"], symbol: "🥩", label: "Pork chops", tone: "protein" },
  { keywords: ["pork tenderloin"], symbol: "🥩", label: "Pork tenderloin", tone: "protein" },
  { keywords: ["hot dog", "hot dogs"], symbol: "🌭", label: "Hot dogs", tone: "protein" },
  { keywords: ["chocolate milk"], symbol: "🥛", label: "Chocolate milk", tone: "dairy" },
  { keywords: ["cream cheese"], symbol: "🧀", label: "Cream cheese", tone: "dairy" },
  { keywords: ["cottage cheese"], symbol: "🥣", label: "Cottage cheese", tone: "dairy" },
  { keywords: ["sour cream"], symbol: "🥣", label: "Sour cream", tone: "dairy" },
  { keywords: ["heavy cream", "whipping cream", "heavy whipping cream"], symbol: "🥛", label: "Cream", tone: "dairy" },
  { keywords: ["brown sugar"], symbol: "🥣", label: "Brown sugar", tone: "baking" },
  { keywords: ["powdered sugar", "confectioners sugar", "confectioner sugar"], symbol: "🥣", label: "Powdered sugar", tone: "baking" },
  { keywords: ["peanut butter"], symbol: "🥜", label: "Peanut butter", tone: "pantry" },
  { keywords: ["macaroni and cheese", "mac and cheese"], symbol: "🍝", label: "Macaroni and cheese", tone: "pantry" },
  { keywords: ["granola bar", "granola bars", "snack bar", "snack bars"], symbol: "🍫", label: "Snack bar", tone: "snack" },
  { keywords: ["cake mix"], symbol: "🧁", label: "Cake mix", tone: "baking" },
  { keywords: ["brownie mix"], symbol: "🍫", label: "Brownie mix", tone: "baking" },
  { keywords: ["baking soda"], symbol: "🥣", label: "Baking soda", tone: "baking" },
  { keywords: ["baking powder"], symbol: "🥣", label: "Baking powder", tone: "baking" },
  { keywords: ["chocolate chips"], symbol: "🍫", label: "Chocolate chips", tone: "baking" },
];

const COMMON_ITEM_VISUALS = [
  { keywords: ["strawberry", "strawberries"], symbol: "🍓", label: "Strawberry", tone: "produce" },
  { keywords: ["blueberry", "blueberries"], symbol: "🫐", label: "Blueberry", tone: "produce" },
  { keywords: ["raspberry", "raspberries"], symbol: "🫐", label: "Raspberry", tone: "produce" },
  { keywords: ["blackberry", "blackberries"], symbol: "🫐", label: "Blackberry", tone: "produce" },
  { keywords: ["watermelon", "watermelons"], symbol: "🍉", label: "Watermelon", tone: "produce" },
  { keywords: ["cantaloupe", "cantaloupes"], symbol: "🍈", label: "Cantaloupe", tone: "produce" },
  { keywords: ["pineapple", "pineapples"], symbol: "🍍", label: "Pineapple", tone: "produce" },
  { keywords: ["cucumber", "cucumbers"], symbol: "🥒", label: "Cucumber", tone: "produce" },
  { keywords: ["jalapeno", "jalapenos"], symbol: "🌶️", label: "Jalapeño", tone: "produce" },
  { keywords: ["mushroom", "mushrooms"], symbol: "🍄", label: "Mushrooms", tone: "produce" },
  { keywords: ["cauliflower"], symbol: "🥦", label: "Cauliflower", tone: "produce" },
  { keywords: ["broccoli"], symbol: "🥦", label: "Broccoli", tone: "produce" },
  { keywords: ["avocado", "avocados"], symbol: "🥑", label: "Avocado", tone: "produce" },
  { keywords: ["lettuce", "spinach"], symbol: "🥬", label: "Leafy greens", tone: "produce" },
  { keywords: ["celery"], symbol: "🥬", label: "Celery", tone: "produce" },
  { keywords: ["carrot", "carrots"], symbol: "🥕", label: "Carrot", tone: "produce" },
  { keywords: ["onion", "onions"], symbol: "🧅", label: "Onion", tone: "produce" },
  { keywords: ["garlic"], symbol: "🧄", label: "Garlic", tone: "produce" },
  { keywords: ["tomato", "tomatoes"], symbol: "🍅", label: "Tomato", tone: "produce" },
  { keywords: ["potato", "potatoes"], symbol: "🥔", label: "Potato", tone: "produce" },
  { keywords: ["grape", "grapes"], symbol: "🍇", label: "Grapes", tone: "produce" },
  { keywords: ["banana", "bananas"], symbol: "🍌", label: "Banana", tone: "produce" },
  { keywords: ["apple", "apples"], symbol: "🍎", label: "Apple", tone: "produce" },
  { keywords: ["orange", "oranges"], symbol: "🍊", label: "Orange", tone: "produce" },
  { keywords: ["lemon", "lemons", "lime", "limes"], symbol: "🍋", label: "Citrus fruit", tone: "produce" },
  { keywords: ["corn"], symbol: "🌽", label: "Corn", tone: "produce" },
  { keywords: ["peas"], symbol: "🫛", label: "Peas", tone: "produce" },
  { keywords: ["chicken"], symbol: "🍗", label: "Chicken", tone: "protein" },
  { keywords: ["bacon"], symbol: "🥓", label: "Bacon", tone: "protein" },
  { keywords: ["sausage", "sausages", "bratwurst", "bratwursts"], symbol: "🌭", label: "Sausage", tone: "protein" },
  { keywords: ["salmon"], symbol: "🐟", label: "Salmon", tone: "protein" },
  { keywords: ["tuna"], symbol: "🐟", label: "Tuna", tone: "protein" },
  { keywords: ["shrimp", "prawns"], symbol: "🍤", label: "Shrimp", tone: "protein" },
  { keywords: ["turkey"], symbol: "🍗", label: "Turkey", tone: "protein" },
  { keywords: ["steak", "roast", "beef"], symbol: "🥩", label: "Beef", tone: "protein" },
  { keywords: ["pork"], symbol: "🥩", label: "Pork", tone: "protein" },
  { keywords: ["ham"], symbol: "🍖", label: "Ham", tone: "protein" },
  { keywords: ["fish"], symbol: "🐟", label: "Fish", tone: "protein" },
  { keywords: ["egg", "eggs"], symbol: "🥚", label: "Eggs", tone: "protein" },
  { keywords: ["milk"], symbol: "🥛", label: "Milk", tone: "dairy" },
  { keywords: ["cheddar", "mozzarella", "cheese"], symbol: "🧀", label: "Cheese", tone: "dairy" },
  { keywords: ["butter", "margarine"], symbol: "🧈", label: "Butter", tone: "dairy" },
  { keywords: ["yogurt", "yoghurt"], symbol: "🥣", label: "Yogurt", tone: "dairy" },
  { keywords: ["cream"], symbol: "🥛", label: "Cream", tone: "dairy" },
  { keywords: ["bread", "buns", "tortilla", "tortillas"], symbol: "🍞", label: "Bread", tone: "pantry" },
  { keywords: ["rice"], symbol: "🍚", label: "Rice", tone: "pantry" },
  { keywords: ["pasta", "spaghetti", "macaroni", "noodle", "noodles"], symbol: "🍝", label: "Pasta", tone: "pantry" },
  { keywords: ["cereal", "oatmeal"], symbol: "🥣", label: "Cereal", tone: "pantry" },
  { keywords: ["flour", "cornmeal", "breadcrumbs"], symbol: "🌾", label: "Baking staple", tone: "baking" },
  { keywords: ["sugar"], symbol: "🥣", label: "Sugar", tone: "baking" },
  { keywords: ["bean", "beans"], symbol: "🫘", label: "Beans", tone: "canned" },
  { keywords: ["soup", "broth", "stock"], symbol: "🍲", label: "Soup or broth", tone: "canned" },
  { keywords: ["salsa", "pickles"], symbol: "🫙", label: "Jarred item", tone: "condiment" },
  { keywords: ["ketchup"], symbol: "🍅", label: "Ketchup", tone: "condiment" },
  { keywords: ["mustard"], symbol: "🟡", label: "Mustard", tone: "condiment" },
  { keywords: ["mayonnaise", "mayo", "ranch", "worcestershire"], symbol: "🫙", label: "Condiment", tone: "condiment" },
  { keywords: ["water"], symbol: "💧", label: "Water", tone: "beverage" },
  { keywords: ["soda", "coke", "pepsi", "sprite", "pop"], symbol: "🥤", label: "Soda", tone: "beverage" },
  { keywords: ["juice"], symbol: "🧃", label: "Juice", tone: "beverage" },
  { keywords: ["tea"], symbol: "🍵", label: "Tea", tone: "beverage" },
  { keywords: ["coffee"], symbol: "☕", label: "Coffee", tone: "beverage" },
  { keywords: ["pizza"], symbol: "🍕", label: "Pizza", tone: "frozen" },
  { keywords: ["cookies"], symbol: "🍪", label: "Cookies", tone: "snack" },
  { keywords: ["candy"], symbol: "🍬", label: "Candy", tone: "snack" },
  { keywords: ["chocolate"], symbol: "🍫", label: "Chocolate", tone: "snack" },
  { keywords: ["cracker", "crackers"], symbol: "📦", label: "Crackers", tone: "snack" },
  { keywords: ["chip", "chips"], symbol: "🥔", label: "Chips", tone: "snack" },
  { keywords: ["popcorn"], symbol: "🍿", label: "Popcorn", tone: "snack" },
  { keywords: ["pretzel", "pretzels"], symbol: "🥨", label: "Pretzels", tone: "snack" },
  { keywords: ["nut", "nuts", "peanut", "peanuts"], symbol: "🥜", label: "Nuts", tone: "snack" },
  { keywords: ["jelly", "jam", "honey", "syrup"], symbol: "🫙", label: "Jarred pantry item", tone: "condiment" },
  { keywords: ["frosting"], symbol: "🧁", label: "Frosting", tone: "baking" },
  { keywords: ["vanilla"], symbol: "🧁", label: "Vanilla", tone: "baking" },
  { keywords: ["yeast"], symbol: "🍞", label: "Yeast", tone: "baking" },
];

const PACKAGING_VISUALS = [
  { keywords: ["sauce", "dressing", "syrup"], symbol: "🫙", label: "Bottle or jar", tone: "condiment" },
  { keywords: ["canned", "can"], symbol: "🥫", label: "Canned item", tone: "canned" },
  { keywords: ["juice", "soda", "drink", "water"], symbol: "🥤", label: "Beverage", tone: "beverage" },
  { keywords: ["cereal", "crackers", "pasta", "macaroni", "mix"], symbol: "📦", label: "Packaged pantry item", tone: "pantry" },
  { keywords: ["chips", "snack", "snacks"], symbol: "🛍️", label: "Bagged snack", tone: "snack" },
  { keywords: ["frozen"], symbol: "❄️", label: "Frozen package", tone: "frozen" },
  { keywords: ["meat", "protein", "cutlet", "cutlets", "loin"], symbol: "🥩", label: "Meat or protein", tone: "protein" },
  { keywords: ["fruit", "fruits", "vegetable", "vegetables", "veggie", "veggies", "greens"], symbol: "🥬", label: "Produce item", tone: "produce" },
];

const CATEGORY_VISUALS = {
  baking: { symbol: "🥣", label: "Baking item", tone: "baking" },
  beverages: { symbol: "🥤", label: "Beverage", tone: "beverage" },
  "canned goods": { symbol: "🥫", label: "Canned good", tone: "canned" },
  condiments: { symbol: "🧂", label: "Condiment", tone: "condiment" },
  dairy: { symbol: "🥛", label: "Dairy item", tone: "dairy" },
  frozen: { symbol: "❄️", label: "Frozen item", tone: "frozen" },
  meat: { symbol: "🍖", label: "Meat or protein", tone: "protein" },
  produce: { symbol: "🥬", label: "Produce item", tone: "produce" },
  snacks: { symbol: "🍿", label: "Snack", tone: "snack" },
  spices: { symbol: "🌿", label: "Spice", tone: "spice" },
  other: { symbol: "🧺", label: "Pantry item", tone: "generic" },
};

const GENERIC_VISUAL = {
  symbol: "🧺",
  label: "Pantry item",
  tone: "generic",
};

function normalizeSearchText(value) {
  return ` ${String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

function findMatchingVisual(searchableName, visuals) {
  return visuals.find((visual) =>
    visual.keywords.some((keyword) =>
      searchableName.includes(normalizeSearchText(keyword))
    )
  );
}

function createResult(visual, source) {
  return {
    symbol: visual.symbol,
    label: visual.label,
    tone: visual.tone,
    source,
  };
}

export function getInventoryItemVisual(item) {
  const searchableName = normalizeSearchText(item.name);
  const specificMatch = findMatchingVisual(
    searchableName,
    SPECIFIC_ITEM_VISUALS
  );

  if (specificMatch) {
    return createResult(specificMatch, "specific");
  }

  const commonMatch = findMatchingVisual(
    searchableName,
    COMMON_ITEM_VISUALS
  );

  if (commonMatch) {
    return createResult(commonMatch, "name");
  }

  const packagingMatch = findMatchingVisual(
    searchableName,
    PACKAGING_VISUALS
  );

  if (packagingMatch) {
    return createResult(packagingMatch, "type");
  }

  const categoryKey = String(item.category || "").trim().toLowerCase();
  const categoryMatch = CATEGORY_VISUALS[categoryKey];

  if (categoryMatch) {
    return createResult(categoryMatch, "category");
  }

  return createResult(GENERIC_VISUAL, "generic");
}
