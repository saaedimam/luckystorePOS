export type Product = {
  id: string;
  sku: string;
  name: string;
  nameBn: string;
  category: "Grocery" | "Beverage" | "Snack" | "Dairy" | "Bakery" | "Personal";
  price: number;
  stock: number;
  thumb: string;
};

const palette = ["#D4A843", "#10B981", "#3B82F6", "#F43F5E", "#F59E0B", "#8B95A5"];

export const PRODUCTS: Product[] = [
  { id: "p1",  sku: "RICE-5KG",   name: "Miniket Rice 5kg",        nameBn: "মিনিকেট চাল ৫কেজি",     category: "Grocery",  price: 580.00, stock: 42, thumb: palette[0] },
  { id: "p2",  sku: "OIL-1L",     name: "Soybean Oil 1L",          nameBn: "সয়াবিন তেল ১লি",         category: "Grocery",  price: 165.50, stock: 18, thumb: palette[1] },
  { id: "p3",  sku: "TEA-400G",   name: "Ispahani Mirzapore",      nameBn: "ইস্পাহানী মির্জাপুর",     category: "Beverage", price: 245.00, stock: 7,  thumb: palette[2] },
  { id: "p4",  sku: "BIS-CHK",    name: "Chocolate Biscuit",       nameBn: "চকলেট বিস্কুট",         category: "Snack",    price: 35.00,  stock: 96, thumb: palette[3] },
  { id: "p5",  sku: "MLK-1L",     name: "Pran Milk 1L",            nameBn: "প্রাণ দুধ ১ লিটার",       category: "Dairy",    price: 110.00, stock: 24, thumb: palette[4] },
  { id: "p6",  sku: "BRD-LG",     name: "Cocola Bread Large",      nameBn: "কোকোলা পাউরুটি বড়",     category: "Bakery",   price: 65.00,  stock: 12, thumb: palette[5] },
  { id: "p7",  sku: "SOAP-LX",    name: "Lux Soap 100g",           nameBn: "লাক্স সাবান ১০০গ্রা",     category: "Personal", price: 55.00,  stock: 3,  thumb: palette[0] },
  { id: "p8",  sku: "WTR-2L",     name: "Mum Drinking Water 2L",   nameBn: "মাম পানি ২ লিটার",       category: "Beverage", price: 40.00,  stock: 60, thumb: palette[2] },
  { id: "p9",  sku: "EGG-12",     name: "Farm Eggs · 12pc",        nameBn: "ফার্ম ডিম ১২টি",         category: "Dairy",    price: 145.00, stock: 0,  thumb: palette[4] },
  { id: "p10", sku: "CHIPS-PRG",  name: "Pringles Original",       nameBn: "প্রিঙ্গলস অরিজিনাল",      category: "Snack",    price: 320.00, stock: 9,  thumb: palette[3] },
  { id: "p11", sku: "SUGAR-1K",   name: "Sugar 1kg",               nameBn: "চিনি ১ কেজি",            category: "Grocery",  price: 125.00, stock: 31, thumb: palette[0] },
  { id: "p12", sku: "COKE-500",   name: "Coca-Cola 500ml",         nameBn: "কোকা-কোলা ৫০০মিলি",      category: "Beverage", price: 55.00,  stock: 78, thumb: palette[2] },
];

export const CATEGORIES = ["All", "Grocery", "Beverage", "Snack", "Dairy", "Bakery", "Personal"] as const;
