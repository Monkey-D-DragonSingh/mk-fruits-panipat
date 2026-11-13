export interface Fruit {
  id: string;
  hindi: string;
  english: string;
  origin: string;
  country: string;
  desc: string;
  price: number;
}

export const FRUITS: Fruit[] = [
  { id: "kiwi", hindi: "कीवी", english: "Kiwi", origin: "New Zealand", country: "New Zealand", desc: "Naturally sweet green kiwi, handpicked at peak season and chilled within hours of harvest.", price: 450 },
  { id: "grapes", hindi: "अंगूर", english: "Grapes", origin: "Australia", country: "Australia", desc: "Seedless Thompson and Cabernet grapes delivered cold from Australian vineyards.", price: 380 },
  { id: "apple", hindi: "सेब", english: "Apple", origin: "USA", country: "USA", desc: "Crisp, orchard-fresh apples for everyday boxes and premium gift platters.", price: 320 },
  { id: "guava", hindi: "गावा", english: "Guava", origin: "Bangkok", country: "Thailand", desc: "Plump white guavas, sweet and tangy — street-side favourite turned premium box fruit.", price: 140 },
  { id: "babugosha", hindi: "बबूगोसा", english: "Pear / Babugosha", origin: "South Africa", country: "South Africa", desc: "Juicy pears with the desi twist — soft, sweet and perfect for gifting boxes.", price: 180 },
  { id: "dragonfruit", hindi: "ड्रैगन", english: "Dragon Fruit", origin: "Bangkok", country: "Thailand", desc: "Exotic dragon fruit with vivid pink flesh, ideal for celebrations and photo moments.", price: 260 },
  { id: "dates", hindi: "खजूर", english: "Dates", origin: "Saudi Arabia", country: "Saudi Arabia", desc: "Ajwa and Medjool dates — nature's caramel energy, perfect for wedding fruit stalls and gifting.", price: 220 },
  { id: "miniorange", hindi: "मिनी ऑरेंज", english: "Mini Orange", origin: "Australia", country: "Australia", desc: "Baby oranges in bite-size nets — fun, portable and packed with vitamin C.", price: 150 },
  { id: "mango", hindi: "आम", english: "Mango", origin: "Indian", country: "India", desc: "Alphonso and seasonal mango selection, cut fresh for peak summer sweetness.", price: 900 },
  { id: "watermelon", hindi: "तरबूज", english: "Watermelon", origin: "China", country: "China", desc: "Juicy watermelons for summer birthdays, picnics and poolside celebrations.", price: 200 },
  { id: "papaya", hindi: "पपीता", english: "Papaya", origin: "Bangalore", country: "India", desc: "Sun-ripened papaya, naturally sweet and digestive-friendly for all ages.", price: 120 },
  { id: "pineapple", hindi: "पाइन एप्पल", english: "Pineapple", origin: "Bhutan", country: "Bhutan", desc: "Sweet-tart pineapples from highland Bhutan, ready to slice for platters.", price: 160 },
  { id: "passionfruit", hindi: "पैशन फ्रूट", english: "Passion Fruit", origin: "Malaysia", country: "Malaysia", desc: "Bright passion fruit pulp for tangy, exotic fruit bowls and desserts.", price: 240 },
  { id: "lychee", hindi: "लॉन्ग लीची", english: "Long Lychee", origin: "Thailand", country: "Thailand", desc: "Himalayan and Thai lychees, fragrant and honey-sweet for festive boxes.", price: 350 },
  { id: "sarda", hindi: "सारदा", english: "Sarda Melon", origin: "Iran", country: "Iran", desc: "Netted sarda melon with deep orange flesh and honeyed flavour.", price: 280 },
  { id: "rambutan", hindi: "रामभूतान", english: "Rambutan", origin: "Thailand", country: "Thailand", desc: "Hairy rambutan bursting with sweet white flesh — a crowd favourite.", price: 330 },
  { id: "plum", hindi: "पलम", english: "Plum", origin: "Iran", country: "Iran", desc: "Juicy European plums, sweet and tart — great for gifting and lunch boxes.", price: 130 },
  { id: "strawberry", hindi: "स्ट्रॉबेरी", english: "Strawberry", origin: "Europe", country: "Europe", desc: "Creamy, hand-picked strawberries for berry bliss boxes and desserts.", price: 420 },
  { id: "blueberry", hindi: "बलुबेरी", english: "Blueberry", origin: "USA", country: "USA", desc: "Antioxidant-rich blueberries, cold-shipped from Pacific Northwest farms.", price: 460 },
  { id: "anar", hindi: "आनर", english: "Pomegranate / Anar", origin: "Iran", country: "Iran", desc: "Ruby-red arils packed for winter celebrations and daily fruit boxes.", price: 410 },
  { id: "chikoo", hindi: "चीकू", english: "Chikoo / Sapota", origin: "West Indies", country: "India", desc: "Tropical chikoo, sweet and custardy — childhood favourite, now for all ages.", price: 110 },
  { id: "persimmon", hindi: "परसिमोन", english: "Persimmon", origin: "Japan", country: "Japan", desc: "Hachiya persimmons, honey-sweet and rich in vitamins.", price: 340 },
];
