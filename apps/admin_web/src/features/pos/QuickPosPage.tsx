import { useState } from 'react';
import { Search, Plus, ScanLine, Info, FolderOpen, Menu, Command, Bell, Moon, Keyboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock Data
const MOCK_CATEGORIES = [
  'All Categories',
  'Baking Needs',
  'Ice Cream',
  'Baby Care',
  'Spices',
  'Oil',
  'Cooking Ingredients'
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Nido Fortigo 350g', qty: 3, price: 430, initials: null, image: null },
  { id: 2, name: 'Nido 3+ 350g BiB', qty: 1, price: 520, initials: null, image: null },
  { id: 3, name: 'Rangdhanu Mixed Herbs - 30g (Exp01.23)', qty: 1, price: 80, initials: null, image: null },
  { id: 4, name: 'Maxline ML-073 Multi Color Multiplug 3 Port wi...', qty: 1, price: 290, initials: null, image: null },
  { id: 5, name: 'Kodomo Bubble Fruit Toothpaste Gel Ultra...', qty: 1, price: 165, initials: 'KB', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
  { id: 6, name: 'Ispahani Blenders Choice Premium Black Tea - 200g', qty: 1, price: 160, initials: null, image: '☕', bgColor: 'bg-red-50' },
  { id: 7, name: 'ABC Cup Hot Gulai Chicken Flavour - 60g', qty: 1, price: 190, initials: 'AC', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
  { id: 8, name: 'Samyang Extreme Hot Chicken Ramen Noodles...', qty: 2, price: 190, initials: 'SE', bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
];

export function QuickPosPage() {
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
            title="Back to Dashboard"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 max-w-xl px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search or create anything..."
              className="w-full pl-10 pr-12 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400 font-medium">
              <Command size={14} /> K
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-500">
          <button className="hover:bg-gray-50 p-2 rounded-lg text-lg">🇺🇸</button>
          <button className="hover:bg-gray-50 p-2 rounded-lg"><Keyboard size={20} /></button>
          <button className="hover:bg-gray-50 p-2 rounded-lg"><Bell size={20} /></button>
          <button className="hover:bg-gray-50 p-2 rounded-lg"><Moon size={20} /></button>
          <div className="flex items-center gap-3 pl-3 ml-1 border-l border-gray-100">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium text-sm">
              M
            </div>
            <span className="text-sm font-medium text-gray-700">Mohammed</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100 overflow-hidden">
          {/* Action Bar */}
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900">Quick POS</h1>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-shadow"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                <Plus size={16} />
                Add New Item
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors shadow-sm">
                <ScanLine size={16} />
                Scan Code
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="px-6 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {MOCK_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeCategory === category
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {category}
              </button>
            ))}
            <button className="px-3 py-2 text-gray-400 hover:text-gray-600">
              {'>'}
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {MOCK_PRODUCTS.map(product => (
                <div key={product.id} className="bg-white border border-gray-200/80 rounded-xl p-4 flex flex-col gap-3 hover:border-emerald-200 hover:shadow-md transition-all relative group">
                  <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <Info size={16} />
                  </button>

                  {/* Image/Initials Placeholder */}
                  {product.initials || product.image ? (
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${product.bgColor || 'bg-gray-50'} ${product.textColor || 'text-gray-400'}`}>
                       {product.initials ? product.initials : product.image}
                     </div>
                  ) : (
                    <div className="w-12 h-12"></div>
                  )}

                  <div className="flex-1 mt-1">
                    <h3 className="font-semibold text-gray-800 text-[15px] leading-snug line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-[13px] mt-2">Qty: {product.qty}</p>
                    <p className="text-gray-600 font-medium text-[13px] mt-1">Tk. {product.price}</p>
                  </div>

                  <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg transition-colors mt-2">
                    Click to Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-[380px] flex-shrink-0 bg-gray-50/50 flex flex-col items-center justify-center p-8 border-l border-gray-100">
          <div className="text-center flex flex-col items-center">
            <div className="w-32 h-32 mb-6 opacity-40">
              <FolderOpen size={120} strokeWidth={1} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Billing Items</h2>
            <p className="text-gray-500 text-sm">Select items to record a sale</p>
          </div>
        </div>
      </div>
    </div>
  );
}
