// src/data/insertShogunMenu.js

// Import the Supabase client from your existing config
const supabase = require('../supabaseClient');

// --- 1. SHOGUN MENU DATA STRUCTURE (175 Items) ---
const shogunMenuItems = [
    // --- SUSHI/JAPANESE MENU (Pages 5-9) ---
    { name: 'Miso Soup', description: 'Standard Miso Soup', price: 90.00, category: 'Soup', order: 1 },
    { name: 'Miso Soup With Shiitaki Or Crab', description: 'Miso Soup with Shiitaki or Crab', price: 115.00, category: 'Soup', order: 2 },
    { name: 'Soft-Shell Crab Maki', description: 'Fried Crab, Takiwan, Tobico (4 pcs)', price: 115.00, category: 'Makis', order: 3 },
    { name: 'Dragon Maki', description: 'Shrimp Tempura, Avocado, Eel, Unagi Sauce (4 pcs)', price: 120.00, category: 'Makis', order: 4 },
    { name: 'Wagyu Maki', description: 'Spicy Crab Mix, Wagyu Striploin, Chili Garlic (4 pcs)', price: 190.00, category: 'Makis', order: 5 },
    { name: 'Queen Maki', description: 'Salmon, Philadelphia Cheese, Avocado Caviar (4 pcs)', price: 120.00, category: 'Makis', order: 6 },
    { name: 'Spicy Double Hamachi Maki', description: 'Yellow Tail Mix, Avocado, Balsamic Mayo, Angel Hair Potatoes (4 pcs)', price: 120.00, category: 'Makis', order: 7 },
    { name: 'Tuna Crunch Maki', description: 'Tuna, Spicy Aioli, Tobiko, Sakura Mix (4 pcs)', price: 120.00, category: 'Makis', order: 8 },
    { name: 'Hamachi Maki', description: 'Furikake, Soy Paper, Katsuobushi, Spicy Mayo (4 pcs)', price: 115.00, category: 'Makis', order: 9 },
    { name: 'Crunchy California Maki', description: 'Crab, Avocado, Tobiko, Tenkatsu (4 pcs)', price: 115.00, category: 'Makis', order: 10 },
    { name: 'Crab Maki', description: 'Soy Paper, Crab Mix, Butter Ponzu (4 pcs)', price: 115.00, category: 'Makis', order: 11 },
    { name: 'Spicy Shogun Crab Butter Maki', description: 'Crab, Butter (4 pcs)', price: 120.00, category: 'Makis', order: 12 },
    { name: 'Corn Crunch Maki', description: 'Sauteed Shrimp, Avocado, Corn Togarachi (4 pcs)', price: 115.00, category: 'Makis', order: 13 },
    { name: 'Kinoko (v) Maki', description: 'Fried Enoki, Yakitori Sauce, Shiitake Mushroom. Truffle (4 pcs)', price: 100.00, category: 'Makis', order: 14 },
    { name: 'Volcano Maki', description: 'Cream Cheese, Squid. Teriyaki Sauce (4 pcs)', price: 115.00, category: 'Makis', order: 15 },
    { name: 'Caterpillar Salmon Maki', description: 'Salmon, Cucumber, Avocado, Teriyaki Sauce (4 pcs)', price: 120.00, category: 'Makis', order: 16 },
    { name: 'Spicy Crunchy Salmon Maki', description: 'Spicy Sauce, Salmon, Tenkatsu (4 pcs)', price: 120.00, category: 'Makis', order: 17 },
    { name: 'Spicy Crunchy Tuna Maki', description: 'Spicy Sauce, Tuna, Tenkatsu (4 pcs)', price: 120.00, category: 'Makis', order: 18 },
    { name: 'Ebi Tempura Maki', description: 'Shrimp Tempura, Teriyaki Sauce (4 pcs)', price: 120.00, category: 'Makis', order: 19 },
    { name: 'Lobster Flaming Maki', description: 'Lobster Tempura. Kani, Avocado (4 pcs)', price: 135.00, category: 'Makis', order: 20 },
    { name: 'Tempura Chicken Maki', description: 'Chicken Tempura. Teriyaki Sauce. Scallion (4 pcs)', price: 100.00, category: 'Makis', order: 21 },
    { name: 'Spicy Seaweed (v) Maki', description: 'Wakame, Goma Ponzu. Avocado (4 pcs)', price: 100.00, category: 'Makis', order: 22 },
    { name: 'Salmon Oshizushi', description: 'Furikake, Spicy Salmon, Ikura', price: 155.00, category: 'Oshizushi', order: 23 },
    { name: 'Hamachi Oshizushi', description: 'Ito Togarashi, Dashi Mayo, Yakitori Sauce', price: 235.00, category: 'Oshizushi', order: 24 },
    { name: 'Salmon Sandwich', description: 'Spicy Salmon, Tobiko, Tenkatsu, Eel Sauce', price: 265.00, category: 'Oshizushi', order: 25 },
    { name: 'Tokyo Set Menu 29 Pieces', description: 'Maki (12 pcs), Sushi (8 pcs), Sashimi (9 pcs)', price: 950.00, category: 'Set Menu', order: 26 },
    { name: 'Shogun Set Menu 57 Pieces', description: 'Maki (30 pcs), Sushi (12 pcs), Sashimi (15 pcs)', price: 1950.00, category: 'Set Menu', order: 27 },
    { name: 'Maguro Sashimi (2 pcs)', description: 'Tuna', price: 115.00, category: 'Sashimi', order: 28 },
    { name: 'Hamachi Sashimi (2 pcs)', description: 'Yellow Tail', price: 150.00, category: 'Sashimi', order: 29 },
    { name: 'Shake Sashimi (2 pcs)', description: 'Salmon', price: 115.00, category: 'Sashimi', order: 30 },
    { name: 'Hotategai Sashimi (2 pcs)', description: 'Scallop', price: 175.00, category: 'Sashimi', order: 31 },
    { name: 'Ebi Sashimi (2 pcs)', description: 'Shrimp', price: 110.00, category: 'Sashimi', order: 32 },
    { name: 'Unagi Sashimi (2 pcs)', description: 'Marinated Japanese Eel', price: 145.00, category: 'Sashimi', order: 33 },
    { name: 'Maguro Nigiri', description: 'Tuna', price: 140.00, category: 'Nigiri', order: 34 },
    { name: 'Hamachi Nigiri', description: 'Yellow Tail', price: 120.00, category: 'Nigiri', order: 35 },
    { name: 'Shake Nigiri', description: 'Salmon', price: 120.00, category: 'Nigiri', order: 36 },
    { name: 'Hotate Kaibashira Nigiri', description: 'Scallop', price: 195.00, category: 'Nigiri', order: 37 },
    { name: 'Ebi Nigiri', description: 'Shrimp', price: 175.00, category: 'Nigiri', order: 38 },
    { name: 'Unagi Nigiri', description: 'Marinated Japanese Eel', price: 175.00, category: 'Nigiri', order: 39 },
    { name: 'Tuna Temaki', description: 'Tuna, Truffle Mayo, Tobiko', price: 180.00, category: 'Temaki / Tacos', order: 40 },
    { name: 'Spicy Tuna Temaki', description: 'Spicy Tuna', price: 150.00, category: 'Temaki / Tacos', order: 41 },
    { name: 'Salmon Temaki', description: 'Salmon, Garlic Aioli, Pickled Onion', price: 190.00, category: 'Temaki / Tacos', order: 42 },
    { name: 'Salmon Tacos', description: 'Salmon', price: 150.00, category: 'Temaki / Tacos', order: 43 },
    { name: 'Avocado (v) Tacos', description: 'Avocado', price: 120.00, category: 'Temaki / Tacos', order: 44 },
    { name: 'Spicy Crab Tacos', description: 'Spicy Crab, Wasabi Mayo, Tobiko', price: 140.00, category: 'Temaki / Tacos', order: 45 },
    { name: 'Wagyu Tacos', description: 'Wagyu', price: 300.00, category: 'Temaki / Tacos', order: 46 },
    { name: 'Bang Bang Shrimp Tacos', description: 'Bang Bang Shrimp, Yuzu Pearl, Coriander', price: 150.00, category: 'Temaki / Tacos', order: 47 },
    { name: 'Tuna Tartare', description: 'Wasabi Ponzu, Sweet Soya, Avocado Puree', price: 185.00, category: 'Tartare', order: 48 },
    { name: 'Salmon Tartare', description: 'Yuzu Dressing, Sweet Soya, Arare', price: 185.00, category: 'Tartare', order: 49 },
    { name: 'Wagyu Brioche Tartare', description: 'Striploin, Brioche, Truffle', price: 375.00, category: 'Tartare', order: 50 },
    { name: 'Beef Gyoza', description: 'Butternut Puree, Spicy Ponzu', price: 150.00, category: 'Gyoza', order: 51 },
    { name: 'Chicken Gyoza', description: 'Ito Togarashi, Scallion, Spicy Ponzu', price: 130.00, category: 'Gyoza', order: 52 },
    { name: 'Salmon Carpaccio', description: 'Jalapeno Dressing, Red Chili, Negi Oil', price: 220.00, category: 'Carpaccio / Tataki', order: 53 },
    { name: 'Scallops Carpaccio', description: 'Yuzu Vinaigrette, Yuzu Kosho, Caviar', price: 270.00, category: 'Carpaccio / Tataki', order: 54 },
    { name: 'Hamachi Tataki', description: 'Ponzu, Mango Salsa, Avocado Puree', price: 240.00, category: 'Carpaccio / Tataki', order: 55 },
    { name: 'Tuna Tataki', description: 'Yuzu Miso, Caviar, Sesame', price: 220.00, category: 'Carpaccio / Tataki', order: 56 },
    { name: 'Salmon Tataki', description: 'Ponzu Sauce', price: 220.00, category: 'Carpaccio / Tataki', order: 57 },
    { name: 'Crab Salad', description: 'Cucumber, Goma Dressing, Tobiko', price: 185.00, category: 'Salad', order: 58 },
    { name: 'Creamy Seaweed (v) Salad', description: 'Chuka Wakame, Goma Dressing, Spinach', price: 155.00, category: 'Salad', order: 59 },
    { name: 'Chinois Chicken Salad', description: 'Romaine Lettuce, Crispy Wonton, Plum Dressing', price: 175.00, category: 'Salad', order: 60 },
    { name: 'Seafood Ceviche Salad', description: 'Tuna, Salmon, Hamachi, Wonton', price: 220.00, category: 'Salad', order: 61 },
    { name: 'Crispy Crunchy Salmon Salad', description: 'Salmon', price: 220.00, category: 'Salad', order: 62 },
    { name: 'Crispy Crunchy Tuna Salad', description: 'Tuna', price: 220.00, category: 'Salad', order: 63 },
    { name: 'Tuna Pizzette', description: 'Thai Chili, Sourdough, Yuzu Kosho (Choice Of Sriracha Aioli Or Garlic Aioli)', price: 300.00, category: 'Pizzette', order: 64 },
    { name: 'Salmon Pizzette', description: 'Thai Chili, Sourdough, Yuzu Kosho (Choice Of Sriracha Aioli Or Garlic Aioli)', price: 280.00, category: 'Pizzette', order: 65 },
    { name: 'Crispy Short Ribs', description: 'Wagyu, Bbq Sauce, Leeks', price: 320.00, category: 'Hot Appetizers', order: 66 },
    { name: 'Korean Fried Wings Sando', description: 'Red Cabbage Slaw, Charcoal Brioche, Spicy Sauce', price: 120.00, category: 'Hot Appetizers', order: 67 },
    { name: 'Wagyu Sando', description: 'Angus Tenderloin, Creamy Wasabi, Gold Leaf', price: 280.00, category: 'Hot Appetizers', order: 68 },
    { name: 'Chicken Sando', description: 'Tonkatsu Sauce, Furikake', price: 180.00, category: 'Hot Appetizers', order: 69 },
    { name: 'Popcorn Shrimps', description: 'Spicy Sauce, Wasabi Peas', price: 160.00, category: 'Hot Appetizers', order: 70 },
    { name: 'Crispy Rice', description: 'Tuna Or Salmon', price: 150.00, category: 'Hot Appetizers', order: 71 },
    { name: 'Edamame', description: 'Regular & Spicy', price: 95.00, category: 'Hot Appetizers', order: 72 },
    { name: 'Wagyu Sizzling Rice Pot', description: 'Exotic Mushroom, Truffle Aioli, Mozzarella, Brioche', price: 160.00, category: 'Hot Appetizers', order: 73 },
    { name: 'Chicken Ramen Noodles', description: 'Miso, Minced Chicken, Corn', price: 230.00, category: 'Hot Appetizers', order: 74 },
    { name: 'Beef Ramen Noodles', description: 'Wagyu, Ajitama Egg, Scallion', price: 340.00, category: 'Hot Appetizers', order: 75 },
    { name: 'Shogun Specialty Rice Pot', description: 'Exotic Mushroom Or Wagyu Short Ribs, Truffle Butter, Parmesan Cheese, Scallion', price: 950.00, category: 'Hot Appetizers', order: 76 },
    { name: 'Beef Butter Ponzo', description: 'Braised Ribs, Gochujang, Ponzu', price: 490.00, category: 'Hot Appetizers', order: 77 },
    { name: 'Octopus Hot Appetizer', description: 'Chili garlic, Coriander', price: 290.00, category: 'Hot Appetizers', order: 78 },
    { name: 'Seafood Tempura', description: 'Served With Tentsuyu, Grated Radish And Ginger', price: 295.00, category: 'Tempura', order: 79 },
    { name: 'Ebi Tempura', description: 'Served With Tentsuyu, Grated Radish And Ginger', price: 270.00, category: 'Tempura', order: 80 },
    { name: 'Assorted Vegetables Tempura', description: 'Served With Tentsuyu, Grated Radish And Ginger', price: 155.00, category: 'Tempura', order: 81 },
    { name: 'Chicken Yakitori Robata', description: 'Charcoal Grilled', price: 350.00, category: 'Robata/Kushiyaki', order: 82 },
    { name: 'Tenderloin Robata', description: 'Charcoal Grilled', price: 360.00, category: 'Robata/Kushiyaki', order: 83 },
    { name: 'Wagyu Striploin Robata', description: 'Charcoal Grilled', price: 590.00, category: 'Robata/Kushiyaki', order: 84 },
    { name: 'Salmon Robata', description: 'Charcoal Grilled', price: 390.00, category: 'Robata/Kushiyaki', order: 85 },
    { name: 'Tiger Prawns Robata', description: 'Charcoal Grilled', price: 375.00, category: 'Robata/Kushiyaki', order: 86 },
    { name: 'Asparagus Robata', description: 'Charcoal Grilled', price: 140.00, category: 'Robata/Kushiyaki', order: 87 },
    { name: 'Broccoli Robata', description: 'Charcoal Grilled', price: 110.00, category: 'Robata/Kushiyaki', order: 88 },
    { name: 'Corn Robata', description: 'Charcoal Grilled', price: 90.00, category: 'Robata/Kushiyaki', order: 89 },
    { name: 'Chicken Breast Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 440.00, category: 'Teppanyaki', order: 90 },
    { name: 'Beef Tenderloin Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 470.00, category: 'Teppanyaki', order: 91 },
    { name: 'Squid Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 470.00, category: 'Teppanyaki', order: 92 },
    { name: 'Grouper Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 510.00, category: 'Teppanyaki', order: 93 },
    { name: 'Tiger Prawns Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 550.00, category: 'Teppanyaki', order: 94 },
    { name: 'Salmon Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 590.00, category: 'Teppanyaki', order: 95 },
    { name: 'Black Code Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 650.00, category: 'Teppanyaki', order: 96 },
    { name: 'Lobster Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 890.00, category: 'Teppanyaki', order: 97 },
    { name: 'Wagyu Tenderloin-Australia 200 gm Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 1180.00, category: 'Teppanyaki', order: 98 },
    { name: 'Kobe Beef per gram Teppanyaki', description: 'Served With Steamed Rice, Fried Rice, Or Mixed Vegetables', price: 17.00, category: 'Teppanyaki', order: 99 },
    { name: 'Vietnamese Fresh Spring Rolls (v)', description: 'Vegetarian', price: 110.00, category: 'Asian Appetizers', order: 100 },
    { name: 'Vietnamese Fresh Shrimps Spring Rolls', description: 'Shrimp', price: 135.00, category: 'Asian Appetizers', order: 101 },
    { name: 'Vegetable Spring Roll (v)', description: 'Vegetarian', price: 115.00, category: 'Asian Appetizers', order: 102 },
    { name: 'Shrimps Spring Roll', description: 'Shrimp', price: 150.00, category: 'Asian Appetizers', order: 103 },
    { name: 'Cantonese Spring Roll', description: 'Chicken', price: 150.00, category: 'Asian Appetizers', order: 104 },
    { name: 'Deep Fried Fish Fillet', description: 'Fish', price: 150.00, category: 'Asian Appetizers', order: 105 },
    { name: 'Fried Duck Roll', description: 'Duck', price: 165.00, category: 'Asian Appetizers', order: 106 },
    { name: 'Calamari Szechuan', description: 'Calamari', price: 275.00, category: 'Asian Appetizers', order: 107 },
    { name: 'Jing Du Crispy Beef', description: 'Beef', price: 260.00, category: 'Asian Appetizers', order: 108 },
    { name: 'Fried Shrimp Balls', description: 'Shrimp', price: 180.00, category: 'Asian Appetizers', order: 109 },
    { name: 'Deep Fried Shrimp', description: 'Shrimp', price: 180.00, category: 'Asian Appetizers', order: 110 },
    { name: 'Steamed Shrimp Siomai', description: 'Shrimp dumpling', price: 185.00, category: 'Asian Appetizers', order: 111 },
    { name: 'Shrimp Dumplings', description: 'Shrimp dumpling', price: 185.00, category: 'Asian Appetizers', order: 112 },
    { name: 'Dynamite Shrimp', description: 'Shrimp', price: 165.00, category: 'Asian Appetizers', order: 113 },
    { name: 'Sesame Toast', description: 'Bread with sesame', price: 175.00, category: 'Asian Appetizers', order: 114 },
    { name: 'Fried Calamari', description: 'Calamari', price: 105.00, category: 'Asian Appetizers', order: 115 },
    { name: 'Crispy Duck Salad In Iceberg', description: 'Shredded Duck', price: 275.00, category: 'Asian Appetizers', order: 116 },
    { name: 'Seafood Soup', description: 'Seafood', price: 390.00, category: 'Asian Soups', order: 117 },
    { name: 'Seafood Soup With Satay Sauce', description: 'Seafood', price: 135.00, category: 'Asian Soups', order: 118 },
    { name: 'Hot & Sour Soup', description: 'Seafood', price: 180.00, category: 'Asian Soups', order: 119 },
    { name: 'Vegetable Soup (v)', description: 'Vegetarian', price: 105.00, category: 'Asian Soups', order: 120 },
    { name: 'Corn Soup (v)', description: 'Vegetarian', price: 105.00, category: 'Asian Soups', order: 121 },
    { name: 'Corn Soup Chicken', description: 'Chicken', price: 115.00, category: 'Asian Soups', order: 122 },
    { name: 'Hot & Sour Chicken', description: 'Chicken', price: 120.00, category: 'Asian Soups', order: 123 },
    { name: 'Tom Yum Spicy Thai Soup', description: 'Spicy Thai Soup', price: 180.00, category: 'Asian Soups', order: 124 },
    { name: 'Wonton Spicy', description: 'Wonton', price: 115.00, category: 'Asian Soups', order: 125 },
    { name: 'Steamed Vegetables', description: 'Steamed Vegetables', price: 130.00, category: 'Asian Vegetables', order: 126 },
    { name: 'Thai Style Sauteed Vegetables', description: 'Sauteed Vegetables', price: 170.00, category: 'Asian Vegetables', order: 127 },
    { name: 'Chop Seuy', description: 'Chop Seuy', price: 170.00, category: 'Asian Vegetables', order: 128 },
    { name: 'Vietnamese Style Sauteed Vegetables', description: 'Sauteed Vegetables', price: 170.00, category: 'Asian Vegetables', order: 129 },
    { name: 'Garlic Or Onion Fried Rice', description: 'Fried Rice', price: 90.00, category: 'Asian Rice/Noodles', order: 130 },
    { name: 'Seafood Fried Rice', description: 'Chicken, Shrimp With Caviar', price: 125.00, category: 'Asian Rice/Noodles', order: 131 },
    { name: 'Steamed Rice', description: 'Steamed Rice', price: 80.00, category: 'Asian Rice/Noodles', order: 132 },
    { name: 'Beef Fried Rice', description: 'Fried Rice', price: 100.00, category: 'Asian Rice/Noodles', order: 133 },
    { name: 'Egg Fried Rice', description: 'Fried Rice', price: 95.00, category: 'Asian Rice/Noodles', order: 134 },
    { name: 'Chao Fan Rice', description: 'Fried Rice', price: 180.00, category: 'Asian Rice/Noodles', order: 135 },
    { name: 'Vegetable Fried Rice', description: 'Fried Rice', price: 90.00, category: 'Asian Rice/Noodles', order: 136 },
    { name: 'Noodles Vegetables', description: 'Noodles', price: 180.00, category: 'Asian Rice/Noodles', order: 137 },
    { name: 'Noodles Chicken', description: 'Noodles', price: 200.00, category: 'Asian Rice/Noodles', order: 138 },
    { name: 'Thai Chicken Noodles Spicy', description: 'Noodles', price: 200.00, category: 'Asian Rice/Noodles', order: 139 },
    { name: 'Noodles Beef', description: 'Noodles', price: 230.00, category: 'Asian Rice/Noodles', order: 140 },
    { name: 'Singaporean Noodles Shrimp', description: 'Noodles', price: 250.00, category: 'Asian Rice/Noodles', order: 141 },
    { name: 'Singaporean Noodles Seafood', description: 'Noodles', price: 275.00, category: 'Asian Rice/Noodles', order: 142 },
    { name: 'Noodles Lobster', description: 'Noodles', price: 300.00, category: 'Asian Rice/Noodles', order: 143 },
    { name: 'Chicken Black Muchroom', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 144 },
    { name: 'Vietnamese Style Lemongrass Chicken', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 145 },
    { name: 'Black Beans Chicken', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 146 },
    { name: 'Kung Pao Chicken', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 147 },
    { name: 'Chicken Cashew Nuts', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 148 },
    { name: 'Malay Spicy Chicken', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 149 },
    { name: 'Thai Style Chicken Szechuan', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 150 },
    { name: 'Chicken Curry Sauce', description: 'Chicken entree', price: 225.00, category: 'Asian Chicken', order: 151 },
    { name: 'Vietnamese Dry Beef', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 152 },
    { name: 'Thai Style Spicy Beef With Basil Leaves', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 153 },
    { name: 'Beef Black Pepper', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 154 },
    { name: 'Beef Black Beans', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 155 },
    { name: 'Beef Mongolian Style With Green Pepper', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 156 },
    { name: 'Beef Broccoli', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 157 },
    { name: 'Beef With Ginger And Onion', description: 'Beef entree', price: 260.00, category: 'Asian Beef', order: 158 },
    { name: 'Fish Fillet Steamed', description: 'Fish entree', price: 280.00, category: 'Asian Fish/Seafood', order: 159 },
    { name: 'Vietnamese Style Crispy Shrimp', description: 'Shrimp entree', price: 305.00, category: 'Asian Fish/Seafood', order: 160 },
    { name: 'Shrimp Curry Sauce', description: 'Shrimp entree', price: 305.00, category: 'Asian Fish/Seafood', order: 161 },
    { name: 'Thai Style Coconut Shrimp', description: 'Shrimp entree', price: 305.00, category: 'Asian Fish/Seafood', order: 162 },
    { name: 'Shrimp Sweet And Sour Sauce', description: 'Shrimp entree', price: 305.00, category: 'Asian Fish/Seafood', order: 163 },
    { name: 'Shrimp Ginger Green Onion', description: 'Shrimp entree', price: 305.00, category: 'Asian Fish/Seafood', order: 164 },
    { name: 'Shrimp Szechuan Medium Or Spicy', description: 'Shrimp entree', price: 305.00, category: 'Asian Fish/Seafood', order: 165 },
    { name: 'Seafood Hot Pot With Satay Sauce', description: 'Seafood entree', price: 380.00, category: 'Asian Fish/Seafood', order: 166 },
    { name: 'Lobster Chili Sauce', description: 'Lobster entree', price: 390.00, category: 'Asian Fish/Seafood', order: 167 },
    { name: 'Whole Crab Ginger Onion Or Chili Sauce', description: 'Crab entree', price: 660.00, category: 'Asian Fish/Seafood', order: 168 },
    { name: 'Ice Cream Dessert', description: 'Dessert', price: 100.00, category: 'Asian Dessert', order: 169 },
    { name: 'Alcazar Banana Dessert', description: 'Dessert', price: 130.00, category: 'Asian Dessert', order: 170 },
    { name: 'Cheesecake Dessert', description: 'Dessert', price: 130.00, category: 'Asian Dessert', order: 171 },
    { name: 'Melted Chocolate Tart Dessert', description: 'Dessert', price: 130.00, category: 'Asian Dessert', order: 172 },
    { name: 'Lotus, Red Berries Dessert', description: 'Dessert', price: 130.00, category: 'Asian Dessert', order: 173 },
    { name: 'Pain Perdu Dessert', description: 'Dessert', price: 130.00, category: 'Asian Dessert', order: 174 },
    { name: 'Mango Tarte Dessert', description: 'Dessert', price: 130.00, category: 'Asian Dessert', order: 175 }
];



async function insertShogunMenuData() {
    console.log("--- Starting Shogun Menu Data Insertion ---");

    try {
        // Step 1: Find the SHOGUN restaurant ID
        const { data: shogunRestaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .select('id')
            .eq('name', 'Shogun')
            .single();

        if (restaurantError || !shogunRestaurant) {
            console.error("Error finding Shogun restaurant. Ensure the name is correct ('Shogun Sushi & Grill') and the restaurant exists.");
            return;
        }
        const shogunRestaurantId = shogunRestaurant.id;

        // Step 2: Insert the Menu definition and CAPTURE THE ID
        const { data: newMenu, error: menuError } = await supabase
            .from('menus')
            .insert({
                restaurant_id: shogunRestaurantId,
                name: 'Shogun Full Menu',
                description: 'Complete menu covering Japanese specialties and Asian kitchen items.'
            })
            .select('id')
            .single();

        if (menuError || !newMenu) {
            console.error("Error inserting menu:", menuError);
            return;
        }
        const shogunMenuId = newMenu.id;
        console.log(`Successfully created Menu ID: ${shogunMenuId}`);

        // Step 3: Insert all Menu Items
        const itemsToInsert = shogunMenuItems.map(item => ({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category
        }));

        const { data: insertedItems, error: itemsError } = await supabase
            .from('menu_items')
            .insert(itemsToInsert)
            .select('id, name'); // CAPTURE ALL GENERATED IDs

        if (itemsError || !insertedItems || insertedItems.length !== shogunMenuItems.length) {
            console.error("Error inserting items:", itemsError);
            console.error("Items inserted:", insertedItems ? insertedItems.length : 0);
            return;
        }
        console.log(`Successfully inserted ${insertedItems.length} menu items.`);

        // Step 4: Prepare and Insert Junction Links
        const junctionLinks = insertedItems.map((item, index) => ({
            menu_id: shogunMenuId,
            menu_item_id: item.id,
            display_order: shogunMenuItems[index].order, // Use the order property from our JS array
            is_available: true
        }));

        const { error: junctionError } = await supabase
            .from('menu_to_item')
            .insert(junctionLinks);

        if (junctionError) {
            console.error("Error linking junction table:", junctionError);
            return;
        }

        console.log("--- Shogun Menu Insertion Complete and Linked Successfully! ---");

    } catch (err) {
        console.error("FATAL ERROR during menu insertion:", err);
    }
}

// Automatically execute the function when this file is run
insertShogunMenuData();