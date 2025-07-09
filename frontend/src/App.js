import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import toast, { Toaster } from 'react-hot-toast';
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
  Trash2,
  Eye,
  BarChart3,
  Users,
  Package,
  Calendar,
  Bell,
  Heart,
  X
} from 'lucide-react';
import './App.css';

// Configuration Stripe
const stripePromise = loadStripe('pk_test_51234567890abcdef'); // Remplacer par votre clé publique

// Configuration API
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Context pour l'authentification
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// Context pour le panier
const CartContext = createContext();
const useCart = () => useContext(CartContext);

// Composant d'authentification
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
      const response = await api.post('/auth/login', { email, password });
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
      await api.post('/auth/register', { name, email, password, role });
      toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    } catch (error) {
      toast.error('Erreur lors de l\'inscription');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Composant pour le panier
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
    toast.success('Article ajouté au panier');
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

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Composant de connexion
function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userData = await login(formData.email, formData.password);
        navigate(userData.role === 'admin' ? '/admin' : '/menu');
      } else {
        await register(formData.name, formData.email, formData.password);
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="min-h-screen auth-container flex items-center justify-center p-4">
      <div className="auth-form">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nom complet"
              className="auth-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Mot de passe"
            className="auth-input"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          
          <button type="submit" className="auth-button">
            {isLogin ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </form>
        
        <p className="text-center mt-4">
          {isLogin ? 'Pas de compte ?' : 'Déjà un compte ?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 ml-2 hover:underline"
          >
            {isLogin ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </p>
        
        {isLogin && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <p><strong>Compte admin :</strong></p>
            <p>Email: admin@restaurant.com</p>
            <p>Mot de passe: admin123</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Header
function Header() {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  return (
    <header className="client-header">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={user?.role === 'admin' ? '/admin' : '/menu'} className="text-2xl font-bold text-orange-600">
          🍽️ Restaurant IA
        </Link>
        
        <div className="flex items-center space-x-4">
          {user?.role !== 'admin' && (
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-600 hover:text-orange-600"
            >
              <ShoppingCart size={24} />
              {cartItems.length > 0 && (
                <span className="cart-badge">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            <User size={20} />
            <span>{user?.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-red-600"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

// Composant Menu Client
function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await api.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/menu/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Notre Menu</h1>
      
      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg ${
            !selectedCategory ? 'menu-category-active' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Tous
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category ? 'menu-category-active' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Grille des articles */}
      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="menu-item-card">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  {item.price.toFixed(2)} €
                </span>
                <button
                  onClick={() => addToCart(item)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant Panier
function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setShowPayment(true);
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-8">Votre Panier</h1>
        <p className="text-gray-600 mb-8">Votre panier est vide</p>
        <button
          onClick={() => navigate('/menu')}
          className="btn-primary"
        >
          Voir le menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Votre Panier</h1>
      
      <div className="bg-white rounded-lg shadow-sm">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <div className="flex items-center space-x-4">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">{item.price.toFixed(2)} €</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <span className="font-semibold">
                {(item.price * item.quantity).toFixed(2)} €
              </span>
              
              <button
                onClick={() => removeFromCart(item.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">Total: {getTotal().toFixed(2)} €</span>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={clearCart}
              className="btn-secondary"
            >
              Vider le panier
            </button>
            <button
              onClick={handleCheckout}
              className="btn-primary flex-1"
            >
              Passer commande
            </button>
          </div>
        </div>
      </div>
      
      {showPayment && (
        <PaymentModal
          total={getTotal()}
          cartItems={cartItems}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            clearCart();
            navigate('/orders');
          }}
        />
      )}
    </div>
  );
}

// Composant Modal de Paiement
function PaymentModal({ total, cartItems, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Créer la commande
      const orderData = {
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total: total
      };
      
      const orderResponse = await api.post('/orders', orderData);
      const order = orderResponse.data;
      
      // Créer le paiement
      const paymentData = {
        amount: total,
        currency: 'eur',
        payment_method: paymentMethod,
        order_id: order.id
      };
      
      const paymentResponse = await api.post('/payments/create-intent', paymentData);
      
      if (paymentMethod === 'card') {
        // Rediriger vers Stripe (simulation)
        toast.success('Redirection vers le paiement sécurisé...');
        setTimeout(() => {
          toast.success('Paiement réussi !');
          onSuccess();
        }, 2000);
      } else {
        toast.success('Commande créée ! Paiement en espèces à effectuer.');
        onSuccess();
      }
      
    } catch (error) {
      toast.error('Erreur lors du paiement');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Paiement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-lg font-semibold">Total: {total.toFixed(2)} €</p>
        </div>
        
        <div className="mb-6">
          <p className="font-medium mb-3">Mode de paiement:</p>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-orange-600"
              />
              <CreditCard size={20} />
              <span>Carte bancaire</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-orange-600"
              />
              <Banknote size={20} />
              <span>Espèces</span>
            </label>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handlePayment}
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Traitement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Dashboard Admin
function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const downloadDailyReport = async () => {
    try {
      const response = await api.get('/reports/daily', {
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
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Administrateur</h1>
        <button
          onClick={downloadDailyReport}
          className="btn-primary flex items-center space-x-2"
        >
          <Download size={16} />
          <span>Rapport journalier</span>
        </button>
      </div>
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="dashboard-label">Commandes totales</div>
          <div className="dashboard-stat">{stats.total_orders || 0}</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-label">Clients</div>
          <div className="dashboard-stat">{stats.total_users || 0}</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-label">Chiffre d'affaires</div>
          <div className="dashboard-stat">{(stats.total_revenue || 0).toFixed(2)} €</div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-label">Commandes aujourd'hui</div>
          <div className="dashboard-stat">{stats.today_orders || 0}</div>
        </div>
      </div>
      
      {/* Navigation rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/admin/orders" className="dashboard-card hover:shadow-lg">
          <div className="flex items-center space-x-4">
            <BarChart3 size={32} className="text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold">Gestion des Commandes</h3>
              <p className="text-gray-600">Suivi et mise à jour des commandes</p>
            </div>
          </div>
        </Link>
        
        <Link to="/admin/menu" className="dashboard-card hover:shadow-lg">
          <div className="flex items-center space-x-4">
            <Package size={32} className="text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold">Gestion du Menu</h3>
              <p className="text-gray-600">Ajouter, modifier, supprimer des articles</p>
            </div>
          </div>
        </Link>
        
        <Link to="/admin/tables" className="dashboard-card hover:shadow-lg">
          <div className="flex items-center space-x-4">
            <Calendar size={32} className="text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold">Gestion des Tables</h3>
              <p className="text-gray-600">Configuration des tables et réservations</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Composant Gestion des Commandes Admin
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status?status=${status}`);
      toast.success('Statut mis à jour');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
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
      toast.error('Erreur lors du téléchargement');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      preparing: 'badge-preparing',
      ready: 'badge-ready',
      delivered: 'badge-delivered'
    };
    return `badge ${badges[status] || 'badge-pending'}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestion des Commandes</h1>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id.slice(0, 8)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>{order.user_id}</td>
                  <td>{order.total.toFixed(2)} €</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="preparing">En préparation</option>
                        <option value="ready">Prête</option>
                        <option value="delivered">Livrée</option>
                      </select>
                      <button
                        onClick={() => downloadInvoice(order.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Télécharger facture"
                      >
                        <Download size={16} />
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

// Composant Gestion du Menu Admin
function AdminMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await api.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }
    
    try {
      await api.delete(`/menu/${itemId}`);
      toast.success('Article supprimé');
      fetchMenu();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion du Menu</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Ajouter un article</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className="food-card">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-2">{item.description}</p>
              <p className="text-sm text-gray-500 mb-4">Catégorie: {item.category}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">
                  {item.price.toFixed(2)} €
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
            fetchMenu();
          }}
        />
      )}
    </div>
  );
}

// Composant Formulaire Article Menu
function MenuItemForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || '',
    image_url: item?.image_url || '',
    available: item?.available ?? true
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
        await api.put(`/menu/${item.id}`, data);
        toast.success('Article mis à jour');
      } else {
        await api.post('/menu', data);
        toast.success('Article ajouté');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {item ? 'Modifier l\'article' : 'Ajouter un article'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Prix (€)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <select
              className="form-control"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Entrées">Entrées</option>
              <option value="Plats">Plats</option>
              <option value="Desserts">Desserts</option>
              <option value="Boissons">Boissons</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">URL de l'image</label>
            <input
              type="url"
              className="form-control"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({...formData, available: e.target.checked})}
              />
              <span>Disponible</span>
            </label>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant principal de l'application
function App() {
  return (
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="App">
              <Toaster position="top-right" />
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/" element={<ProtectedRoute><Navigate to="/menu" /></ProtectedRoute>} />
                }
                <Route path="/menu" element={<ProtectedRoute><Header /><MenuPage /></ProtectedRoute>} />
                }
                <Route path="/cart" element={<ProtectedRoute><Header /><CartPage /></ProtectedRoute>} />
                }
                <Route path="/admin" element={<AdminRoute><Header /><AdminDashboard /></AdminRoute>} />
                }
                <Route path="/admin/orders" element={<AdminRoute><Header /><AdminOrders /></AdminRoute>} />
                }
                <Route path="/admin/menu" element={<AdminRoute><Header /><AdminMenu /></AdminRoute>} />
                }
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </Elements>
  );
}

// Composant de protection des routes
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

// Composant de protection des routes admin
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner w-12 h-12"></div>
      </div>
    );
  }
  
  return user && user.role === 'admin' ? children : <Navigate to="/login" />;
}

export default App;