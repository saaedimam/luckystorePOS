import { useState } from 'react';
import { Plus, Download, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Types for the new design
interface Competitor {
  id: string;
  name: string;
  color: string;
}

interface CompetitorPriceData {
  competitorId: string;
  price: number;
  trend: 'up' | 'down' | 'same';
}

interface ProductComparison {
  id: string;
  name: string;
  category: string;
  emoji: string;
  ourPrice: number;
  competitorPrices: CompetitorPriceData[];
  margin: number;
  lastChecked: string;
}

// Mock data matching the design
const COMPETITORS: Competitor[] = [
  { id: 'unimart', name: 'Unimart', color: '#c96442' },
  { id: 'shwapno', name: 'Shwapno', color: '#4a7c59' },
  { id: 'meena', name: 'Meena Bazar', color: '#c9a227' },
  { id: 'agora', name: 'Agora', color: '#4d4c48' },
];

const CATEGORIES = ['All Categories', 'Dairy', 'Grocery', 'Beverages', 'Snacks', 'Household', 'Personal Care'];

const MOCK_PRODUCTS: ProductComparison[] = [
  {
    id: '1',
    name: 'Fresh Milk 1L',
    category: 'Dairy',
    emoji: '🥛',
    ourPrice: 78,
    competitorPrices: [
      { competitorId: 'unimart', price: 82, trend: 'up' },
      { competitorId: 'shwapno', price: 75, trend: 'down' },
      { competitorId: 'meena', price: 80, trend: 'up' },
      { competitorId: 'agora', price: 85, trend: 'up' },
    ],
    margin: 18.4,
    lastChecked: '2 hrs ago',
  },
  {
    id: '2',
    name: 'Basmati Rice 5kg',
    category: 'Grocery',
    emoji: '🍚',
    ourPrice: 340,
    competitorPrices: [
      { competitorId: 'unimart', price: 340, trend: 'same' },
      { competitorId: 'shwapno', price: 325, trend: 'down' },
      { competitorId: 'meena', price: 350, trend: 'up' },
      { competitorId: 'agora', price: 360, trend: 'up' },
    ],
    margin: 14.7,
    lastChecked: '5 hrs ago',
  },
  {
    id: '3',
    name: 'Brown Eggs 12pc',
    category: 'Dairy',
    emoji: '🥚',
    ourPrice: 120,
    competitorPrices: [
      { competitorId: 'unimart', price: 115, trend: 'down' },
      { competitorId: 'shwapno', price: 118, trend: 'down' },
      { competitorId: 'meena', price: 125, trend: 'up' },
      { competitorId: 'agora', price: 128, trend: 'up' },
    ],
    margin: 8.3,
    lastChecked: '1 day ago',
  },
  {
    id: '4',
    name: 'Coconut Oil 500ml',
    category: 'Grocery',
    emoji: '🧴',
    ourPrice: 180,
    competitorPrices: [
      { competitorId: 'unimart', price: 185, trend: 'up' },
      { competitorId: 'shwapno', price: 190, trend: 'up' },
      { competitorId: 'meena', price: 175, trend: 'down' },
      { competitorId: 'agora', price: 195, trend: 'up' },
    ],
    margin: 5.2,
    lastChecked: '3 hrs ago',
  },
  {
    id: '5',
    name: 'White Bread',
    category: 'Bakery',
    emoji: '🍞',
    ourPrice: 45,
    competitorPrices: [
      { competitorId: 'unimart', price: 45, trend: 'same' },
      { competitorId: 'shwapno', price: 45, trend: 'same' },
      { competitorId: 'meena', price: 48, trend: 'up' },
      { competitorId: 'agora', price: 50, trend: 'up' },
    ],
    margin: 11.1,
    lastChecked: '6 hrs ago',
  },
  {
    id: '6',
    name: 'Mango Juice 1L',
    category: 'Beverages',
    emoji: '🧃',
    ourPrice: 85,
    competitorPrices: [
      { competitorId: 'unimart', price: 82, trend: 'down' },
      { competitorId: 'shwapno', price: 88, trend: 'up' },
      { competitorId: 'meena', price: 90, trend: 'up' },
      { competitorId: 'agora', price: 92, trend: 'up' },
    ],
    margin: 7.6,
    lastChecked: '12 hrs ago',
  },
];

export function CompetitorPricesPage() {
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesCategory = activeCategory === 'All Categories' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} />;
      case 'down':
        return <TrendingDown size={14} />;
      default:
        return <Minus size={14} />;
    }
  };

  const getTrendClass = (trend: 'up' | 'down' | 'same', ourPrice: number, theirPrice: number) => {
    if (trend === 'same') return 'price-same';
    return theirPrice > ourPrice ? 'price-up' : 'price-down';
  };

  return (
    <div className="competitors-page">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Competitor Prices</h1>
          <p className="section-subtitle">Track and compare pricing across local competitors</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost">
            <Download size={16} />
            Import
          </button>
          <button className="btn btn-secondary">Add Competitor</button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Price Check
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-chips">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`filter-chip ${activeCategory === category ? 'filter-chip--active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="search-wrapper">
          <Search size={16} className="search-icon-inline" />
          <input
            type="text"
            placeholder="Search product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input-sm"
          />
        </div>
      </div>

      {/* Price Comparison Table */}
      <div className="card">
        <div className="card-body card-body--padding-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Our Price</th>
                {COMPETITORS.map((comp) => (
                  <th key={comp.id}>
                    <div className="competitor-badge">
                      <span
                        className="competitor-dot"
                        style={{ backgroundColor: comp.color }}
                      />
                      {comp.name}
                    </div>
                  </th>
                ))}
                <th className="text-right">Margin</th>
                <th>Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <div className="product-thumb">{product.emoji}</div>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-category">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">
                    <span className="our-price">৳{product.ourPrice}</span>
                  </td>
                  {product.competitorPrices.map((compPrice) => {
                    return (
                      <td key={compPrice.competitorId}>
                        <div
                          className={`competitor-price ${getTrendClass(
                            compPrice.trend,
                            product.ourPrice,
                            compPrice.price
                          )}`}
                        >
                          <span className="price-value">৳{compPrice.price}</span>
                          <span className="trend-icon">
                            {getTrendIcon(compPrice.trend)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-right">
                    <span
                      className={`margin-badge ${
                        product.margin >= 10 ? 'margin-good' : product.margin >= 5 ? 'margin-warning' : 'margin-danger'
                      }`}
                    >
                      {product.margin}%
                    </span>
                  </td>
                  <td className="text-muted text-sm">{product.lastChecked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CompetitorPricesPage;
