import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Plus, 
  Minus, 
  Star,
  CreditCard,
  Banknote,
  Download,
  Edit,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  Package,
  Calendar,
  Bell,
  Heart,
  X,
  Home,
  ChefHat,
  Receipt,
  Settings,
  TrendingUp,
  Brain,
  Bot,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingBag,
  UserPlus,
  Search,
  Filter,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Award,
  Sparkles,
  PieChart,
  Activity,
  ArrowLeft,
  Smartphone,
  Wifi,
  Shield,
  Tag,
  TrendingDown,
  BarChart2,
  FileText,
  File,
  Utensils
} from 'lucide-react';
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
    pending: { color: 'badge-warning', icon: <Clock className="w-4 h-4" />, text: 'En attente' },
    confirmed: { color: 'badge-info', icon: <CheckCircle className="w-4 h-4" />, text: 'Confirmé' },
    preparing: { color: 'badge-secondary', icon: <ChefHat className="w-4 h-4" />, text: 'En préparation' },
    ready: { color: 'badge-success', icon: <CheckCircle className="w-4 h-4" />, text: 'Prêt' },
    delivered: { color: 'badge-success', icon: <Package className="w-4 h-4" />, text: 'Livré' },
    cancelled: { color: 'badge-error', icon: <X className="w-4 h-4" />, text: 'Annulé' }
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-orange-600 flex items-center">
              <img 
                src="https://res.cloudinary.com/dq2hgwhux/image/upload/v1752350027/Eria_logo-removebg-preview_b6vihc.png" 
                alt="EURIA Food Logo" 
                className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-3 object-contain"
              />
              <span className="hidden sm:block">EURIA Food</span>
              <span className="sm:hidden">EURIA</span>
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            <a href="#home" className="text-gray-700 hover:text-orange-600 transition-colors">Accueil</a>
            <a href="#menu" className="text-gray-700 hover:text-orange-600 transition-colors">Menu</a>
            <a href="#orders" className="text-gray-700 hover:text-orange-600 transition-colors">Mes Commandes</a>
            <a href="#reservations" className="text-gray-700 hover:text-orange-600 transition-colors">Réservations</a>
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Desktop User Menu */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors"
              >
                <User className="w-6 h-6" />
                <span className="hidden lg:block">{user?.name}</span>
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </div>
                  <a href="#profile" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Mon Profil</span>
                  </a>
                  <a href="#orders" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Mes Commandes</span>
                  </a>
                  <a href="#reservations" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Mes Réservations</span>
                  </a>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              <a href="#home" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors">
                Accueil
              </a>
              <a href="#menu" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors">
                Menu
              </a>
              <a href="#orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors">
                Mes Commandes
              </a>
              <a href="#reservations" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors">
                Réservations
              </a>
              <div className="border-t border-gray-200 pt-2">
                <a href="#profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors">
                  Mon Profil
                </a>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
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
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-400" />
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
                        <p className="text-orange-600 font-bold">{item.price.toFixed(2)} Fcfa</p>
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
                    <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">Total:</span>
                    <span className="text-xl font-bold text-orange-600">{getTotalPrice().toFixed(2)} Fcfa</span>
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
                <span>{(item.price * item.quantity).toFixed(2)} Fcfa</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-orange-600">{total.toFixed(2)} Fcfa</span>
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
            `Payer ${total.toFixed(2)} Fcfa`
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
      <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-6xl font-bold mb-6 flex flex-col md:flex-row items-center justify-center">
            <Utensils className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-0 md:mr-4 text-white" />
            <span>EURIA Food</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90 px-4">
            Découvrez une expérience culinaire unique avec des recommandations personnalisées par intelligence artificielle
          </p>
          <button
            onClick={scrollToMenu}
            className="bg-white text-orange-600 px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Voir le Menu
          </button>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Nos Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-4 md:p-6 card">
              <div className="flex justify-center mb-4">
                <div className="p-3 md:p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full">
                  <Bot className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800">Recommandations IA</h3>
              <p className="text-sm md:text-base text-slate-600">Des suggestions personnalisées basées sur vos préférences et votre historique</p>
            </div>
            <div className="text-center p-4 md:p-6 card">
              <div className="flex justify-center mb-4">
                <div className="p-3 md:p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800">Prise en charge Rapide</h3>
              <p className="text-sm md:text-base text-slate-600">Prise en charge en 30 minutes ou moins</p>
            </div>
            <div className="text-center p-4 md:p-6 card sm:col-span-2 lg:col-span-1">
              <div className="flex justify-center mb-4">
                <div className="p-3 md:p-4 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full">
                  <Smartphone className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 text-slate-800">Commande Facile</h3>
              <p className="text-sm md:text-base text-slate-600">Interface intuitive pour commander en quelques clics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Plats Populaires</h2>
          {loading ? (
            <div className="flex justify-center">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <div className="p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>
                    <p className="text-sm md:text-base text-gray-600 mb-4">{item.description}</p>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-xl md:text-2xl font-bold text-orange-600">{item.price.toFixed(2)} Fcfa</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs md:text-sm self-start sm:self-center">
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
        <div className="mb-8 p-6 ai-card">
          <h2 className="text-xl font-bold mb-4 flex items-center text-orange-800">
            <Bot className="w-6 h-6 mr-3" />
            Recommandations IA pour vous
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {aiRecommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium">{rec.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                <div className="mt-2">
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
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
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
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
                <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                <span className="badge-secondary">
                  {item.category}
                </span>
              </div>
              <p className="text-slate-600 mb-4">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-orange-600">{item.price.toFixed(2)} Fcfa</span>
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
          <div className="text-center py-12">
            <img 
              src="https://res.cloudinary.com/dq2hgwhux/image/upload/v1752350027/Eria_logo-removebg-preview_b6vihc.png" 
              alt="Aucun plat" 
              className="w-16 h-16 mx-auto mb-4 object-contain opacity-40"
            />
            <p className="text-gray-500 mt-4">Aucun plat trouvé</p>
          </div>
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
      // Silent error handling - no toast notification
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
          <Package className="w-16 h-16 mx-auto text-slate-400 mb-4" />
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
                      <span>{(item.price * item.quantity).toFixed(2)} Fcfa</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-bold">
                  Total: {order.total.toFixed(2)} Fcfa
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
      // Silent error handling - no toast notification
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
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-gray-500 mt-4">Aucune réservation trouvée</p>
          </div>
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
  const [availableTables, setAvailableTables] = useState(tables);
  const [selectedTable, setSelectedTable] = useState(null);

  // Update available tables when date/time changes
  useEffect(() => {
    if (formData.date && formData.time) {
      checkTableAvailability();
    }
  }, [formData.date, formData.time]);

  // Update selected table info when table is selected
  useEffect(() => {
    if (formData.table_id) {
      const table = availableTables.find(t => t.id === formData.table_id);
      setSelectedTable(table);
    } else {
      setSelectedTable(null);
    }
  }, [formData.table_id, availableTables]);

  const checkTableAvailability = async () => {
    try {
      const reservationDate = new Date(`${formData.date}T${formData.time}`);
      const response = await api.get(`/api/tables/availability?date=${reservationDate.toISOString()}`);
      setAvailableTables(response.data.tables);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate guest count against table capacity
      if (selectedTable && formData.guests > selectedTable.seats) {
        toast.error(`Cette table ne peut accueillir que ${selectedTable.seats} personnes maximum.`);
        setLoading(false);
        return;
      }

      const reservationDate = new Date(`${formData.date}T${formData.time}`);
      
      await api.post('/api/reservations', {
        table_id: formData.table_id,
        date: reservationDate.toISOString(),
        guests: formData.guests
      });

      toast.success('Réservation créée avec succès !');
      onSuccess();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.detail);
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Erreur lors de la création de la réservation');
      }
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTablesForSelection = () => {
    return availableTables.filter(table => 
      table.status === 'available' && 
      (!formData.date || !formData.time || table.available_for_reservation !== false)
    );
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
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value, table_id: ''})}
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
              onChange={(e) => setFormData({...formData, time: e.target.value, table_id: ''})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nombre d'invités</label>
            <input
              type="number"
              value={formData.guests}
              onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value), table_id: ''})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              min="1"
              max="10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Table</label>
            <select
              value={formData.table_id}
              onChange={(e) => setFormData({...formData, table_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Sélectionner une table</option>
              {getAvailableTablesForSelection().map(table => (
                <option 
                  key={table.id} 
                  value={table.id}
                  disabled={formData.guests > table.seats}
                >
                  Table {table.number} ({table.seats} places)
                  {formData.guests > table.seats ? ' - Trop petite' : ''}
                  {formData.date && formData.time && table.available_for_reservation === false ? ' - Occupée' : ''}
                </option>
              ))}
            </select>
            {formData.date && formData.time && getAvailableTablesForSelection().length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Aucune table disponible pour cette date et heure. Veuillez choisir un autre créneau.
              </p>
            )}
          </div>

          {selectedTable && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Table {selectedTable.number}</strong> - Capacité: {selectedTable.seats} personnes
                {formData.guests > selectedTable.seats && (
                  <span className="block text-red-600 font-medium">
                    ⚠️ Trop d'invités pour cette table
                  </span>
                )}
              </p>
            </div>
          )}

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
              disabled={loading || !formData.table_id || (selectedTable && formData.guests > selectedTable.seats)}
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
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <img 
              src="https://res.cloudinary.com/dq2hgwhux/image/upload/v1752350027/Eria_logo-removebg-preview_b6vihc.png" 
              alt="EURIA Food Logo" 
              className="w-8 h-8 mr-3 object-contain"
            />
            EURIA Food
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
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
    { id: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'orders', label: 'Commandes', icon: <Package className="w-5 h-5" /> },
    { id: 'menu', label: 'Menu', icon: <ChefHat className="w-5 h-5" /> },
    { id: 'users', label: 'Utilisateurs', icon: <Users className="w-5 h-5" /> },
    { id: 'tables', label: 'Tables', icon: <Calendar className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventaire', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'Rapports', icon: <TrendingUp className="w-5 h-5" /> }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-30">
      <div className="p-6">
        <h1 className="text-xl font-bold text-orange-600 flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          Admin Panel
        </h1>
      </div>
      
      <nav className="mt-6">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-slate-100 transition-colors ${
              currentPage === item.id ? 'bg-orange-100 text-orange-800 border-r-4 border-orange-600' : 'text-slate-700'
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
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ setCurrentPage }) => {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_users: 0,
    total_revenue: 0,
    today_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

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

  const generateAIInsights = async () => {
    setLoadingAI(true);
    try {
      const response = await api.get('/api/ai/insights');
      if (response.data.status === 'success') {
        setAiInsights(response.data.insights);
        toast.success('Insights IA générés avec succès!');
      } else {
        toast.error('Erreur lors de la génération des insights IA');
      }
    } catch (error) {
      console.error('Erreur insights IA:', error);
      toast.error('Erreur lors de la génération des insights IA');
    } finally {
      setLoadingAI(false);
    }
  };

  const optimizePricing = async () => {
    setLoadingAI(true);
    try {
      const response = await api.post('/api/ai/pricing/optimize');
      if (response.data.status === 'success') {
        toast.success('Optimisation des prix générée! Consultez la section Menu pour voir les suggestions.');
      } else {
        toast.error('Erreur lors de l\'optimisation des prix');
      }
    } catch (error) {
      console.error('Erreur optimisation prix:', error);
      toast.error('Erreur lors de l\'optimisation des prix');
    } finally {
      setLoadingAI(false);
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
        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon from-blue-500 to-indigo-500">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600">Total Commandes</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total_orders}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon from-emerald-500 to-teal-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600">Utilisateurs</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon from-orange-500 to-red-500">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total_revenue.toFixed(2)} Fcfa</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon from-orange-500 to-amber-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-600">Commandes aujourd'hui</p>
              <p className="text-2xl font-bold text-slate-800">{stats.today_orders}</p>
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
            className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left border border-blue-100 hover:border-blue-200"
          >
            <div className="text-blue-600 mb-3">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800">Rapport journalier</h3>
            <p className="text-sm text-slate-600">Télécharger le rapport du jour</p>
          </button>

          <button 
            onClick={() => setCurrentPage('menu')}
            className="p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-left border border-emerald-100 hover:border-emerald-200"
          >
            <div className="text-emerald-600 mb-3">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800">Nouveau plat</h3>
            <p className="text-sm text-slate-600">Ajouter un article au menu</p>
          </button>

          <button 
            onClick={() => setCurrentPage('inventory')}
            className="p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors text-left border border-amber-100 hover:border-amber-200"
          >
            <div className="text-amber-600 mb-3">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800">Inventaire</h3>
            <p className="text-sm text-slate-600">Gérer le stock</p>
          </button>
        </div>
      </div>

      {/* AI Analytics Section */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm p-6 border border-orange-100">
        <h2 className="text-xl font-bold mb-4 flex items-center text-orange-800">
          <Brain className="w-6 h-6 mr-3" />
          Intelligence Artificielle
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <button 
            onClick={() => generateAIInsights()}
            className="p-4 bg-white rounded-xl hover:bg-orange-50 transition-colors text-left border border-orange-200 hover:border-orange-300"
          >
            <div className="text-orange-600 mb-3">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800">Insights IA</h3>
            <p className="text-sm text-slate-600">Analyses intelligentes du business</p>
          </button>

          <button 
            onClick={() => optimizePricing()}
            className="p-4 bg-white rounded-xl hover:bg-orange-50 transition-colors text-left border border-orange-200 hover:border-orange-300"
          >
            <div className="text-orange-600 mb-3">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-slate-800">Optimisation Prix</h3>
            <p className="text-sm text-slate-600">Suggestions de prix intelligentes</p>
          </button>
        </div>
      </div>

      {/* AI Insights Display */}
      {aiInsights && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
            <Sparkles className="w-6 h-6 mr-3 text-orange-600" />
            Insights Intelligence Artificielle
          </h2>
          <div className="space-y-4">
            {aiInsights.insights && aiInsights.insights.map((insight, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <div className="flex items-start">
                  <div className={`w-3 h-3 rounded-full mt-1 mr-3 ${
                    insight.impact === 'high' ? 'bg-red-500' : 
                    insight.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{insight.category}</h4>
                    <p className="text-slate-600 text-sm">{insight.description}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800' : 
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      Impact: {insight.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {aiInsights.recommendations && (
              <div className="mt-6">
                <h3 className="font-semibold text-slate-800 mb-3">Recommandations:</h3>
                <ul className="space-y-2">
                  {aiInsights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-slate-600 text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {loadingAI && (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="large" />
            <span className="ml-3 text-slate-600">Génération des insights IA en cours...</span>
          </div>
        </div>
      )}
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
                  <td className="px-6 py-4 text-sm font-medium">{order.total.toFixed(2)} Fcfa</td>
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
          <Package className="w-16 h-16 mx-auto text-slate-400" />
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
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un article</span>
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
                <span className="text-2xl font-bold text-orange-600">{item.price.toFixed(2)} Fcfa</span>
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
                  className="flex-1 bg-slate-600 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => toggleAvailability(item.id, item.available)}
                  className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                    item.available
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {item.available ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Désactiver</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Activer</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-center py-12">
            <img 
              src="https://res.cloudinary.com/dq2hgwhux/image/upload/v1752350027/Eria_logo-removebg-preview_b6vihc.png" 
              alt="Aucun menu" 
              className="w-16 h-16 mx-auto mb-4 object-contain opacity-40"
            />
            <p className="text-gray-500 mt-4">Aucun article dans le menu</p>
          </div>
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
            <label className="block text-sm font-medium mb-1">Prix (Fcfa)</label>
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
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-slate-400 mb-4" />
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
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une table</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center mb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
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
                className="flex-1 bg-slate-600 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center space-x-1"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => deleteTable(table.id)}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-gray-500 mt-4">Aucune table configurée</p>
        </div>
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
        <div className="mb-8 p-6 ai-card">
          <h2 className="text-xl font-bold mb-4 flex items-center text-orange-800">
            <Brain className="w-6 h-6 mr-3" />
            Prédictions IA - Demande 7 jours
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {aiPredictions.slice(0, 3).map((pred, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                <h3 className="font-semibold text-slate-800">{pred.item_name}</h3>
                <p className="text-2xl font-bold text-orange-600">{pred.predicted_demand}</p>
                <p className="text-sm text-slate-600">
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
          <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Alertes Stock
          </h2>
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
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <p className="text-gray-500 mt-4">Aucun article en inventaire</p>
        </div>
        </div>
      )}
    </div>
  );
};

// AdminReports Component
const AdminReports = ({ setCurrentPage }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    popularItems: [],
    averageOrderValue: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders first
      const response = await api.get('/api/orders');
      const allOrders = response.data;
      
      // Filter orders based on selected period
      const filteredOrders = filterOrdersByPeriod(allOrders, selectedPeriod);
      setOrders(filteredOrders);
      calculateReportData(filteredOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByPeriod = (orders, period) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      // Handle different date formats from the API
      let orderDate;
      try {
        orderDate = new Date(order.created_at || order.createdAt);
      } catch (e) {
        console.warn('Invalid date format for order:', order);
        return false;
      }
      
      switch (period) {
        case 'today':
          return orderDate >= startOfToday;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const calculateReportData = (orders) => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate popular items
    const itemCounts = {};
    orders.forEach(order => {
      const items = order.items || [];
      items.forEach(item => {
        const name = item.name || 'Article inconnu';
        const quantity = item.quantity || 1;
        itemCounts[name] = (itemCounts[name] || 0) + quantity;
      });
    });

    const popularItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    setReportData({
      totalRevenue,
      totalOrders,
      popularItems,
      averageOrderValue
    });
  };

  const generateReport = async () => {
    try {
      toast.info('Génération du rapport en cours...');
      
      const response = await api.post(`/api/reports/generate?period=${selectedPeriod}`, {}, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Rapport téléchargé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast.error('Erreur lors de la génération du rapport');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
            <p className="text-gray-600 mt-2">Analyse des ventes et performances</p>
          </div>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex space-x-4">
          {[
            { key: 'today', label: "Aujourd'hui" },
            { key: 'week', label: 'Cette semaine' },
            { key: 'month', label: 'Ce mois' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalRevenue.toFixed(2)} Fcfa</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.averageOrderValue.toFixed(2)} Fcfa</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Rapport</p>
              <button
                onClick={generateReport}
                className="text-sm font-medium text-orange-600 hover:text-orange-800"
              >
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plats populaires</h2>
          <div className="space-y-4">
            {reportData.popularItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="text-sm text-gray-500">{item.count} commandes</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Commandes récentes</h2>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id || order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">#{(order.id || order._id || '').slice(-6)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at || order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{(order.total || 0).toFixed(2)} Fcfa</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status === 'delivered' ? 'Livré' :
                     order.status === 'preparing' ? 'En préparation' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">Aucune commande pour cette période</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Toutes les commandes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id || order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">#{(order.id || order._id || '').slice(-6)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {order.customer_name || order.customerName || 'Client anonyme'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(order.created_at || order.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                    {(order.total || 0).toFixed(2)} Fcfa
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'delivered' ? 'Livré' :
                       order.status === 'preparing' ? 'En préparation' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucune commande pour cette période</p>
          </div>
        )}
      </div>
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
    // Set default page based on user role when user loads
    if (user && !currentPage) {
      if (user.role === 'admin') {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('home');
      }
    }

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
  }, [user, setCurrentPage, currentPage]);

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
          {(!currentPage || currentPage === 'dashboard') && <AdminDashboard setCurrentPage={setCurrentPage} />}
          {currentPage === 'orders' && <AdminOrders />}
          {currentPage === 'menu' && <AdminMenu />}
          {currentPage === 'users' && <AdminUsers />}
          {currentPage === 'tables' && <AdminTables />}
          {currentPage === 'inventory' && <AdminInventory />}
          {currentPage === 'reports' && <AdminReports setCurrentPage={setCurrentPage} />}
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
