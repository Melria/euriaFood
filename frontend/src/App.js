import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for auth
const AuthContext = React.createContext();

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Erreur de connexion' };
    }
  };

  const register = async (name, email, password) => {
    try {
      await axios.post(`${API}/auth/register`, { name, email, password, role: 'client' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Erreur d\'inscription' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          <AuthScreen />
        ) : user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <ClientInterface />
        )}
      </div>
    </AuthContext.Provider>
  );
}

// Auth Screen Component
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setMessage(result.error);
        }
      } else {
        const result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
          setMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
          setIsLogin(true);
          setFormData({ name: '', email: '', password: '' });
        } else {
          setMessage(result.error);
        }
      }
    } catch (error) {
      setMessage('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-600">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ Restaurant</h1>
          <p className="text-gray-600">Système de gestion intelligent</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Traitement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('réussie') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 hover:text-orange-700 text-sm"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Compte admin de test: admin@restaurant.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const { user, logout } = React.useContext(AuthContext);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsRes, ordersRes, menuRes, reservationsRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/menu`),
        axios.get(`${API}/reservations`)
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setMenuItems(menuRes.data);
      setReservations(reservationsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      loadAdminData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🍽️ Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Bienvenue, {user.name}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-white shadow-sm h-screen">
          <div className="p-4">
            {[
              { key: 'dashboard', label: '📊 Tableau de bord', icon: '📊' },
              { key: 'orders', label: '📋 Commandes', icon: '📋' },
              { key: 'menu', label: '🍽️ Menu', icon: '🍽️' },
              { key: 'reservations', label: '📅 Réservations', icon: '📅' },
              { key: 'ai-insights', label: '🤖 IA Insights', icon: '🤖' },
              { key: 'ai-inventory', label: '📦 IA Stock', icon: '📦' },
              { key: 'ai-pricing', label: '💎 IA Prix', icon: '💎' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.key
                    ? 'bg-orange-100 text-orange-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Commandes totales</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.total_orders || 0}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Clients</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.total_users || 0}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Chiffre d'affaires</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.total_revenue || 0}FCFA</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Commandes aujourd'hui</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.today_orders || 0}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <span className="text-2xl">📈</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section IA */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">🤖 Intelligence Artificielle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('ai-insights')}
                    className="bg-white bg-opacity-20 text-white p-4 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-medium">Insights IA</div>
                    <div className="text-sm opacity-90">Analytics intelligents</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('ai-inventory')}
                    className="bg-white bg-opacity-20 text-white p-4 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <div className="font-medium">Prédiction Stock</div>
                    <div className="text-sm opacity-90">Gestion intelligente</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('ai-pricing')}
                    className="bg-white bg-opacity-20 text-white p-4 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <div className="text-2xl mb-2">💎</div>
                    <div className="font-medium">Optimisation Prix</div>
                    <div className="text-sm opacity-90">Prix intelligents</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nouvelles sections IA */}
          {activeTab === 'ai-insights' && <AIInsightsSection />}
          {activeTab === 'ai-inventory' && <AIInventorySection />}
          {activeTab === 'ai-pricing' && <AIPricingSection />}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Gestion des Commandes</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">ID</th>
                        <th className="text-left py-3 px-4">Total</th>
                        <th className="text-left py-3 px-4">Statut</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3 px-4">{order.id.slice(0, 8)}</td>
                          <td className="py-3 px-4">{order.total}FCFA</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'ready' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="px-2 py-1 border rounded text-sm"
                            >
                              <option value="pending">En attente</option>
                              <option value="confirmed">Confirmée</option>
                              <option value="preparing">Préparation</option>
                              <option value="ready">Prête</option>
                              <option value="delivered">Livrée</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Gestion du Menu</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-orange-600">{item.price}FCFA</span>
                        <span className="text-sm text-gray-500">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Gestion des Réservations</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">ID</th>
                        <th className="text-left py-3 px-4">Table</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Invités</th>
                        <th className="text-left py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((reservation) => (
                        <tr key={reservation.id} className="border-b">
                          <td className="py-3 px-4">{reservation.id.slice(0, 8)}</td>
                          <td className="py-3 px-4">{reservation.table_id}</td>
                          <td className="py-3 px-4">
                            {new Date(reservation.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{reservation.guests}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// AI Components
function AIInsightsSection() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/ai/insights`);
      setInsights(response.data.insights);
    } catch (error) {
      console.error('Erreur insights IA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">🧠 Insights Business IA</h2>
          <button
            onClick={loadInsights}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>
      </div>
      <div className="p-6">
        {insights ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4">📊 Insights Clés</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.insights?.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">📈</span>
                      <h4 className="font-bold">{insight.category}</h4>
                      <span className={`ml-auto px-2 py-1 rounded text-xs ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.impact}
                      </span>
                    </div>
                    <p className="text-gray-600">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">💡 Recommandations IA</h3>
              <div className="space-y-3">
                {insights.recommendations?.map((rec, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-lg mr-3">💡</span>
                      <p className="text-blue-800">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">🎯 Actions Prioritaires</h3>
              <div className="space-y-2">
                {insights.priority_actions?.map((action, index) => (
                  <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-800 font-medium">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧠</div>
            <p className="text-gray-600 mb-4">Analyse IA des performances business</p>
            <p className="text-sm text-gray-500">Cliquez sur "Analyser" pour obtenir des insights intelligents</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AIInventorySection() {
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/inventory/forecast`, {
        days_ahead: 7,
        include_external_factors: true
      });
      setForecast(response.data.forecast);
    } catch (error) {
      console.error('Erreur prédiction stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await axios.get(`${API}/inventory/alerts`);
      setAlerts(response.data.alerts);
    } catch (error) {
      console.error('Erreur alertes stock:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">📦 Gestion Stock IA</h2>
            <button
              onClick={loadForecast}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Prédiction...' : 'Prédire Demande'}
            </button>
          </div>
        </div>
        <div className="p-6">
          {forecast ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">📈 Prédictions 7 jours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forecast.predictions?.map((pred, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-bold mb-2">{pred.item_name}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Demande prédite:</span>
                          <span className="font-bold">{pred.predicted_demand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confiance:</span>
                          <span className={`font-bold ${
                            pred.confidence > 0.8 ? 'text-green-600' :
                            pred.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {Math.round(pred.confidence * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tendance:</span>
                          <span className={`font-bold ${
                            pred.trend === 'croissant' ? 'text-green-600' :
                            pred.trend === 'stable' ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {pred.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {forecast.alerts && (
                <div>
                  <h3 className="text-lg font-bold mb-4">⚠️ Alertes IA</h3>
                  <div className="space-y-2">
                    {forecast.alerts.map((alert, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800">{alert}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 mb-4">Prédiction intelligente des stocks</p>
              <p className="text-sm text-gray-500">Utilise l'IA pour prédire la demande future</p>
            </div>
          )}
        </div>
      </div>

      {/* Alertes Stock */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">🚨 Alertes Stock Actuelles</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`border rounded-lg p-4 ${
                  alert.priority === 'high' ? 'border-red-300 bg-red-50' :
                  alert.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                  'border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AIPricingSection() {
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);

  const optimizePricing = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/pricing/optimize`);
      setOptimization(response.data.optimization);
    } catch (error) {
      console.error('Erreur optimisation prix:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">💎 Optimisation Prix IA</h2>
          <button
            onClick={optimizePricing}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Optimisation...' : 'Optimiser Prix'}
          </button>
        </div>
      </div>
      <div className="p-6">
        {optimization ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4">💰 Prix Optimisés</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optimization.optimized_prices?.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-bold mb-3">{item.item_name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Prix actuel:</span>
                        <span className="text-gray-600">{item.current_price}FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prix optimisé:</span>
                        <span className="font-bold text-green-600">{item.optimized_price}FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Changement:</span>
                        <span className={`font-bold ${
                          item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">{item.reasoning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-blue-800 mb-2">🎯 Raisonnement IA</h4>
              <p className="text-blue-700">{optimization.reasoning}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-bold text-green-800 mb-2">📈 Impact Attendu</h4>
              <p className="text-green-700">{optimization.expected_impact}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💎</div>
            <p className="text-gray-600 mb-4">Optimisation intelligente des prix</p>
            <p className="text-sm text-gray-500">L'IA analyse le marché et optimise vos prix pour maximiser les profits</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Client Interface Component
function ClientInterface() {
  const [activeTab, setActiveTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    table_id: '',
    date: '',
    guests: 1
  });
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const { user, logout } = React.useContext(AuthContext);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const [menuRes, ordersRes, reservationsRes, tablesRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/menu`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/reservations`),
        axios.get(`${API}/tables`),
        axios.get(`${API}/menu/categories`)
      ]);

      setMenuItems(menuRes.data);
      setOrders(ordersRes.data);
      setReservations(reservationsRes.data);
      setTables(tablesRes.data);
      setCategories(['all', ...categoriesRes.data.categories]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const loadAIRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const response = await axios.post(`${API}/ai/recommendations`, {
        user_id: user.id,
        preferences: {
          dietary_restrictions: [],
          cuisine_preferences: [],
          price_range: 'medium'
        }
      });
      setAiRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Erreur recommandations IA:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    try {
      const orderItems = cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      await axios.post(`${API}/orders`, {
        items: orderItems,
        total: getCartTotal()
      });

      setCart([]);
      loadClientData();
      alert('Commande passée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Erreur lors de la commande');
    }
  };

  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReservation(true);

    try {
      if (!reservationForm.table_id || !reservationForm.date || !reservationForm.guests) {
        alert('Veuillez remplir tous les champs');
        setSubmittingReservation(false);
        return;
      }

      await axios.post(`${API}/reservations`, {
        table_id: reservationForm.table_id,
        date: reservationForm.date,
        guests: parseInt(reservationForm.guests),
        user_id: user.id
      });

      // Reset form
      setReservationForm({
        table_id: '',
        date: '',
        guests: 1
      });

      // Reload data
      loadClientData();
      alert('Réservation effectuée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      alert('Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
      setSubmittingReservation(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await axios.delete(`${API}/reservations/${reservationId}`);
      loadClientData();
      alert('Réservation annulée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      alert('Erreur lors de l\'annulation de la réservation.');
    }
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🍽️ Restaurant Client</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Bienvenue, {user.name}</span>
            <div className="relative">
              <button
                onClick={() => setActiveTab('cart')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                🛒 Panier ({cart.length})
              </button>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 bg-white shadow-sm h-screen">
          <div className="p-4">
            {[
              { key: 'menu', label: '🍽️ Menu', icon: '🍽️' },
              { key: 'cart', label: '🛒 Panier', icon: '🛒' },
              { key: 'orders', label: '📋 Mes Commandes', icon: '📋' },
              { key: 'reservations', label: '📅 Réservations', icon: '📅' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors ${
                  activeTab === tab.key
                    ? 'bg-orange-100 text-orange-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-6">
          {activeTab === 'menu' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Notre Menu</h2>
                
                {/* Recommandations IA */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div className="text-white">
                      <h3 className="text-lg font-bold mb-1">🤖 Recommandations IA pour vous</h3>
                      <p className="text-sm opacity-90">Sélections personnalisées basées sur vos goûts</p>
                    </div>
                    <button
                      onClick={loadAIRecommendations}
                      disabled={loadingRecommendations}
                      className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      {loadingRecommendations ? 'Analyse...' : 'Obtenir Recommandations'}
                    </button>
                  </div>
                  
                  {aiRecommendations && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiRecommendations.recommended_items?.map((item, index) => (
                        <div key={index} className="bg-white bg-opacity-20 rounded-lg p-3">
                          <h4 className="text-white font-bold">{item.name}</h4>
                          <p className="text-white text-sm opacity-90">{item.reason}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-white text-xs">
                              Confiance: {Math.round(item.confidence_score * 100)}%
                            </span>
                            <button 
                              onClick={() => {
                                const menuItem = menuItems.find(m => m.name === item.name);
                                if (menuItem) addToCart(menuItem);
                              }}
                              className="bg-white text-purple-600 px-3 py-1 rounded text-xs font-medium"
                            >
                              Ajouter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {aiRecommendations && aiRecommendations.insights && (
                    <div className="mt-3 text-white text-sm opacity-90">
                      💡 {aiRecommendations.insights}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg capitalize transition-colors ${
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-orange-600">{item.price}FCFA</span>
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
            </div>
          )}

          {activeTab === 'cart' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mon Panier</h2>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Votre panier est vide</p>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="mt-4 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Voir le Menu
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-b py-4">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-bold">{item.name}</h3>
                            <p className="text-gray-600">{item.price}FCFA</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold">Total: {getCartTotal().toFixed(2)}FCFA</span>
                      </div>
                      <button
                        onClick={placeOrder}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Passer la commande
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Commandes</h2>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Commande #{order.id.slice(0, 8)}</h3>
                        <p className="text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                          order.status === 'ready' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-xl font-bold mt-2">{order.total}FCFA</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x Article</span>
                          <span>{item.price}FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Réservations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-lg mb-4">Nouvelle Réservation</h3>
                  <form onSubmit={handleReservationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                      <select 
                        value={reservationForm.table_id}
                        onChange={(e) => setReservationForm({ ...reservationForm, table_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="">Sélectionner une table</option>
                        {tables.filter(table => table.status === 'available').map((table) => (
                          <option key={table.id} value={table.id}>
                            Table {table.number} ({table.seats} places)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date et heure</label>
                      <input
                        type="datetime-local"
                        value={reservationForm.date}
                        onChange={(e) => setReservationForm({ ...reservationForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'invités</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={reservationForm.guests}
                        onChange={(e) => setReservationForm({ ...reservationForm, guests: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReservation}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {submittingReservation ? 'Réservation en cours...' : 'Réserver'}
                    </button>
                  </form>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-lg mb-4">Réservations Existantes</h3>
                  <div className="space-y-3">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Table {reservation.table_id}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(reservation.date).toLocaleDateString()} à {new Date(reservation.date).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {reservation.guests} invité{reservation.guests > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {reservation.status === 'pending' ? 'En attente' :
                               reservation.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                            </span>
                            {reservation.status !== 'cancelled' && (
                              <button
                                onClick={() => cancelReservation(reservation.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {reservations.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <p>Aucune réservation trouvée</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;