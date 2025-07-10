import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { 
  User, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Menu as MenuIcon, 
  Home, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Heart,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  CreditCard,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Utensils,
  Wine,
  Cookie
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

// Auth Context
const AuthContext = createContext();

function AuthProvider({ children }) {
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
      
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (name, email, password, role = 'client') => {
    try {
      await api.post('/api/auth/register', { name, email, password, role });
      return await login(email, password);
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Cart Context
const CartContext = createContext();

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

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

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Utility Components
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader className="w-8 h-8 animate-spin text-orange-600" />
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    preparing: { color: 'bg-orange-100 text-orange-800', icon: Coffee },
    ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    delivered: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    available: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    occupied: { color: 'bg-red-100 text-red-800', icon: XCircle },
    reserved: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Authentication Components
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register(formData.name, formData.email, formData.password);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen auth-container flex items-center justify-center p-4">
      <div className="auth-form">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Utensils className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Restaurant IA
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="auth-input"
                placeholder="Votre nom complet"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="votre@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                placeholder="••••••••"
                required={!isLogin}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                {isLogin ? 'Connexion...' : 'Inscription...'}
              </div>
            ) : (
              isLogin ? 'Se connecter' : 'S\'inscrire'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            }}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            {isLogin 
              ? 'Pas de compte ? Inscrivez-vous' 
              : 'Déjà un compte ? Connectez-vous'
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">Comptes de test :</p>
            <p className="text-xs text-blue-600">
              <strong>Admin :</strong> admin@restaurant.com / admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Client Components
function ClientHeader() {
  const { user, logout } = useContext(AuthContext);
  const { getCartItemsCount } = useContext(CartContext);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="client-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Utensils className="w-8 h-8 text-orange-600 mr-2" />
            <span className="text-xl font-bold text-gray-800">Restaurant IA</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-orange-600 font-medium">
              Accueil
            </a>
            <a href="#menu" className="text-gray-700 hover:text-orange-600 font-medium">
              Menu
            </a>
            <a href="#orders" className="text-gray-700 hover:text-orange-600 font-medium">
              Mes Commandes
            </a>
            <a href="#reservations" className="text-gray-700 hover:text-orange-600 font-medium">
              Réservations
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button className="relative p-2 text-gray-700 hover:text-orange-600">
              <ShoppingCart className="w-6 h-6" />
              {getCartItemsCount() > 0 && (
                <span className="cart-badge">
                  {getCartItemsCount()}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-600"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <a href="#home" className="px-4 py-2 text-gray-700 hover:bg-gray-50">
                Accueil
              </a>
              <a href="#menu" className="px-4 py-2 text-gray-700 hover:bg-gray-50">
                Menu
              </a>
              <a href="#orders" className="px-4 py-2 text-gray-700 hover:bg-gray-50">
                Mes Commandes
              </a>
              <a href="#reservations" className="px-4 py-2 text-gray-700 hover:bg-gray-50">
                Réservations
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function ClientHomePage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      
      {/* Hero Section */}
      <section className="restaurant-header text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Bienvenue {user?.name} !
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Découvrez notre cuisine exceptionnelle avec des recommandations personnalisées par IA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Voir le Menu
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors">
              Réserver une Table
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Nos Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Menu Intelligent</h3>
              <p className="text-gray-600">
                Recommandations personnalisées basées sur vos préférences et notre IA
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Réservations</h3>
              <p className="text-gray-600">
                Réservez votre table en ligne facilement et rapidement
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Commande en Ligne</h3>
              <p className="text-gray-600">
                Commandez vos plats favoris et suivez leur préparation en temps réel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Plats Populaires
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Burger Classic IA",
                description: "Burger artisanal optimisé par IA",
                price: "12.90€",
                image: "https://images.unsplash.com/photo-1700513970028-d8a630d21c6e?w=400"
              },
              {
                name: "Salade Smart César",
                description: "Salade avec recommandations nutritionnelles",
                price: "9.50€",
                image: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400"
              },
              {
                name: "Cocktail IA Signature",
                description: "Cocktail aux fruits avec recette optimisée",
                price: "8.00€",
                image: "https://images.unsplash.com/photo-1700513970042-f1fc4236c0bc?w=400"
              }
            ].map((item, index) => (
              <div key={index} className="food-card">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">{item.price}</span>
                    <button className="btn-primary">
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Contactez-nous
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-orange-600 mr-3" />
                  <span>123 Rue de la Gastronomie, 75001 Paris</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-orange-600 mr-3" />
                  <span>01 23 45 67 89</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-orange-600 mr-3" />
                  <span>contact@restaurant-ia.com</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-600 mr-3" />
                  <span>Ouvert tous les jours de 11h à 23h</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Horaires d'ouverture</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Lundi - Vendredi</span>
                  <span>11h00 - 23h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Samedi</span>
                  <span>10h00 - 24h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimanche</span>
                  <span>10h00 - 22h00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
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

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const getCategoryIcon = (category) => {
    const icons = {
      'Entrées': Coffee,
      'Plats': Utensils,
      'Desserts': Cookie,
      'Boissons': Wine,
      'all': MenuIcon
    };
    return icons[category] || Utensils;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Notre Menu</h1>
          <p className="text-lg text-gray-600">
            Découvrez nos plats préparés avec amour et optimisés par notre IA
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un plat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = getCategoryIcon(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'menu-category-active'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category === 'all' ? 'Tous' : category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aucun plat trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="menu-item-card">
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                    {item.popularity_score > 0.8 && (
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {item.price.toFixed(2)}€
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="btn-primary flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useContext(CartContext);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Votre panier est vide
            </h2>
            <p className="text-gray-500 mb-6">
              Ajoutez des plats délicieux à votre panier
            </p>
            <button className="btn-primary">
              Voir le Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Votre Panier</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Vider le panier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-gray-600 text-sm">{item.price.toFixed(2)}€</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <span className="font-semibold text-gray-800 w-20 text-right">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                    
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Résumé de la commande</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{getCartTotal().toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA (20%)</span>
                  <span>{(getCartTotal() * 0.2).toFixed(2)}€</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{(getCartTotal() * 1.2).toFixed(2)}€</span>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full btn-primary py-3"
              >
                Procéder au paiement
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={getCartTotal() * 1.2}
          cartItems={cartItems}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            clearCart();
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}

function ClientOrdersPage() {
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
      console.error('Error fetching orders:', error);
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
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Mes Commandes</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-500 mb-6">
              Vous n'avez pas encore passé de commande
            </p>
            <button className="btn-primary">
              Voir le Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Commande #{order.id.slice(0, 8)}
                    </h3>
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
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={order.status} />
                    <span className="text-xl font-bold text-gray-800">
                      {order.total.toFixed(2)}€
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Articles commandés :</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name || 'Article'}</span>
                        <span>{(item.price * item.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => downloadInvoice(order.id)}
                    className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Facture
                  </button>
                  
                  {order.status === 'pending' && (
                    <button className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 font-medium">
                      <X className="w-4 h-4 mr-1" />
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientReservationsPage() {
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
      console.error('Error fetching reservations:', error);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mes Réservations</h1>
          <button
            onClick={() => setShowReservationForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Réservation
          </button>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aucune réservation
            </h3>
            <p className="text-gray-500 mb-6">
              Vous n'avez pas encore de réservation
            </p>
            <button
              onClick={() => setShowReservationForm(true)}
              className="btn-primary"
            >
              Réserver une Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map(reservation => {
              const table = tables.find(t => t.id === reservation.table_id);
              return (
                <div key={reservation.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Table {table?.number || 'N/A'}
                    </h3>
                    <StatusBadge status={reservation.status} />
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(reservation.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(reservation.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {reservation.guests} personne{reservation.guests > 1 ? 's' : ''}
                    </div>
                  </div>

                  {reservation.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t">
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Annuler la réservation
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
}

function ReservationForm({ tables, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    table_id: '',
    date: '',
    time: '',
    guests: 2
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      await api.post('/api/reservations', {
        table_id: formData.table_id,
        date: dateTime.toISOString(),
        guests: parseInt(formData.guests)
      });

      onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const availableTables = tables.filter(table => table.status === 'available');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Nouvelle Réservation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table
            </label>
            <select
              value={formData.table_id}
              onChange={(e) => setFormData(prev => ({ ...prev, table_id: e.target.value }))}
              className="form-control"
              required
            >
              <option value="">Sélectionner une table</option>
              {availableTables.map(table => (
                <option key={table.id} value={table.id}>
                  Table {table.number} ({table.seats} places)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="form-control"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className="form-control"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de personnes
            </label>
            <input
              type="number"
              value={formData.guests}
              onChange={(e) => setFormData(prev => ({ ...prev, guests: e.target.value }))}
              className="form-control"
              min="1"
              max="10"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Réservation...
                </div>
              ) : (
                'Réserver'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Payment Modal Component
function PaymentModal({ total, cartItems, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

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

      // Create payment intent
      const paymentData = {
        amount: total,
        currency: 'eur',
        payment_method: paymentMethod,
        order_id: order.id
      };

      const paymentResponse = await api.post('/api/payments/create-intent', paymentData);

      if (paymentMethod === 'card') {
        // In a real app, you would integrate with Stripe Elements here
        alert('Redirection vers le paiement sécurisé Stripe...');
        onSuccess();
      } else {
        // Cash payment
        alert('Commande créée ! Paiement en espèces à effectuer au restaurant.');
        onSuccess();
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Paiement</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Résumé de la commande</h3>
          <div className="space-y-2 text-sm">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{(item.price * item.quantity).toFixed(2)}€</span>
              </div>
            ))}
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">Mode de paiement</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <CreditCard className="w-5 h-5 mr-2" />
              Carte bancaire
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-3"
              />
              <DollarSign className="w-5 h-5 mr-2" />
              Espèces (au restaurant)
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Annuler
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Traitement...
              </div>
            ) : (
              `Payer ${total.toFixed(2)}€`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Admin Components
function AdminSidebar({ activeSection, setActiveSection }) {
  const { logout } = useContext(AuthContext);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag },
    { id: 'menu', label: 'Menu', icon: Utensils },
    { id: 'tables', label: 'Tables', icon: Package },
    { id: 'inventory', label: 'Inventaire', icon: Package },
    { id: 'users', label: 'Utilisateurs', icon: Users },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Utensils className="w-8 h-8 text-orange-600 mr-2" />
          <span className="text-xl font-bold text-gray-800">Admin Panel</span>
        </div>
      </div>

      <nav className="p-4">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`nav-item w-full text-left ${
                activeSection === item.id ? 'nav-item-active' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3 inline" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={logout}
          className="nav-item w-full text-left text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3 inline" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="dashboard-label">Commandes totales</div>
          <div className="dashboard-stat">{stats.total_orders}</div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-label">Utilisateurs</div>
          <div className="dashboard-stat">{stats.total_users}</div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-label">Chiffre d'affaires</div>
          <div className="dashboard-stat">{stats.total_revenue.toFixed(2)}€</div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-label">Commandes aujourd'hui</div>
          <div className="dashboard-stat">{stats.today_orders}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              <Plus className="w-4 h-4 mr-2 inline" />
              Ajouter un plat au menu
            </button>
            <button className="w-full btn-secondary text-left">
              <Download className="w-4 h-4 mr-2 inline" />
              Télécharger le rapport journalier
            </button>
            <button className="w-full btn-secondary text-left">
              <TrendingUp className="w-4 h-4 mr-2 inline" />
              Voir les analytics IA
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Alertes système</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <span className="text-sm text-yellow-800">
                Stock faible pour 3 articles
              </span>
            </div>
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-sm text-green-800">
                Système IA opérationnel
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
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
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status?status=${status}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Commandes</h1>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-control w-auto"
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
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="font-medium">#{order.id.slice(0, 8)}</span>
                  </td>
                  <td>{order.user_name || 'Client'}</td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="font-semibold">{order.total.toFixed(2)}€</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Confirmer
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="text-orange-600 hover:text-orange-700 text-sm"
                        >
                          Préparer
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Prêt
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="text-gray-600 hover:text-gray-700 text-sm"
                        >
                          Livré
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-700 text-sm">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminMenu() {
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
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMenuItem = async (itemId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await api.delete(`/api/menu/${itemId}`);
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion du Menu</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un plat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                <StatusBadge status={item.available ? 'available' : 'unavailable'} />
              </div>
              <p className="text-gray-600 text-sm mb-3">{item.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-bold text-orange-600">
                  {item.price.toFixed(2)}€
                </span>
                <span className="text-sm text-gray-500">{item.category}</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setShowForm(true);
                  }}
                  className="flex-1 btn-secondary text-sm"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => deleteMenuItem(item.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
}

function MenuItemForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || 'Plats',
    image_url: item?.image_url || '',
    available: item?.available ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (item) {
        await api.put(`/api/menu/${item.id}`, data);
      } else {
        await api.post('/api/menu', data);
      }

      onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {item ? 'Modifier le plat' : 'Ajouter un plat'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du plat
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="form-control"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="form-control"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="form-control"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="form-control"
              required
            >
              <option value="Entrées">Entrées</option>
              <option value="Plats">Plats</option>
              <option value="Desserts">Desserts</option>
              <option value="Boissons">Boissons</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de l'image
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="form-control"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Disponible</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Sauvegarde...
                </div>
              ) : (
                item ? 'Modifier' : 'Ajouter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminTables() {
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
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (tableId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) {
      try {
        await api.delete(`/api/tables/${tableId}`);
        fetchTables();
      } catch (error) {
        console.error('Error deleting table:', error);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Tables</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Table {table.number}
              </h3>
              <StatusBadge status={table.status} />
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {table.seats} places
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingTable(table);
                  setShowForm(true);
                }}
                className="flex-1 btn-secondary text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button
                onClick={() => deleteTable(table.id)}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

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
}

function TableForm({ table, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    number: table?.number || '',
    seats: table?.seats || 2,
    status: table?.status || 'available'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        number: parseInt(formData.number),
        seats: parseInt(formData.seats)
      };

      if (table) {
        await api.put(`/api/tables/${table.id}`, data);
      } else {
        await api.post('/api/tables', { ...data, id: crypto.randomUUID() });
      }

      onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {table ? 'Modifier la table' : 'Ajouter une table'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de table
            </label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              className="form-control"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de places
            </label>
            <input
              type="number"
              value={formData.seats}
              onChange={(e) => setFormData(prev => ({ ...prev, seats: e.target.value }))}
              className="form-control"
              min="1"
              max="12"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="form-control"
              required
            >
              <option value="available">Disponible</option>
              <option value="occupied">Occupée</option>
              <option value="reserved">Réservée</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Sauvegarde...
                </div>
              ) : (
                table ? 'Modifier' : 'Ajouter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/api/inventory/alerts');
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Gestion de l'Inventaire</h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Alertes Stock</h2>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <span className="text-sm text-yellow-800">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Catégorie</th>
                <th>Stock Actuel</th>
                <th>Stock Min</th>
                <th>Stock Max</th>
                <th>Unité</th>
                <th>Coût/Unité</th>
                <th>Fournisseur</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`font-semibold ${
                      item.current_stock <= item.min_stock_level 
                        ? 'text-red-600' 
                        : item.current_stock <= item.min_stock_level * 1.5
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {item.current_stock}
                    </span>
                  </td>
                  <td>{item.min_stock_level}</td>
                  <td>{item.max_stock_level}</td>
                  <td>{item.unit}</td>
                  <td>{item.cost_per_unit.toFixed(2)}€</td>
                  <td>{item.supplier}</td>
                  <td>
                    {item.current_stock <= item.min_stock_level ? (
                      <StatusBadge status="cancelled" />
                    ) : item.current_stock <= item.min_stock_level * 1.5 ? (
                      <StatusBadge status="pending" />
                    ) : (
                      <StatusBadge status="available" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { user, loading } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('home');
  const [adminSection, setAdminSection] = useState('dashboard');

  useEffect(() => {
    // Handle navigation based on hash
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Admin Interface
  if (user.role === 'admin') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar activeSection={adminSection} setActiveSection={setAdminSection} />
        <div className="flex-1">
          {adminSection === 'dashboard' && <AdminDashboard />}
          {adminSection === 'orders' && <AdminOrders />}
          {adminSection === 'menu' && <AdminMenu />}
          {adminSection === 'tables' && <AdminTables />}
          {adminSection === 'inventory' && <AdminInventory />}
        </div>
      </div>
    );
  }

  // Client Interface
  const renderClientPage = () => {
    switch (currentPage) {
      case 'menu':
        return <MenuPage />;
      case 'cart':
        return <CartPage />;
      case 'orders':
        return <ClientOrdersPage />;
      case 'reservations':
        return <ClientReservationsPage />;
      default:
        return <ClientHomePage />;
    }
  };

  return renderClientPage();
}

// Root App with Providers
function AppWithProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  );
}

export default AppWithProviders;