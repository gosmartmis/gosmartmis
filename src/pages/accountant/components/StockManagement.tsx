import { useState } from 'react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  lastUpdated: string;
  minStock: number;
}

export default function StockManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [stockItems] = useState<StockItem[]>([
    { id: '1', name: 'Exercise Books (48 pages)', category: 'Stationery', quantity: 450, unitPrice: 500, totalValue: 225000, lastUpdated: '2025-01-15', minStock: 100 },
    { id: '2', name: 'Pens (Blue)', category: 'Stationery', quantity: 85, unitPrice: 200, totalValue: 17000, lastUpdated: '2025-01-14', minStock: 100 },
    { id: '3', name: 'Chalk Boxes', category: 'Teaching Materials', quantity: 45, unitPrice: 1500, totalValue: 67500, lastUpdated: '2025-01-13', minStock: 50 },
    { id: '4', name: 'Textbooks - Mathematics S1', category: 'Books', quantity: 120, unitPrice: 8000, totalValue: 960000, lastUpdated: '2025-01-12', minStock: 50 },
    { id: '5', name: 'Cleaning Supplies', category: 'Maintenance', quantity: 30, unitPrice: 5000, totalValue: 150000, lastUpdated: '2025-01-11', minStock: 20 },
    { id: '6', name: 'Printer Paper (Ream)', category: 'Office Supplies', quantity: 25, unitPrice: 7000, totalValue: 175000, lastUpdated: '2025-01-10', minStock: 30 },
    { id: '7', name: 'Markers (Whiteboard)', category: 'Teaching Materials', quantity: 15, unitPrice: 800, totalValue: 12000, lastUpdated: '2025-01-09', minStock: 30 },
    { id: '8', name: 'Sports Equipment - Footballs', category: 'Sports', quantity: 8, unitPrice: 15000, totalValue: 120000, lastUpdated: '2025-01-08', minStock: 10 },
  ]);

  const [movements] = useState([
    { id: '1', itemName: 'Exercise Books (48 pages)', type: 'In', quantity: 200, date: '2025-01-15', reference: 'PO-2025-001', notes: 'New stock purchase' },
    { id: '2', itemName: 'Pens (Blue)', type: 'Out', quantity: 50, date: '2025-01-14', reference: 'REQ-2025-045', notes: 'Distributed to S1A' },
    { id: '3', itemName: 'Chalk Boxes', type: 'Out', quantity: 10, date: '2025-01-13', reference: 'REQ-2025-044', notes: 'Teacher request' },
    { id: '4', itemName: 'Textbooks - Mathematics S1', type: 'In', quantity: 50, date: '2025-01-12', reference: 'PO-2025-002', notes: 'Additional textbooks' },
  ]);

  const categories = ['all', 'Stationery', 'Teaching Materials', 'Books', 'Office Supplies', 'Maintenance', 'Sports'];

  const filteredItems = stockItems.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockItems = stockItems.filter(item => item.quantity <= item.minStock);
  const totalStockValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);

  const handleEdit = (item: StockItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      console.log('Delete item:', id);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Stock Management</h1>
        <p className="text-slate-600 text-sm">Manage school inventory and track stock movements</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Total Items</span>
            <i className="ri-archive-line text-xl text-blue-600"></i>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stockItems.length}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Total Stock Value</span>
            <i className="ri-money-dollar-circle-line text-xl text-emerald-600"></i>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalStockValue.toLocaleString()} RWF</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Low Stock Alerts</span>
            <i className="ri-alert-line text-xl text-amber-600"></i>
          </div>
          <p className="text-2xl font-bold text-slate-800">{lowStockItems.length}</p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-600 text-sm">Categories</span>
            <i className="ri-folder-line text-xl text-purple-600"></i>
          </div>
          <p className="text-2xl font-bold text-slate-800">{categories.length - 1}</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <i className="ri-alert-line text-xl text-amber-600 mt-0.5"></i>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Low Stock Alert</h3>
              <p className="text-sm text-amber-800 mb-2">The following items are running low:</p>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map(item => (
                  <span key={item.id} className="bg-white px-3 py-1 rounded-full text-sm text-amber-900 border border-amber-200">
                    {item.name} ({item.quantity} left)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>

          <button
            onClick={() => setShowMovementModal(true)}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-history-line mr-2"></i>
            View Movements
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line mr-2"></i>
            Add Item
          </button>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Item Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Category</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Quantity</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Unit Price</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Total Value</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 text-center font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 text-right">{item.unitPrice.toLocaleString()} RWF</td>
                  <td className="px-4 py-3 text-sm text-slate-800 text-right font-medium">{item.totalValue.toLocaleString()} RWF</td>
                  <td className="px-4 py-3 text-center">
                    {item.quantity <= item.minStock ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-base"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-base"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Add New Stock Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="Enter item name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select category</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (RWF)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  maxLength={500}
                ></textarea>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Edit Stock Item</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  defaultValue={selectedItem.name}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  defaultValue={selectedItem.category}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    defaultValue={selectedItem.quantity}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (RWF)</label>
                  <input
                    type="number"
                    defaultValue={selectedItem.unitPrice}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  defaultValue={selectedItem.minStock}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement History Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Stock Movement History</h3>
              <button
                onClick={() => setShowMovementModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {movements.map(movement => (
                  <div key={movement.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800 mb-1">{movement.itemName}</h4>
                        <p className="text-sm text-slate-600">{movement.notes}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                        movement.type === 'In' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {movement.type === 'In' ? '+ ' : '- '}{movement.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span><i className="ri-calendar-line mr-1"></i>{movement.date}</span>
                      <span><i className="ri-file-list-line mr-1"></i>{movement.reference}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => setShowMovementModal(false)}
                className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}