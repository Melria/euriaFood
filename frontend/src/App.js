import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Context for Authentication
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// Context for Cart
const CartContext = createContext();
const useCart = () => useContext(CartContext);

// Toast notifications
const toast = {
  success: (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  },
  error: (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  },
  info: (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }
};

// Loading Spinner Component
const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-orange-600 ${sizeClasses[size]}`}></div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', text: 'En attente' },
    confirmed: { color: 'bg-blue-100 text-blue-800', icon: '✅', text: 'Confirmé' },
    preparing: { color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳', text: 'En préparation' },
    ready: { color: 'bg-green-100 text-green-800', icon: '🍽️', text: 'Prêt' },
    delivered: { color: 'bg-gray-100 text-gray-800', icon: '📦', text: 'Livré' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: '❌', text: 'Annulé' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};

// Cart Provider
const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} ajouté au panier`);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Connexion réussie !');
      return userData;
    } catch (error) {
      toast.error('Erreur de connexion');
      throw error;
    }
  };

  const register = async (name, email, password, role = 'client') => {
    try {
      await api.post('/api/auth/register', { name, email, password, role });
      toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      return true;
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Déconnexion réussie');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Client Header Component
const ClientHeader = () => {
  const { user, logout } = useAuth();
  const { getTotalItems, setIsCartOpen } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-orange-600">🍽️ Restaurant IA</h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-gray-700 hover:text-orange-600 transition-colors">Accueil</a>
            <a href="#menu" className="text-gray-700 hover:text-orange-600 transition-colors">Menu</a>
            <a href="#orders" className="text-gray-700 hover:text-orange-600 transition-colors">Mes Commandes</a>
            <a href="#reservations" className="text-gray-700 hover:text-orange-600 transition-colors">Réservations</a>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <span className="text-2xl">🛒</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors"
              >
                <span className="text-2xl">👤</span>
                <span className="hidden md:block">{user?.name}</span>
                <span className="text-sm">▼</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mon Profil
                  </a>
                  <a href="#orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mes Commandes
                  </a>
                  <a href="#reservations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mes Réservations
                  </a>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Cart Modal Component
const CartModal = () => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsCartOpen(false)}>
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg" onClick={e => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Mon Panier</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-6xl">🛒</span>
                <p className="text-gray-500 mt-4">Votre panier est vide</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-orange-600 font-bold">{item.price.toFixed(2)} €</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-xl font-bold text-orange-600">{getTotalPrice().toFixed(2)} €</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Commander
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Vider le panier
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          cartItems={cartItems}
          total={getTotalPrice()}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            clearCart();
            setIsCartOpen(false);
            setShowPaymentModal(false);
          }}
        />
      )}
    </>
  );
};

// Payment Modal Component
const PaymentModal = ({ cartItems, total, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order first
      const orderData = {
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: total
      };

      const orderResponse = await api.post('/api/orders', orderData);
      const order = orderResponse.data;

      if (paymentMethod === 'cash') {
        toast.success('Commande créée ! Paiement en espèces à effectuer sur place.');
        onSuccess();
      } else {
        // Simulate card payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update order status to paid
        await api.put(`/api/orders/${order.id}/status?status=confirmed`);
        
        toast.success('Paiement réussi ! Votre commande a été confirmée.');
        onSuccess();
      }
    } catch (error) {
      toast.error('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Paiement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Order Summary */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Résumé de la commande</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-orange-600">{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Méthode de paiement</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Carte bancaire
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Espèces (sur place)
            </label>
          </div>
        </div>

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom sur la carte</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de carte</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Date d'expiration</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="123"
                  maxLength="3"
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="small" />
              <span className="ml-2">Traitement...</span>
            </>
          ) : (
            `Payer ${total.toFixed(2)} €`
          )}
        </button>
      </div>
    </div>
  );
};

// Client Home Page
const ClientHomePage = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const response = await api.get('/api/menu');
        setFeaturedItems(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  const scrollToMenu = () => {
    window.location.hash = 'menu';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-400 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-bold mb-6">🍽️ Restaurant IA</h1>
          <p className="text-xl mb-8 opacity-90">
            Découvrez une expérience culinaire unique avec des recommandations personnalisées par intelligence artificielle
          </p>
          <button
            onClick={scrollToMenu}
            className="bg-white text-orange-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Voir le Menu
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Nos Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">Recommandations IA</h3>
              <p className="text-gray-600">Des suggestions personnalisées basées sur vos préférences et votre historique</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-2">Livraison Rapide</h3>
              <p className="text-gray-600">Livraison en 30 minutes ou moins dans toute la ville</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2">Commande Facile</h3>
              <p className="text-gray-600">Interface intuitive pour commander en quelques clics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Plats Populaires</h2>
          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-orange-600">{item.price.toFixed(2)} €</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Menu Page Component
const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    if (user) {
      fetchAIRecommendations();
    }
  }, [user]);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/menu/categories');
      setCategories(['all', ...response.data.categories]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAIRecommendations = async () => {
    try {
      const response = await api.post('/api/ai/recommendations', {
        user_id: user.id,
        preferences: {}
      });
      if (response.data.status === 'success') {
        setAiRecommendations(response.data.recommendations.recommended_items || []);
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Notre Menu</h1>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            Recommandations IA pour vous
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {aiRecommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium">{rec.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                <div className="mt-2">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Confiance: {(rec.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category === 'all' ? 'Tous' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{item.name}</h3>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                  {item.category}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-orange-600">{item.price.toFixed(2)} €</span>
                <button
                  onClick={() => addToCart(item)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">🍽️</span>
          <p className="text-gray-500 mt-4">Aucun plat trouvé</p>
        </div>
      )}
    </div>
  );
};

// Client Orders Page
const ClientOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${orderId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Facture téléchargée !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement de la facture');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      toast.success('Commande annulée');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Mes Commandes</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">📦</span>
          <p className="text-gray-500 mt-4">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">Commande #{order.id.slice(0, 8)}</h3>
                  <p className="text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Articles commandés:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name || 'Article'} x{item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-bold">
                  Total: {order.total.toFixed(2)} €
                </div>
                <div className="space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    onClick={() => downloadInvoice(order.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Télécharger Facture
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Client Reservations Page
const ClientReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReservationForm, setShowReservationForm] = useState(false);

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await api.get('/api/reservations');
      setReservations(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await api.get('/api/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const cancelReservation = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await api.put(`/api/reservations/${reservationId}`, { status: 'cancelled' });
      toast.success('Réservation annulée');
      fetchReservations();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mes Réservations</h1>
        <button
          onClick={() => setShowReservationForm(true)}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Nouvelle Réservation
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">📅</span>
          <p className="text-gray-500 mt-4">Aucune réservation trouvée</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map(reservation => {
            const table = tables.find(t => t.id === reservation.table_id);
            return (
              <div key={reservation.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Table {table?.number || 'N/A'}</h3>
                    <p className="text-gray-600">{table?.seats || 0} places</p>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>

                <div className="space-y-2 mb-4">
                  <p><strong>Date:</strong> {new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Heure:</strong> {new Date(reservation.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Invités:</strong> {reservation.guests}</p>
                </div>

                {reservation.status === 'pending' && (
                  <button
                    onClick={() => cancelReservation(reservation.id)}
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showReservationForm && (
        <ReservationForm
          tables={tables}
          onClose={() => setShowReservationForm(false)}
          onSuccess={() => {
            setShowReservationForm(false);
            fetchReservations();
          }}
        />
      )}
    </div>
  );
};

// Reservation Form Component
const ReservationForm = ({ tables, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    table_id: '',
    date: '',
    time: '',
    guests: 2
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reservationDate = new Date(`${formData.date}T${formData.time}`);
      
      await api.post('/api/reservations', {
        table_id: formData.table_id,
        date: reservationDate.toISOString(),
        guests: formData.guests
      });

      toast.success('Réservation créée avec succès !');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Nouvelle Réservation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Table</label>
            <select
              value={formData.table_id}
              onChange={(e) => setFormData({...formData, table_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Sélectionner une table</option>
              {tables.filter(table => table.status === 'available').map(table => (
                <option key={table.id} value={table.id}>
                  Table {table.number} ({table.seats} places)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Heure</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre d'invités</label>
            <input
              type="number"
              value={formData.guests}
              onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              min="1"
              max="10"
              required
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Réserver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Auth Page Component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Les mots de passe ne correspondent pas');
          return;
        }
        await register(formData.name, formData.email, formData.password);
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      // Error handled in auth functions
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Restaurant IA</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Test Account Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Compte de test:</h3>
          <p className="text-sm text-blue-600">
            <strong>Admin:</strong> admin@restaurant.com / admin123<br/>
            <strong>Ou créez un nouveau compte client</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!isLogin}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Chargement...</span>
              </>
            ) : (
              isLogin ? 'Se connecter' : 'S\'inscrire'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 hover:text-orange-700 transition-colors"
          >
            {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Sidebar Component
const AdminSidebar = ({ currentPage, setCurrentPage }) => {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'orders', label: 'Commandes', icon: '📦' },
    { id: 'menu', label: 'Menu', icon: '🍽️' },
    { id: 'users', label: 'Utilisateurs', icon: '👥' },
    { id: 'tables', label: 'Tables', icon: '🪑' },
    { id: 'inventory', label: 'Inventaire', icon: '📋' },
    { id: 'reports', label: 'Rapports', icon: '📈' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-30">
      <div className="p-6">
        <h1 className="text-xl font-bold text-orange-600">🍽️ Admin Panel</h1>
      </div>
      
      <nav className="mt-6">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 transition-colors ${
              currentPage === item.id ? 'bg-orange-100 text-orange-800 border-r-4 border-orange-600' : 'text-gray-700'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-6">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="mr-3">🚪</span>
          Déconnexion
        </button>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_users: 0,
    total_revenue: 0,
    today_orders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const downloadDailyReport = async () => {
    try {
      const response = await api.get('/api/reports/daily', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapport_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Rapport téléchargé !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement du rapport');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Commandes</p>
              <p className="text-2xl font-bold">{stats.total_orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Utilisateurs</p>
              <p className="text-2xl font-bold">{stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold">{stats.total_revenue.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Commandes aujourd'hui</p>
              <p className="text-2xl font-bold">{stats.today_orders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={downloadDailyReport}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium">Rapport journalier</h3>
            <p className="text-sm text-gray-600">Télécharger le rapport du jour</p>
          </button>

          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <div className="text-2xl mb-2">🍽️</div>
            <h3 className="font-medium">Nouveau plat</h3>
            <p className="text-sm text-gray-600">Ajouter un article au menu</p>
          </button>

          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-medium">Inventaire</h3>
            <p className="text-sm text-gray-600">Gérer le stock</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Orders Component
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status?status=${status}`);
      toast.success('Statut mis à jour');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Commandes</h1>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Toutes les commandes</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="preparing">En préparation</option>
          <option value="ready">Prêtes</option>
          <option value="delivered">Livrées</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">Client #{order.user_id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-medium">{order.total.toFixed(2)} €</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="preparing">En préparation</option>
                      <option value="ready">Prêt</option>
                      <option value="delivered">Livré</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">📦</span>
          <p className="text-gray-500 mt-4">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
};

// Admin Menu Component
const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await api.delete(`/api/menu/${itemId}`);
      toast.success('Article supprimé');
      fetchMenuItems();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleAvailability = async (itemId, available) => {
    try {
      await api.put(`/api/menu/${itemId}`, { available: !available });
      toast.success('Disponibilité mise à jour');
      fetchMenuItems();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion du Menu</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Ajouter un article
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className={`bg-white rounded-lg shadow-sm overflow-hidden ${!item.available ? 'opacity-60' : ''}`}>
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{item.name}</h3>
                <span className={`px-2 py-1 rounded text-sm ${
                  item.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.available ? 'Disponible' : 'Non disponible'}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-orange-600">{item.price.toFixed(2)} €</span>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                  {item.category}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setShowForm(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => toggleAvailability(item.id, item.available)}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    item.available
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {item.available ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">🍽️</span>
          <p className="text-gray-500 mt-4">Aucun article dans le menu</p>
        </div>
      )}

      {showForm && (
        <MenuItemForm
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingItem(null);
            fetchMenuItems();
          }}
        />
      )}
    </div>
  );
};

// Menu Item Form Component
const MenuItemForm = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || 'Plats',
    image_url: item?.image_url || '',
    available: item?.available !== undefined ? item.available : true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (item) {
        await api.put(`/api/menu/${item.id}`, data);
        toast.success('Article mis à jour');
      } else {
        await api.post('/api/menu', data);
        toast.success('Article créé');
      }

      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {item ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prix (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="Entrées">Entrées</option>
              <option value="Plats">Plats</option>
              <option value="Desserts">Desserts</option>
              <option value="Boissons">Boissons</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL de l'image</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({...formData, available: e.target.checked})}
                className="mr-2"
              />
              Disponible
            </label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="small" /> : (item ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin Users Component
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since there's no users endpoint in the API, we'll simulate it
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestion des Utilisateurs</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <span className="text-6xl">👥</span>
        <h2 className="text-xl font-bold mt-4 mb-2">Fonctionnalité en développement</h2>
        <p className="text-gray-600">
          La gestion des utilisateurs sera bientôt disponible. Cette section permettra de :
        </p>
        <ul className="text-left mt-4 space-y-2 max-w-md mx-auto">
          <li>• Voir la liste des utilisateurs</li>
          <li>• Modifier les rôles et permissions</li>
          <li>• Gérer les comptes clients</li>
          <li>• Analyser l'activité des utilisateurs</li>
        </ul>
      </div>
    </div>
  );
};

// Admin Tables Component
const AdminTables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/api/tables');
      setTables(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des tables');
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (tableId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) {
      return;
    }

    try {
      await api.delete(`/api/tables/${tableId}`);
      toast.success('Table supprimée');
      fetchTables();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Tables</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Ajouter une table
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🪑</div>
              <h3 className="text-xl font-bold">Table {table.number}</h3>
              <p className="text-gray-600">{table.seats} places</p>
            </div>
            
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                table.status === 'available' 
                  ? 'bg-green-100 text-green-800'
                  : table.status === 'occupied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {table.status === 'available' ? 'Disponible' : 
                 table.status === 'occupied' ? 'Occupée' : 'Réservée'}
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingTable(table);
                  setShowForm(true);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier
              </button>
              <button
                onClick={() => deleteTable(table.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">🪑</span>
          <p className="text-gray-500 mt-4">Aucune table configurée</p>
        </div>
      )}

      {showForm && (
        <TableForm
          table={editingTable}
          onClose={() => {
            setShowForm(false);
            setEditingTable(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingTable(null);
            fetchTables();
          }}
        />
      )}
    </div>
  );
};

// Table Form Component
const TableForm = ({ table, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    number: table?.number || '',
    seats: table?.seats || 2,
    status: table?.status || 'available'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        number: parseInt(formData.number),
        seats: parseInt(formData.seats)
      };

      if (table) {
        await api.put(`/api/tables/${table.id}`, data);
        toast.success('Table mise à jour');
      } else {
        await api.post('/api/tables', { ...data, id: crypto.randomUUID() });
        toast.success('Table créée');
      }

      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {table ? 'Modifier la table' : 'Nouvelle table'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Numéro de table</label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({...formData, number: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre de places</label>
            <input
              type="number"
              value={formData.seats}
              onChange={(e) => setFormData({...formData, seats: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              min="1"
              max="12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="available">Disponible</option>
              <option value="occupied">Occupée</option>
              <option value="reserved">Réservée</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {loading ? <LoadingSpinner size="small" /> : (table ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin Inventory Component
const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPredictions, setAiPredictions] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
    fetchAIPredictions();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/inventory/alerts');
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchAIPredictions = async () => {
    try {
      const response = await api.post('/api/ai/inventory/forecast', {
        days_ahead: 7,
        include_external_factors: true
      });
      if (response.data.status === 'success') {
        setAiPredictions(response.data.forecast.predictions || []);
      }
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestion de l'Inventaire</h1>

      {/* AI Predictions */}
      {aiPredictions.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">🤖</span>
            Prédictions IA - Demande 7 jours
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {aiPredictions.slice(0, 3).map((pred, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium">{pred.item_name}</h3>
                <p className="text-2xl font-bold text-blue-600">{pred.predicted_demand}</p>
                <p className="text-sm text-gray-600">
                  Confiance: {(pred.confidence * 100).toFixed(0)}% • {pred.trend}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-red-600">🚨 Alertes Stock</h2>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.priority === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
              }`}>
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm text-gray-600">Priorité: {alert.priority}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Items */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Actuel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Min</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-gray-600">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      item.current_stock <= item.min_stock_level ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {item.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.min_stock_level}</td>
                  <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.current_stock <= item.min_stock_level
                        ? 'bg-red-100 text-red-800'
                        : item.current_stock <= item.min_stock_level * 1.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.current_stock <= item.min_stock_level
                        ? 'Stock faible'
                        : item.current_stock <= item.min_stock_level * 1.5
                        ? 'Attention'
                        : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">📋</span>
          <p className="text-gray-500 mt-4">Aucun article en inventaire</p>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <CartModal />
      </CartProvider>
    </AuthProvider>
  );
}

// App Content Component
const AppContent = ({ currentPage, setCurrentPage }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Handle hash navigation for client pages
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && user?.role === 'client') {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, setCurrentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.role === 'admin') {
    return (
      <div className="flex">
        <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1 ml-64">
          {currentPage === 'dashboard' && <AdminDashboard />}
          {currentPage === 'orders' && <AdminOrders />}
          {currentPage === 'menu' && <AdminMenu />}
          {currentPage === 'users' && <AdminUsers />}
          {currentPage === 'tables' && <AdminTables />}
          {currentPage === 'inventory' && <AdminInventory />}
          {currentPage === 'reports' && <AdminDashboard />}
        </div>
      </div>
    );
  }

  // Client interface
  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      <main>
        {(currentPage === 'home' || !currentPage) && <ClientHomePage />}
        {currentPage === 'menu' && <MenuPage />}
        {currentPage === 'orders' && <ClientOrdersPage />}
        {currentPage === 'reservations' && <ClientReservationsPage />}
      </main>
    </div>
  );
};

export default App;