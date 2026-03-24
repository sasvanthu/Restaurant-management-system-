import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, MapPin, Star, Clock, ChevronLeft, Plus, Minus, CheckCircle, Navigation, LogOut, Users, Store, TrendingUp, Settings, Activity, Phone, Car, Heart, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { restaurants, menuItems, mockUsers, mockPastOrders, mockActiveOrders } from './data/mockData';
import { Restaurant, MenuItem, CartItem, Order, User } from './types';

type View = 'login' | 'home' | 'restaurant' | 'checkout' | 'tracking' | 'admin_dashboard' | 'restaurant_dashboard' | 'delivery_dashboard' | 'order_history' | 'favorites';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [ratingModalOrder, setRatingModalOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [maxDeliveryFee, setMaxDeliveryFee] = useState(10);
  const [deliveryCountdown, setDeliveryCountdown] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('CARD');
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>(menuItems.map(item => ({ ...item, available: item.available !== false })));
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (order?.status === 'OUT_FOR_DELIVERY') {
      setDeliveryCountdown(15);
      interval = setInterval(() => {
        setDeliveryCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [order?.status]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'SYSTEM_ADMIN') setCurrentView('admin_dashboard');
    else if (user.role === 'RESTAURANT_ADMIN') setCurrentView('restaurant_dashboard');
    else if (user.role === 'DELIVERY_STAFF') setCurrentView('delivery_dashboard');
    else setCurrentView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setCart([]);
    setOrder(null);
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    if (cart.length > 0 && cart[0].restaurantId !== restaurant.id) {
      if (window.confirm('Starting a new order will clear your current cart. Continue?')) {
        setCart([]);
      } else {
        return;
      }
    }
    setSelectedRestaurant(restaurant);
    setCurrentView('restaurant');
    window.scrollTo(0, 0);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = () => {
    if (!selectedRestaurant || cart.length === 0) return;
    
    const tax = cartTotal * 0.08;
    const deliveryFee = selectedRestaurant.deliveryFee;
    const finalTotal = Math.max(0, cartTotal + tax + deliveryFee - discount);
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      restaurant: selectedRestaurant,
      items: [...cart],
      subtotal: cartTotal,
      tax,
      deliveryFee,
      discount,
      total: finalTotal,
      status: 'PLACED',
      placedAt: new Date(),
      paymentMethod,
    };
    
    setOrder(newOrder);
    setCart([]);
    setDiscount(0);
    setPromoCode('');
    setIsCartOpen(false);
    setCurrentView('tracking');
    window.scrollTo(0, 0);
    
    setTimeout(() => setOrder(prev => prev ? { ...prev, status: 'CONFIRMED' } : null), 3000);
    setTimeout(() => setOrder(prev => prev ? { ...prev, status: 'PREPARING' } : null), 8000);
    setTimeout(() => setOrder(prev => prev ? { ...prev, status: 'OUT_FOR_DELIVERY' } : null), 15000);
    setTimeout(() => setOrder(prev => prev ? { ...prev, status: 'DELIVERED' } : null), 30000);
  };

  const uniqueCategories = ['All', ...Array.from(new Set(restaurants.flatMap(r => r.cuisine)))];

  const filteredRestaurants = restaurants.filter(r => 
    (r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))) &&
    r.rating >= minRating &&
    r.deliveryFee <= maxDeliveryFee &&
    (activeCategory === 'All' || r.cuisine.includes(activeCategory))
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      {currentView !== 'login' && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentView !== 'home' && currentView !== 'admin_dashboard' && currentView !== 'restaurant_dashboard' && currentView !== 'delivery_dashboard' && (
                <button 
                  onClick={() => setCurrentView(currentUser?.role === 'SYSTEM_ADMIN' ? 'admin_dashboard' : currentUser?.role === 'RESTAURANT_ADMIN' ? 'restaurant_dashboard' : currentUser?.role === 'DELIVERY_STAFF' ? 'delivery_dashboard' : 'home')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h1 
                className="text-2xl font-bold tracking-tight text-emerald-600 cursor-pointer"
                onClick={() => setCurrentView(currentUser?.role === 'SYSTEM_ADMIN' ? 'admin_dashboard' : currentUser?.role === 'RESTAURANT_ADMIN' ? 'restaurant_dashboard' : currentUser?.role === 'DELIVERY_STAFF' ? 'delivery_dashboard' : 'home')}
              >
                FoodFlow
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 mr-4 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {currentUser?.name} ({currentUser?.role.replace('_', ' ')})
              </div>
              
              {currentUser?.role === 'CUSTOMER' && (
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setCurrentView('favorites')}
                    title="Favorites"
                  >
                    <Heart className="w-5 h-5 text-gray-700" />
                  </button>
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setCurrentView('order_history')}
                    title="Order History"
                  >
                    <Clock className="w-5 h-5 text-gray-700" />
                  </button>
                  <button 
                    className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => setIsCartOpen(true)}
                  >
                    <ShoppingBag className="w-6 h-6 text-gray-700" />
                    {cartItemCount > 0 && (
                      <span className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
              
              <button 
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={currentView !== 'login' ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
        <AnimatePresence mode="wait">
          {currentView === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
            >
              <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold tracking-tight text-emerald-600 mb-2">FoodFlow</h1>
                  <p className="text-gray-500">Select a role to continue</p>
                </div>
                
                <div className="space-y-4">
                  {mockUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleLogin(user)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                      <div className="text-left">
                        <div className="font-bold text-gray-900 group-hover:text-emerald-700">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.role.replace('_', ' ')}</div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'admin_dashboard' && (
            <motion.div
              key="admin_dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">System Admin Dashboard</h2>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Platform Settings
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Revenue', value: '$124,500', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                  { label: 'Active Users', value: '8,432', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'Restaurants', value: '142', icon: Store, color: 'text-purple-600', bg: 'bg-purple-100' },
                  { label: 'Orders Today', value: '1,204', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Management */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold">User Management</h3>
                  <button className="text-emerald-600 font-medium hover:underline text-sm">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4 text-gray-600">{u.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              u.role === 'SYSTEM_ADMIN' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'RESTAURANT_ADMIN' ? 'bg-orange-100 text-orange-700' :
                              u.role === 'DELIVERY_STAFF' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
                          </td>
                          <td className="p-4">
                            <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Restaurant Management */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Restaurant Management</h3>
                  <button className="text-emerald-600 font-medium hover:underline text-sm">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="p-4 font-medium">Restaurant</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Rating</th>
                        <th className="p-4 font-medium">Total Orders</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {restaurants.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="p-4 flex items-center gap-3">
                            <img src={r.image} alt={r.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                            <span className="font-medium">{r.name}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Active</span>
                          </td>
                          <td className="p-4 flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {r.rating}
                          </td>
                          <td className="p-4 text-gray-600">1,240</td>
                          <td className="p-4">
                            <button className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Staff Management */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Delivery Staff Management</h3>
                  <button className="text-emerald-600 font-medium hover:underline text-sm">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Active Deliveries</th>
                        <th className="p-4 font-medium">Total Completed</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockUsers.filter(u => u.role === 'DELIVERY_STAFF').map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Online</span>
                          </td>
                          <td className="p-4 text-gray-600">1</td>
                          <td className="p-4 text-gray-600">142</td>
                          <td className="p-4">
                            <button className="text-blue-600 hover:underline text-sm font-medium">View Route</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'restaurant_dashboard' && currentUser?.restaurantId && (
            <motion.div
              key="restaurant_dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Restaurant Dashboard</h2>
                  <p className="text-gray-500 mt-1">Manage your orders and menu</p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Menu Item
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Today's Revenue", value: '$1,240.50', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                  { label: 'Active Orders', value: '12', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'Completed Today', value: '45', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Menu Management */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Menu Items</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                  {localMenuItems.filter(m => m.restaurantId === currentUser.restaurantId).map(item => (
                    <div key={item.id} className={`flex gap-4 p-4 border rounded-xl transition-colors ${item.available ? 'border-gray-100 hover:border-gray-200' : 'border-red-100 bg-red-50 opacity-75'}`}>
                      <img src={item.image} alt={item.name} className={`w-20 h-20 rounded-lg object-cover ${!item.available && 'grayscale'}`} referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold">{item.name}</h4>
                          <span className="font-bold text-emerald-600">${item.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">{item.description}</p>
                        <div className="flex gap-2 items-center">
                          <button 
                            onClick={() => {
                              setLocalMenuItems(prev => prev.map(m => m.id === item.id ? { ...m, available: !m.available } : m));
                            }}
                            className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${item.available ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                          >
                            {item.available ? 'Mark Unavailable' : 'Mark Available'}
                          </button>
                          <button className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100">Edit</button>
                          <button className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Incoming Orders</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-sm">
                        <th className="p-4 font-medium">Order ID</th>
                        <th className="p-4 font-medium">Items</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockActiveOrders.filter(o => o.restaurant.id === currentUser.restaurantId).map(activeOrder => (
                        <tr key={activeOrder.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium">#{activeOrder.id.toUpperCase()}</td>
                          <td className="p-4 text-gray-600 text-sm">
                            {activeOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </td>
                          <td className="p-4 font-bold">${activeOrder.total.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              activeOrder.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {activeOrder.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            {activeOrder.status === 'PLACED' && (
                              <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                                Accept
                              </button>
                            )}
                            {activeOrder.status === 'PREPARING' && (
                              <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                                Ready for Pickup
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'delivery_dashboard' && currentUser?.role === 'DELIVERY_STAFF' && (
            <motion.div
              key="delivery_dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">Delivery Dashboard</h2>
                  <p className="text-gray-500 mt-1">Manage your active deliveries</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Today's Earnings", value: '$145.50', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                  { label: 'Active Deliveries', value: '1', icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'Completed Today', value: '12', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold">Assigned Deliveries</h3>
                </div>
                <div className="p-6 space-y-6">
                  {mockActiveOrders.filter(o => o.status === 'OUT_FOR_DELIVERY' || o.status === 'PREPARING').map(activeOrder => (
                    <div key={activeOrder.id} className="border border-gray-100 rounded-2xl p-6 hover:border-emerald-500 transition-colors">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                              {activeOrder.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-gray-500 text-sm font-medium">Order #{activeOrder.id.toUpperCase()}</span>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-1">
                                <Store className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 font-medium">Pickup from</p>
                                <p className="font-bold text-gray-900">{activeOrder.restaurant.name}</p>
                                <p className="text-sm text-gray-600">{activeOrder.restaurant.address}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-1">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 font-medium">Deliver to</p>
                                <p className="font-bold text-gray-900">Customer</p>
                                <p className="text-sm text-gray-600">123 Home Street, Apt 4B</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-between gap-4 md:border-l border-gray-100 md:pl-6 min-w-[200px]">
                          <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Payment</p>
                            <p className="font-bold text-gray-900">{activeOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}</p>
                            {activeOrder.paymentMethod === 'COD' && (
                              <p className="text-emerald-600 font-bold text-lg mt-1">Collect ${(activeOrder.total).toFixed(2)}</p>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {activeOrder.status === 'PREPARING' && (
                              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors">
                                Mark as Picked Up
                              </button>
                            )}
                            {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors">
                                Mark as Delivered
                              </button>
                            )}
                            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                              <Navigation className="w-4 h-4" /> Navigate
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Search Hero */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-3xl font-bold mb-4">What are you craving?</h2>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search restaurants or cuisines..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <select 
                      value={minRating}
                      onChange={(e) => setMinRating(Number(e.target.value))}
                      className="px-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={4.0}>4.0+ Stars</option>
                      <option value={4.5}>4.5+ Stars</option>
                      <option value={4.8}>4.8+ Stars</option>
                    </select>
                    <select 
                      value={maxDeliveryFee}
                      onChange={(e) => setMaxDeliveryFee(Number(e.target.value))}
                      className="px-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-gray-700"
                    >
                      <option value={10}>Any Fee</option>
                      <option value={3}>Under $3</option>
                      <option value={2}>Under $2</option>
                      <option value={0}>Free Delivery</option>
                    </select>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {uniqueCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Offers Banner */}
              {activeCategory === 'All' && searchQuery === '' && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold tracking-wider uppercase mb-3 inline-block">Limited Time</span>
                      <h3 className="text-3xl font-bold mb-2">Get 20% off your first order!</h3>
                      <p className="text-emerald-50 text-lg mb-4">Use code SAVE20 at checkout. Valid for all restaurants.</p>
                      <div className="flex items-center gap-3">
                        <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 font-mono text-xl font-bold tracking-widest">
                          SAVE20
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <Tag className="w-32 h-32 text-white/20 transform rotate-12" />
                    </div>
                  </div>
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
                </div>
              )}

              {/* Trending Section */}
              {activeCategory === 'All' && searchQuery === '' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                      Trending Now
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {restaurants.filter(r => r.rating >= 4.7).slice(0, 2).map(restaurant => (
                      <div 
                        key={`trending-${restaurant.id}`}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group flex h-40"
                        onClick={() => {
                          setSelectedRestaurant(restaurant);
                          setCurrentView('restaurant');
                        }}
                      >
                        <div className="w-2/5 relative overflow-hidden">
                          <img 
                            src={restaurant.image} 
                            alt={restaurant.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                            HOT
                          </div>
                        </div>
                        <div className="w-3/5 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                {restaurant.name}
                              </h4>
                              <div className="flex items-center bg-gray-50 px-1.5 py-0.5 rounded-md">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="ml-1 text-xs font-bold text-gray-900">{restaurant.rating}</span>
                              </div>
                            </div>
                            <p className="text-gray-500 text-xs mb-2 line-clamp-1">{restaurant.cuisine.join(' • ')}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                              <Clock className="w-3 h-3 mr-1" /> {restaurant.deliveryTime}m
                            </span>
                            <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                              ${restaurant.deliveryFee} fee
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurant Grid */}
              <div>
                <h3 className="text-xl font-bold mb-6">Popular near you</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map(restaurant => (
                    <motion.div
                      whileHover={{ y: -4 }}
                      key={restaurant.id}
                      onClick={() => handleRestaurantClick(restaurant)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group"
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={restaurant.image} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {restaurant.rating}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev => prev.includes(restaurant.id) ? prev.filter(id => id !== restaurant.id) : [...prev, restaurant.id]);
                          }}
                          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${favorites.includes(restaurant.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                        </button>
                      </div>
                      <div className="p-5">
                        <h4 className="text-lg font-bold mb-1">{restaurant.name}</h4>
                        <p className="text-gray-500 text-sm mb-3">{restaurant.cuisine.join(' • ')}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {restaurant.deliveryTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingBag className="w-4 h-4" />
                            ${restaurant.deliveryFee} delivery
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Your Favorites</h2>
              </div>
              
              {favorites.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-500">Tap the heart icon on a restaurant to save it here.</p>
                  <button 
                    onClick={() => setCurrentView('home')}
                    className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Browse Restaurants
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.filter(r => favorites.includes(r.id)).map((restaurant) => (
                    <div 
                      key={restaurant.id} 
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group relative"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setCurrentView('restaurant');
                      }}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={restaurant.image} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-900 shadow-sm">
                            {restaurant.deliveryTime} min
                          </span>
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                            ${restaurant.deliveryFee} delivery
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev => prev.includes(restaurant.id) ? prev.filter(id => id !== restaurant.id) : [...prev, restaurant.id]);
                          }}
                          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                        >
                          <Heart className={`w-5 h-5 ${favorites.includes(restaurant.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {restaurant.name}
                          </h3>
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-bold text-gray-900">{restaurant.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm mb-4">
                          <span>{restaurant.cuisine}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {restaurant.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'restaurant' && selectedRestaurant && (
            <motion.div
              key="restaurant"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Restaurant Header */}
              <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-8">
                <img 
                  src={selectedRestaurant.image} 
                  alt={selectedRestaurant.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h2 className="text-4xl font-bold mb-2">{selectedRestaurant.name}</h2>
                  <p className="text-white/90 mb-4">{selectedRestaurant.cuisine.join(' • ')}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{selectedRestaurant.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedRestaurant.deliveryTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedRestaurant.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localMenuItems
                  .filter(item => item.restaurantId === selectedRestaurant.id)
                  .map(item => (
                    <div key={item.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex gap-4 transition-all ${item.available ? 'border-gray-100 hover:shadow-md' : 'border-gray-50 opacity-60'}`}>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{item.name}</h4>
                          {item.popular && item.available && (
                            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold">
                              Popular
                            </span>
                          )}
                          {!item.available && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                          <button 
                            onClick={() => item.available && addToCart(item)}
                            disabled={!item.available}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                              item.available 
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-900' 
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Plus className="w-4 h-4" /> {item.available ? 'Add' : 'Out'}
                          </button>
                        </div>
                      </div>
                      <div className="w-32 h-32 shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className={`w-full h-full object-cover rounded-xl ${!item.available && 'grayscale'}`}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {currentView === 'checkout' && selectedRestaurant && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-8">Checkout</h2>
              
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
                <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-500">{item.quantity}x</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 pt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${(cartTotal * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>${selectedRestaurant.deliveryFee.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span>${Math.max(0, cartTotal + (cartTotal * 0.08) + selectedRestaurant.deliveryFee - discount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Tag className="w-5 h-5" /> Promo Code</h3>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Enter code (try SAVE20)" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none uppercase" 
                  />
                  <button 
                    onClick={() => {
                      if (promoCode === 'SAVE20') {
                        setDiscount(cartTotal * 0.20);
                        alert('Promo code applied successfully!');
                      } else {
                        setDiscount(0);
                        alert('Invalid promo code.');
                      }
                    }}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold mb-6">Delivery Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" defaultValue="123 Home Street, Apt 4B" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label>
                    <input type="text" placeholder="e.g. Leave at door" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold mb-6">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['CARD', 'UPI', 'COD'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as 'CARD' | 'UPI' | 'COD')}
                      className={`p-4 rounded-xl border-2 font-medium transition-colors ${
                        paymentMethod === method 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {method === 'CARD' ? 'Credit/Debit Card' : method === 'UPI' ? 'UPI' : 'Cash on Delivery'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={placeOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-colors shadow-sm"
              >
                Place Order
              </button>
            </motion.div>
          )}

          {currentView === 'order_history' && currentUser?.role === 'CUSTOMER' && (
            <motion.div
              key="order_history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Order History</h2>
              </div>

              <div className="space-y-6">
                {mockPastOrders.map(pastOrder => (
                  <div key={pastOrder.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={pastOrder.restaurant.image} 
                          alt={pastOrder.restaurant.name}
                          className="w-16 h-16 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="text-xl font-bold">{pastOrder.restaurant.name}</h3>
                          <p className="text-sm text-gray-500">
                            {pastOrder.placedAt.toLocaleDateString()} • {pastOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items • ${pastOrder.total.toFixed(2)}
                          </p>
                          <span className="inline-block mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">
                            {pastOrder.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button 
                          onClick={() => {
                            if (cart.length > 0 && cart[0].restaurantId !== pastOrder.restaurant.id) {
                              if (!window.confirm('Starting a new order will clear your current cart. Continue?')) {
                                return;
                              }
                            }
                            setSelectedRestaurant(pastOrder.restaurant);
                            setCart([...pastOrder.items]);
                            setIsCartOpen(true);
                          }}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" /> Reorder
                        </button>
                        {pastOrder.status === 'DELIVERED' && !pastOrder.feedback && (
                          <button 
                            onClick={() => {
                              setRatingModalOrder(pastOrder);
                              setRatingValue(5);
                              setRatingComment('');
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Star className="w-4 h-4" /> Rate Order
                          </button>
                        )}
                        {pastOrder.feedback && (
                          <div className="flex items-center justify-center gap-1 text-sm font-medium text-yellow-600 bg-yellow-50 px-4 py-2 rounded-xl">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {pastOrder.feedback.rating}/5
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 bg-gray-50">
                      <ul className="space-y-2">
                        {pastOrder.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700"><span className="font-medium">{item.quantity}x</span> {item.name}</span>
                            <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                        {pastOrder.discount && (
                          <li className="flex justify-between text-sm text-emerald-600 font-medium pt-2 border-t border-gray-200">
                            <span>Discount Applied</span>
                            <span>-${pastOrder.discount.toFixed(2)}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'tracking' && order && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
                  <h2 className="text-3xl font-bold mb-2">Order {order.status === 'DELIVERED' ? 'Delivered' : 'in Progress'}</h2>
                  <p className="text-emerald-100">Order #{order.id.toUpperCase()}</p>
                </div>
                
                <div className="p-8">
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100" />
                    
                    <div className="space-y-8 relative">
                      {[
                        { status: 'PLACED', label: 'Order Placed', desc: 'We have received your order' },
                        { status: 'CONFIRMED', label: 'Confirmed', desc: 'Restaurant is preparing your food' },
                        { status: 'PREPARING', label: 'Preparing', desc: 'Your food is almost ready' },
                        { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Driver is on the way' },
                        { status: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your meal!' }
                      ].map((step, idx) => {
                        const statuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                        const currentIndex = statuses.indexOf(order.status);
                        const stepIndex = statuses.indexOf(step.status);
                        const isCompleted = stepIndex <= currentIndex;
                        const isCurrent = stepIndex === currentIndex;
                        
                        return (
                          <div key={step.status} className="flex gap-6 items-start">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors duration-500 ${
                              isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isCompleted ? <CheckCircle className="w-6 h-6" /> : <div className="w-3 h-3 rounded-full bg-current" />}
                            </div>
                            <div className="pt-3">
                              <h4 className={`font-bold text-lg ${isCurrent ? 'text-emerald-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.label}
                              </h4>
                              <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <div className="mt-8 space-y-4">
                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                              <Navigation className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-blue-900 text-lg">Driver is on the way</h4>
                              <p className="text-blue-700">
                                Arriving in <span className="font-bold text-xl">{Math.floor(deliveryCountdown / 60)}:{(deliveryCountdown % 60).toString().padStart(2, '0')}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden shrink-0">
                              <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=100&q=80" alt="Driver" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <h5 className="font-bold text-gray-900">Michael T.</h5>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.9</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1"><Car className="w-3 h-3" /> Silver Honda Civic (ABC-1234)</span>
                              </div>
                            </div>
                          </div>
                          <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-700 transition-colors shrink-0">
                            <Phone className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 rotate-180" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <ShoppingBag className="w-16 h-16 text-gray-300" />
                    <p className="text-lg">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-emerald-600 font-semibold hover:underline"
                    >
                      Browse restaurants
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold mb-1">{item.name}</h4>
                          <p className="text-emerald-600 font-semibold mb-3">${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between mb-4 text-lg font-bold">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setCurrentView('checkout');
                      window.scrollTo(0, 0);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-colors shadow-sm"
                  >
                    Go to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingModalOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRatingModalOrder(null)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-50 shadow-2xl rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Rate Your Order</h2>
                <button 
                  onClick={() => setRatingModalOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">How was your food from <span className="font-bold text-gray-900">{ratingModalOrder.restaurant.name}</span>?</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingValue(star)}
                        className="p-2 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-10 h-10 ${ratingValue >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add a comment (optional)</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24"
                    placeholder="What did you like or dislike?"
                  />
                </div>
                <button
                  onClick={() => {
                    // In a real app, this would send the rating to the backend
                    // Here we just update the local state for demonstration
                    ratingModalOrder.feedback = {
                      rating: ratingValue,
                      comment: ratingComment
                    };
                    setRatingModalOrder(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-sm"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
