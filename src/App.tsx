import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Star, ArrowRight, Calendar, Mail, Settings, HelpCircle, LayoutDashboard, LogIn, UserPlus, Globe, Share2, LogOut, User as UserIcon, Instagram, Youtube, Video, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { bookingService } from './services/api';

// --- Auth Context ---

interface User {
  id: string;
  name: string;
  email: string;
  role: 'artist' | 'organizer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Protected Route ---

const ProtectedRoute: React.FC<{ children: React.ReactNode, role?: 'artist' | 'organizer' }> = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      navigate('/login');
    } else if (role && user && user.role !== role) {
      navigate('/');
    }
  }, [isAuthenticated, user, role, navigate]);

  if (!isAuthenticated) return null;
  if (role && user && user.role !== role) return null;

  return <>{children}</>;
};

// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 h-20 px-6 md:px-12 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <Link to="/" className="text-2xl font-black text-indigo-950 tracking-tighter font-headline">
          Artist Connect
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/browse" 
            className={cn(
              "font-bold tracking-tight transition-colors",
              location.pathname === '/browse' ? "text-indigo-700 border-b-2 border-indigo-600 pb-1" : "text-slate-500 hover:text-indigo-600"
            )}
          >
            Browse Artist
          </Link>
          {isAuthenticated && user?.role === 'artist' && (
            <Link 
              to="/dashboard" 
              className={cn(
                "font-bold tracking-tight transition-colors",
                location.pathname === '/dashboard' ? "text-indigo-700 border-b-2 border-indigo-600 pb-1" : "text-slate-500 hover:text-indigo-600"
              )}
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-bold text-indigo-950 hidden sm:inline">{user?.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-600 font-medium hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="text-slate-600 font-medium hover:text-indigo-600 transition-colors">Login</Link>
            <Link to="/register" className="bg-indigo-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-800 transition-all shadow-md">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-slate-100 px-6 md:px-12 py-10 mt-20">
    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex flex-col gap-2">
        <span className="font-black text-indigo-950 text-xl">The Editorial Stage</span>
        <p className="text-[10px] uppercase tracking-widest text-slate-400">© 2026 The Artist Connect. All rights reserved.</p>
      </div>
      <div className="flex gap-8">
        {['About Us', 'Safety', 'Booking Terms', 'Privacy'].map((item) => (
          <a key={item} href="#" className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors">{item}</a>
        ))}
      </div>
      <div className="flex gap-4">
        <Globe className="w-5 h-5 text-slate-400 cursor-pointer hover:text-indigo-600" />
        <Share2 className="w-5 h-5 text-slate-400 cursor-pointer hover:text-indigo-600" />
      </div>
    </div>
  </footer>
);

// --- Pages ---

const LandingPage = () => {
  return (
    <div className="pt-32">
      {/* Hero */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-32">
        <div className="lg:col-span-7">
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-6">
            Premium Artist Network
          </span>
          <h1 className="text-6xl md:text-8xl font-black text-indigo-950 mb-8 tracking-tighter leading-[0.9] font-headline">
            Find your <br /> <span className="text-indigo-600">next star...</span>
          </h1>
          
          <div className="relative max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search singers, DJs, comedians..."
              className="w-full pl-14 pr-32 py-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all text-lg"
            />
            <button className="absolute right-2 top-2 bottom-2 px-8 bg-indigo-900 text-white rounded-lg font-bold hover:bg-indigo-800 transition-all">
              Search
            </button>
          </div>
          
          <div className="mt-12 flex gap-4 items-center">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/artist${i}/100/100`} 
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  alt="Artist"
                />
              ))}
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Join <span className="text-indigo-900 font-bold">2,500+</span> headliners already booking through The Editorial Stage.
            </p>
          </div>
        </div>
        
        <div className="lg:col-span-5 relative">
          <motion.div 
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 2 }}
            className="relative bg-indigo-100 rounded-[2rem] p-4 pb-0 overflow-hidden transform rotate-2"
          >
            <div className="absolute top-8 right-8 z-20">
              <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-indigo-900 font-bold text-xs shadow-xl">
                TONIGHT'S HEADLINER
              </span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-[500px] object-cover rounded-2xl transform -rotate-2"
              alt="Headliner"
            />
            <div className="p-8 transform -rotate-2">
              <h3 className="text-3xl font-black text-indigo-950 leading-none mb-1">Elena Volkov</h3>
              <p className="text-indigo-600 font-medium">Classical Fusion Cello</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-slate-50 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-[0.3em] mb-3 block font-bold">Curation</span>
              <h2 className="text-5xl font-black text-indigo-950 tracking-tighter font-headline">Top Categories</h2>
            </div>
            <Link to="/browse" className="group flex items-center gap-2 text-indigo-900 font-bold hover:gap-3 transition-all">
              View All <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
            <div className="md:col-span-4 relative rounded-2xl overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Singers" />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-white text-4xl font-black mb-2">Singers</h3>
                <p className="text-white/80 text-sm mb-4">Vocalists for every mood, from Jazz to Pop.</p>
                <span className="text-white font-bold text-xs uppercase tracking-widest border-b border-white/40 pb-1">Explore Talent</span>
              </div>
            </div>
            
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative rounded-2xl overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="DJs" />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-3xl font-black mb-1">DJs</h3>
                  <p className="text-white/80 text-sm">Energy-driven beats for festivals and events.</p>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Comedians" />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-3xl font-black mb-1">Comedians</h3>
                  <p className="text-white/80 text-sm">Laughter therapy for corporate or private shows.</p>
                </div>
              </div>
              <div className="md:col-span-2 bg-indigo-900 rounded-2xl p-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-white text-4xl font-black mb-4">Are you an artist?</h3>
                  <p className="text-white/70 max-w-md mb-8">Join the most exclusive booking platform and get discovered by top-tier event planners.</p>
                  <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors">
                    Start Performing
                  </button>
                </div>
                <Star className="w-64 h-64 text-white/5 absolute -right-10 -bottom-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-black text-indigo-950 tracking-tighter mb-4 font-headline">Featured Artists</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Hand-picked performers who are redefining the stage this month.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { id: '2', name: 'Marcus Thorne', category: 'Jazz & Soul Vocalist', price: 450, image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800' },
            { id: '3', name: 'SARA-L', category: 'Techno & House Specialist', price: 800, image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&q=80&w=800' },
            { id: '1', name: 'Elena Volkov', category: 'Classical Fusion Cello', price: 1200, image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800' }
          ].map((artist, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="group"
            >
              <Link to={`/artist/${artist.id}`}>
                <div className="relative mb-6 rounded-2xl overflow-hidden aspect-[4/5]">
                  <img src={artist.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={artist.name} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <button className="w-full py-3 bg-white/95 backdrop-blur font-bold text-indigo-900 rounded-xl shadow-2xl">
                      View Folio
                    </button>
                  </div>
                </div>
              </Link>
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/artist/${artist.id}`}>
                    <h4 className="text-2xl font-black text-indigo-950 hover:text-indigo-600 transition-colors">{artist.name}</h4>
                  </Link>
                  <p className="text-slate-500 text-sm font-medium">{artist.category}</p>
                </div>
                <div className="text-right">
                  <span className="block text-indigo-600 font-black text-xl">${artist.price}+</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">per session</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Events Hosted', value: '12k+' },
            { label: 'Verified Artists', value: '3.5k' },
            { label: 'Average Rating', value: '4.9/5' },
            { label: 'Support Response', value: '24h' }
          ].map((stat, i) => (
            <div key={i}>
              <span className="text-6xl font-black block mb-2 font-headline">{stat.value}</span>
              <span className="text-white/60 text-xs uppercase tracking-widest font-bold">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ArtistListingPage = () => {
  const [artists, setArtists] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch('/api/artists');
        const apiArtists = await response.json();
        
        // Load from localStorage
        const localArtistsStr = localStorage.getItem('local_artists');
        const localArtists = localArtistsStr ? JSON.parse(localArtistsStr) : [];
        
        // Merge and ensure unique IDs (simple approach)
        const merged = [...apiArtists, ...localArtists];
        setArtists(merged);
      } catch (error) {
        console.error('Error fetching artists:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  const filteredArtists = artists.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pt-32 px-6 md:px-12 max-w-[1440px] mx-auto">
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <span className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 block">Curated Talent</span>
          <h1 className="text-5xl md:text-7xl font-black text-indigo-950 tracking-tighter leading-none mb-6 font-headline">
            Discovery <br /> Collection
          </h1>
          <p className="text-lg text-slate-500 max-w-lg leading-relaxed">
            Connecting world-class visionaries with extraordinary stages. Find the perfect headliner for your next production.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-12 pr-6 py-3 bg-slate-100 border-none rounded-xl text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
          </div>
          <div className="bg-slate-100 px-4 py-3 rounded-xl flex items-center gap-3 w-full sm:w-auto">
            <Settings className="w-4 h-4 text-slate-400" />
            <select className="bg-transparent border-none focus:ring-0 text-sm font-bold text-indigo-950 appearance-none pr-8">
              <option>Featured First</option>
              <option>Highest Rated</option>
              <option>Price: Low to High</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-slate-50 rounded-2xl p-8 sticky top-28">
            <h2 className="text-xl font-black mb-8 text-indigo-900 font-headline">Refine Search</h2>
            
            <div className="mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Category</h3>
              <div className="space-y-3">
                {['Singer', 'DJ / Electronic', 'Jazz Ensemble', 'Spoken Word'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-600/20" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Daily Rate</h3>
              <input type="range" className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between mt-3">
                <span className="text-xs font-bold text-slate-400">$500</span>
                <span className="text-xs font-bold text-slate-400">$10,000+</span>
              </div>
            </div>

            <button className="w-full py-4 bg-indigo-900 text-white rounded-xl font-bold tracking-tight shadow-xl shadow-indigo-900/10 hover:translate-y-[-2px] transition-all">
              Apply Filters
            </button>
            <button className="w-full mt-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
              Reset All
            </button>
          </div>
        </aside>

        <div className="flex-grow">
          {loading ? (
            <div className="text-center py-20 font-bold text-indigo-900">Curating Talent...</div>
          ) : (
            <>
              {filteredArtists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-y-16 gap-x-8">
                  {filteredArtists.map((artist, i) => (
                    <div key={artist.id} className="group flex flex-col">
                      <div className="relative h-[480px] w-full overflow-hidden rounded-2xl bg-slate-100 mb-6">
                        <img 
                          src={artist.image} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt={artist.name} 
                        />
                        {i === 0 && searchQuery === '' && (
                          <div className="absolute top-6 left-6">
                            <span className="bg-indigo-900/90 backdrop-blur-md text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full">
                              Editorial Choice
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-black text-indigo-950 group-hover:text-indigo-600 transition-colors tracking-tighter font-headline">
                              {artist.name}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm">{artist.category}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                            <Star className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                            <span className="text-xs font-bold text-indigo-600">{artist.rating}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-lg font-black text-indigo-900">${artist.price}<span className="text-xs font-normal text-slate-400">/night</span></span>
                          <Link to={`/artist/${artist.id}`} className="bg-white border border-slate-200 text-indigo-950 text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-900 hover:text-white transition-all">
                            View Folio
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-xl font-bold text-indigo-950 mb-2">No artists found</p>
                  <p className="text-slate-500">Try adjusting your search or filters.</p>
                </div>
              )}
              
              <div className="mt-24 flex flex-col items-center gap-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {filteredArtists.length} of {artists.length} artists
                </p>
                <div className="w-full max-w-xs bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-500" 
                    style={{ width: `${(filteredArtists.length / artists.length) * 100}%` }}
                  />
                </div>
                {filteredArtists.length < artists.length && searchQuery === '' && (
                  <button className="px-12 py-5 bg-white border-2 border-indigo-900 text-indigo-900 font-black tracking-tight rounded-xl hover:bg-indigo-900 hover:text-white transition-all transform hover:scale-[1.02] mt-4">
                    Load More Talent
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ 
  bookings, 
  artistId, 
  readOnly = false, 
  compact = false,
  onDateSelect,
  selectedDate
}: { 
  bookings: any[], 
  artistId?: string, 
  readOnly?: boolean, 
  compact?: boolean,
  onDateSelect?: (date: string) => void,
  selectedDate?: string
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [blockedDates, setBlockedDates] = React.useState<string[]>([]);

  // Load availability from localStorage on mount or when artistId changes
  useEffect(() => {
    if (artistId) {
      const saved = localStorage.getItem(`availability_${artistId}`);
      if (saved) {
        setBlockedDates(JSON.parse(saved));
      } else {
        // Default mock data if none exists
        setBlockedDates(['2024-10-25', '2024-10-26']);
      }
    }
  }, [artistId]);

  // Save availability to localStorage whenever it changes (if not readOnly)
  useEffect(() => {
    if (artistId && !readOnly) {
      localStorage.setItem(`availability_${artistId}`, JSON.stringify(blockedDates));
    }
  }, [blockedDates, artistId, readOnly]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (dateStr: string, isBooked: boolean, isBlocked: boolean) => {
    if (isBooked || isBlocked) return;
    
    if (!readOnly) {
      if (blockedDates.includes(dateStr)) {
        setBlockedDates(blockedDates.filter(d => d !== dateStr));
      } else {
        setBlockedDates([...blockedDates, dateStr]);
      }
    }
    
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden", compact && "shadow-none border-slate-200")}>
      <div className={cn("p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30", compact && "p-4")}>
        <div>
          <h3 className={cn("text-2xl font-black text-indigo-900 font-headline tracking-tighter", compact && "text-lg")}>
            {monthNames[month]} {year}
          </h3>
          {!compact && <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
            {readOnly ? "Artist Availability" : "Manage your availability"}
          </p>}
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all">
            <X className="w-4 h-4 rotate-45" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg border border-slate-200 transition-all">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={cn("p-8", compact && "p-4")}>
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-slate-50 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className={cn("bg-white", compact ? "h-16" : "h-32")} />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isBooked = bookings.some(b => b.date === dateStr && b.status === 'Confirmed');
            const isBlocked = blockedDates.includes(dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div 
                key={day} 
                onClick={() => handleDateClick(dateStr, isBooked, isBlocked)}
                className={cn(
                  "bg-white p-3 border-t border-l border-slate-50 transition-all relative group",
                  compact ? "h-16" : "h-32",
                  !isBooked && !isBlocked ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-80",
                  isBooked ? "bg-indigo-50/50" : "",
                  isBlocked && "bg-red-50/30",
                  selectedDate === dateStr && "ring-2 ring-inset ring-indigo-600 bg-indigo-50/30"
                )}
              >
                <span className={cn(
                  "text-sm font-bold",
                  isToday ? "bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full" : 
                  selectedDate === dateStr ? "text-indigo-600" : "text-slate-400"
                )}>
                  {day}
                </span>

                {isBooked && (
                  <div className="mt-2">
                    <div className={cn(
                      "bg-indigo-600 text-white text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-md truncate shadow-sm",
                      compact && "px-1 py-0.5 text-[7px]"
                    )}>
                      Booked
                    </div>
                  </div>
                )}

                {isBlocked && (
                  <div className="mt-2">
                    <div className={cn(
                      "bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-md truncate",
                      compact && "px-1 py-0.5 text-[7px]"
                    )}>
                      Unavailable
                    </div>
                  </div>
                )}

                {!readOnly && !isBooked && !isBlocked && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Block</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={cn("mt-8 flex gap-6", compact && "mt-4 gap-4")}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-100" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border border-slate-200" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArtistDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await bookingService.getBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await bookingService.updateBookingStatus(id, status);
      fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-black text-indigo-900 tracking-tighter font-headline">Artist Portal</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Managing the Spotlight</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'schedule', icon: Calendar, label: 'Schedule' },
            { id: 'bookings', icon: Star, label: 'Bookings' },
            { id: 'inbox', icon: Mail, label: 'Inbox' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => (item.id === 'bookings' || item.id === 'schedule') && setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
                (item.id === activeTab) ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <item.icon className={cn("w-5 h-5", (item.id === activeTab) && "fill-indigo-700")} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="pt-6 border-t border-slate-100">
          <button className="w-full bg-indigo-900 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/10 hover:bg-indigo-800 transition-all mb-6">
            New Event
          </button>
          <div className="flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900">{user?.name}</p>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase">{user?.role} PORTAL</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Portfolio Overview</p>
            <h2 className="text-5xl font-black text-indigo-900 font-headline tracking-tighter">
              {activeTab === 'bookings' ? 'Booking Central' : 'Performance Schedule'}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 mb-1 font-medium">System Status</p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Live Dashboard
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-16">
          {[
            { label: 'Total Bookings', value: bookings.length, trend: `Confirmed: ${confirmedBookings.length}` },
            { label: 'Revenue', value: `$${confirmedBookings.length * 1200}`, trend: 'Estimated from confirmed', dark: true },
            { label: 'Artist Rating', value: '4.92', rating: true }
          ].map((stat, i) => (
            <div 
              key={i}
              className={cn(
                "p-8 rounded-xl shadow-sm relative overflow-hidden",
                stat.dark ? "bg-indigo-900 text-white" : "bg-white text-indigo-950"
              )}
            >
              <p className={cn("text-xs uppercase tracking-widest font-bold mb-4", stat.dark ? "text-indigo-200" : "text-slate-400")}>
                {stat.label}
              </p>
              <h3 className="text-4xl font-black font-headline">{stat.value}</h3>
              {stat.trend && <p className={cn("text-sm mt-2 font-medium", stat.dark ? "text-indigo-300" : "text-indigo-600")}>{stat.trend}</p>}
              {stat.rating && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3 h-3 fill-indigo-600 text-indigo-600" />)}
                </div>
              )}
            </div>
          ))}
        </div>

        {activeTab === 'bookings' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-indigo-900 font-headline">Incoming Booking Requests</h3>
              <button className="text-indigo-900 text-[10px] font-black uppercase tracking-widest hover:underline">View History</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-8 py-5 border-b border-slate-100">Organizer Name</th>
                  <th className="px-8 py-5 border-b border-slate-100">Event Date</th>
                  <th className="px-8 py-5 border-b border-slate-100">Status</th>
                  <th className="px-8 py-5 border-b border-slate-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center font-bold text-slate-400">Loading bookings...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center font-bold text-slate-400">No bookings yet.</td>
                  </tr>
                ) : (
                  bookings.map(booking => (
                    <tr key={booking.id || booking._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center font-bold text-indigo-900">
                            {booking.userName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-indigo-900">{booking.userName}</p>
                            <p className="text-xs text-slate-400">{booking.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-bold text-indigo-950">{booking.date}</p>
                        <p className="text-xs text-slate-400">{booking.time}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          booking.status === 'Confirmed' ? "bg-green-50 text-green-600" : 
                          booking.status === 'Pending' ? "bg-amber-50 text-amber-600" :
                          "bg-red-50 text-red-600"
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {booking.status === 'Pending' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStatusUpdate(booking.id || booking._id, 'Rejected')}
                              className="px-4 py-2 text-xs font-bold text-red-600 border border-red-100 rounded-md hover:bg-red-50"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(booking.id || booking._id, 'Confirmed')}
                              className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 rounded-md hover:bg-indigo-800"
                            >
                              Accept
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <CalendarView bookings={bookings} artistId={user?.id} />
        )}
      </main>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      login(data.user, data.token);
      navigate(data.user.role === 'artist' ? '/dashboard' : '/browse');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-40 pb-20 px-6 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-900/5"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-indigo-950 tracking-tighter font-headline mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-sm font-medium">Enter your credentials to access your stage.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={cn(
              "w-full py-4 bg-indigo-900 text-white rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 hover:bg-indigo-800 transition-all transform hover:scale-[1.01]",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register now</Link>
        </p>
      </motion.div>
    </div>
  );
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'artist',
    category: 'Singer', // Expertise
    price: '1200'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // If artist, save to localStorage for dynamic display in Browse
      if (formData.role === 'artist') {
        const newArtist = {
          id: data.user.id,
          userId: data.user.id,
          name: formData.name,
          category: formData.category,
          price: formData.price,
          rating: '5.0',
          image: `https://picsum.photos/seed/${formData.name.replace(/\s+/g, '')}/800/1000`,
          bio: `Professional ${formData.category} ready to elevate your event.`,
          portfolio: [
            `https://picsum.photos/seed/${formData.name}1/800/800`,
            `https://picsum.photos/seed/${formData.name}2/800/800`
          ],
          portfolioVideos: [],
          reviews: []
        };

        // Try to save to backend
        try {
          await fetch(`/api/artists/${data.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify(newArtist)
          });
        } catch (e) {
          console.error('Failed to save artist profile to backend:', e);
        }

        const existingLocal = JSON.parse(localStorage.getItem('local_artists') || '[]');
        localStorage.setItem('local_artists', JSON.stringify([...existingLocal, newArtist]));
      }
      
      login(data.user, data.token);
      navigate(data.user.role === 'artist' ? '/dashboard' : '/browse');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-40 pb-20 px-6 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-indigo-900/5"
      >
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-indigo-950 tracking-tighter font-headline mb-2">Join the Stage</h2>
          <p className="text-slate-500 text-sm font-medium">Create your account to start your journey.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">I am a...</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as any})}
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all appearance-none"
            >
              <option value="artist">Artist / Performer</option>
              <option value="organizer">Event Organizer</option>
            </select>
          </div>

          {formData.role === 'artist' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Expertise / Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all appearance-none"
                >
                  <option value="Singer">Singer</option>
                  <option value="DJ / Electronic">DJ / Electronic</option>
                  <option value="Jazz Ensemble">Jazz Ensemble</option>
                  <option value="Spoken Word">Spoken Word</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Daily Rate ($)</label>
                <input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:bg-white transition-all"
                  placeholder="1200"
                  required
                />
              </div>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={cn(
              "w-full py-4 bg-indigo-900 text-white rounded-xl font-bold tracking-tight shadow-lg shadow-indigo-900/10 hover:bg-indigo-800 transition-all transform hover:scale-[1.01] mt-4",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

const ArtistDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    location: '',
    message: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactData, setContactData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (user) {
      setContactData(prev => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
  }, [user]);

  const [isSending, setIsSending] = useState(false);
  const [contactStatus, setContactStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [artistBookings, setArtistBookings] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const { token: authToken } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      // Update artist profile with new media
      const updatedArtist = { ...artist };
      if (data.type === 'video') {
        updatedArtist.portfolioVideos = [...(artist.portfolioVideos || []), data.url];
      } else {
        updatedArtist.portfolio = [...(artist.portfolio || []), data.url];
      }

      // If it's a local artist, update localStorage
      if (id?.startsWith('local-')) {
        const localArtists = JSON.parse(localStorage.getItem('local_artists') || '[]');
        const updatedLocal = localArtists.map((a: any) => a.id === id ? updatedArtist : a);
        localStorage.setItem('local_artists', JSON.stringify(updatedLocal));
      } else {
        // Update via API
        await fetch(`/api/artists/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatedArtist)
        });
      }

      setArtist(updatedArtist);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchArtistBookings = async () => {
      try {
        const response = await bookingService.getBookings(id);
        setArtistBookings(response.data);
      } catch (error) {
        console.error('Error fetching artist bookings:', error);
      }
    };
    if (id) fetchArtistBookings();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to leave a review');
      return;
    }
    setIsSubmittingReview(true);
    try {
      // Mock review submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newReview = {
        id: `r${Date.now()}`,
        user: user?.name || 'Anonymous',
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toISOString().split('T')[0]
      };
      setArtist((prev: any) => ({
        ...prev,
        reviews: [newReview, ...(prev.reviews || [])]
      }));
      setReviewData({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Review submission failed:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setContactStatus('idle');
    try {
      // Mock contact API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Contact inquiry sent:', { artistId: id, ...contactData });
      setContactStatus('success');
      setContactData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsContactModalOpen(false), 2000);
    } catch (error) {
      console.error('Contact failed:', error);
      setContactStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login to request a booking');
      return;
    }

    // Validation: Check if date is blocked or already booked
    const isBooked = artistBookings.some(b => b.date === bookingData.date && b.status === 'Confirmed');
    const localAvailability = JSON.parse(localStorage.getItem(`availability_${id}`) || '[]');
    const isBlocked = localAvailability.includes(bookingData.date);

    if (isBooked || isBlocked) {
      setBookingStatus('error');
      alert('This date is no longer available. Please select another date.');
      return;
    }

    setIsBooking(true);
    setBookingStatus('idle');
    try {
      const payload = {
        artistId: id,
        artistName: artist.name,
        userEmail: user?.email,
        userName: user?.name,
        ...bookingData
      };
      await bookingService.createBooking(payload);
      setLastBooking(payload);
      setBookingStatus('success');
      setShowConfirmation(true);
      setBookingData({ date: '', time: '', location: '', message: '' });
    } catch (error) {
      console.error('Booking failed:', error);
      setBookingStatus('error');
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        // Check if it's a local ID
        if (id?.startsWith('local-')) {
          const localArtists = JSON.parse(localStorage.getItem('local_artists') || '[]');
          const found = localArtists.find((a: any) => a.id === id);
          if (found) {
            setArtist(found);
            setLoading(false);
            return;
          }
        }

        const response = await fetch(`/api/artists/${id}`);
        if (!response.ok) {
          // Fallback to localStorage if API fails (maybe it was just added)
          const localArtists = JSON.parse(localStorage.getItem('local_artists') || '[]');
          const found = localArtists.find((a: any) => a.id === id);
          if (found) {
            setArtist(found);
          } else {
            throw new Error('Artist not found');
          }
        } else {
          const data = await response.json();
          setArtist(data);
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id]);

  if (loading) return <div className="pt-40 text-center font-bold text-indigo-900">Loading Folio...</div>;
  if (!artist) return <div className="pt-40 text-center font-bold text-red-600">Artist not found.</div>;

  return (
    <div className="pt-32 pb-20">
      <AnimatePresence>
        {showConfirmation && lastBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-green-600 fill-green-600" />
              </div>
              <h3 className="text-3xl font-black text-indigo-950 font-headline tracking-tighter text-center mb-2">Request Received!</h3>
              <p className="text-slate-500 text-center mb-8">
                Your request for <span className="font-bold text-indigo-900">{artist.name}</span> has been sent.
              </p>
              
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</span>
                  <span className="text-sm font-bold text-indigo-900">{lastBooking.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time</span>
                  <span className="text-sm font-bold text-indigo-900">{lastBooking.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</span>
                  <span className="text-sm font-bold text-indigo-900">{lastBooking.location}</span>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 mb-8 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs font-bold text-indigo-900 mb-1">Estimated Response Time</p>
                  <p className="text-xs text-indigo-700 leading-tight">Artists typically respond within <span className="font-bold">24-48 hours</span>. You'll receive an email notification once they update the status.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirmation(false)}
                className="w-full py-4 bg-indigo-900 text-white rounded-xl font-bold shadow-xl shadow-indigo-900/20 hover:bg-indigo-800 transition-all"
              >
                Got it, thanks!
              </button>
            </motion.div>
          </div>
        )}

        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-indigo-950 font-headline tracking-tighter">Direct Inquiry</h3>
                  <p className="text-xs text-slate-500 font-medium">Contact {artist.name} for non-booking questions.</p>
                </div>
                <button 
                  onClick={() => setIsContactModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleContactSubmit} className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactData.name}
                      onChange={(e) => setContactData({...contactData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Email</label>
                    <input 
                      type="email" 
                      required
                      value={contactData.email}
                      onChange={(e) => setContactData({...contactData, email: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={contactData.subject}
                    onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all"
                    placeholder="Collaboration, Interview, etc."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message</label>
                  <textarea 
                    rows={4}
                    required
                    value={contactData.message}
                    onChange={(e) => setContactData({...contactData, message: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all resize-none"
                    placeholder="Write your message here..."
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isSending}
                  className={cn(
                    "w-full py-4 text-white rounded-xl font-black shadow-xl transition-all transform hover:scale-[1.01]",
                    contactStatus === 'success' ? "bg-green-600" : "bg-indigo-900 hover:bg-indigo-800 shadow-indigo-900/20",
                    isSending && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isSending ? "Sending..." : contactStatus === 'success' ? "Message Sent!" : "Send Message"}
                </button>
                
                {contactStatus === 'error' && (
                  <p className="text-xs text-red-500 text-center font-bold">Failed to send message. Please try again.</p>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Image & Portfolio */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden aspect-[4/5] mb-8 shadow-2xl"
            >
              <img src={artist.image} className="w-full h-full object-cover" alt={artist.name} />
            </motion.div>
          </div>

          {/* Right: Info & Booking */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Verified Artist</span>
              <h1 className="text-6xl font-black text-indigo-950 tracking-tighter leading-none mb-4 font-headline">{artist.name}</h1>
              <div className="flex items-center gap-4 mb-8">
                <p className="text-xl text-slate-500 font-medium">{artist.category}</p>
                <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  <span className="text-sm font-black text-indigo-600">{artist.rating}</span>
                </div>
              </div>

              <div className="prose prose-slate mb-12">
                <p className="text-lg text-slate-600 leading-relaxed">
                  {artist.bio || "No biography available for this artist yet."}
                </p>
              </div>

              {/* Social Media Links */}
              <div className="mb-12">
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">Connect with {artist.name}</h3>
                <div className="flex gap-4">
                  <a 
                    href={artist.instagram || `https://instagram.com/${artist.name.toLowerCase().replace(/\s/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a 
                    href={artist.youtube || `https://youtube.com/@${artist.name.toLowerCase().replace(/\s/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="YouTube"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                  <a 
                    href={artist.website || `https://${artist.name.toLowerCase().replace(/\s/g, '')}.com`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Website"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mb-12">
                <h3 className="text-2xl font-black text-indigo-950 font-headline tracking-tighter mb-8">User Reviews</h3>
                
                {/* Review Form */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">Leave a Review</h4>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewData({ ...reviewData, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={cn(
                              "w-6 h-6 transition-colors",
                              star <= reviewData.rating ? "fill-indigo-600 text-indigo-600" : "text-slate-300"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      placeholder="Share your experience..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all resize-none"
                      rows={3}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-6 py-2 bg-indigo-900 text-white rounded-lg font-bold text-sm hover:bg-indigo-800 transition-all disabled:opacity-50"
                    >
                      {isSubmittingReview ? "Posting..." : "Post Review"}
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {artist.reviews && artist.reviews.length > 0 ? (
                    artist.reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-indigo-950">{review.user}</p>
                            <div className="flex gap-0.5 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "w-3 h-3",
                                    i < review.rating ? "fill-indigo-600 text-indigo-600" : "text-slate-200"
                                  )} 
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.date}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm italic">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Starting From</p>
                    <span className="text-4xl font-black text-indigo-900">${artist.price}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Availability</p>
                    <span className="text-indigo-600 font-bold">Limited Dates</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Event Date</label>
                        <div className="relative group">
                          <input 
                            type="text" 
                            readOnly
                            required
                            placeholder="Select from calendar"
                            value={bookingData.date}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all cursor-pointer"
                            onClick={() => {
                              const calendarEl = document.getElementById('availability-calendar');
                              calendarEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              calendarEl?.classList.add('ring-4', 'ring-indigo-600/20');
                              setTimeout(() => calendarEl?.classList.remove('ring-4', 'ring-indigo-600/20'), 2000);
                            }}
                          />
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none" />
                        </div>
                        {bookingData.date && (
                          <p className="mt-1 text-[9px] text-indigo-600 font-bold uppercase tracking-widest">Date Selected</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Start Time</label>
                        <input 
                          type="time" 
                          required
                          value={bookingData.time}
                          onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Location</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Venue or City"
                        value={bookingData.location}
                        onChange={(e) => setBookingData({...bookingData, location: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message</label>
                      <textarea 
                        rows={3}
                        placeholder="Tell the artist about your event..."
                        value={bookingData.message}
                        onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all resize-none"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isBooking}
                      className={cn(
                        "w-full py-5 text-white rounded-2xl font-black text-lg shadow-xl transition-all transform hover:scale-[1.02]",
                        bookingStatus === 'success' ? "bg-green-600" : "bg-indigo-900 hover:bg-indigo-800 shadow-indigo-900/20",
                        isBooking && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isBooking ? "Processing..." : bookingStatus === 'success' ? "Booking Requested!" : "Request Booking"}
                    </button>
                  </form>
                  
                  {bookingStatus === 'error' && (
                    <p className="text-xs text-red-500 text-center font-bold">Something went wrong. Please try again.</p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setIsContactModalOpen(true)}
                      className="w-full py-4 bg-white border-2 border-slate-100 text-indigo-950 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Artist
                    </button>
                    <button className="w-full py-4 bg-white border-2 border-slate-100 text-indigo-950 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                      Technical Rider
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400 font-medium">
                  Secure payments & verified contracts through The Editorial Stage.
                </p>
              </div>

              {/* Availability Calendar */}
              <div className="mt-12" id="availability-calendar">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xl font-black text-indigo-950 font-headline tracking-tighter">Artist Availability</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Select your event date below</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Booked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-100" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Unavailable</span>
                    </div>
                  </div>
                </div>
                <div className="transition-all duration-500 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/5 border border-slate-100">
                  <CalendarView 
                    bookings={artistBookings} 
                    artistId={id} 
                    readOnly 
                    compact 
                    onDateSelect={(date) => setBookingData(prev => ({ ...prev, date }))}
                    selectedDate={bookingData.date}
                  />
                </div>
                <p className="mt-4 text-xs text-slate-400 italic flex items-center gap-2">
                  <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                  Click an available date to instantly update your booking request.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-2xl bg-white border border-slate-100">
                  <Calendar className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-400">Flexible</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white border border-slate-100">
                  <HelpCircle className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-400">Support</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-white border border-slate-100">
                  <Mail className="w-5 h-5 text-indigo-600 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-400">Direct</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        {((artist.portfolio && artist.portfolio.length > 0) || (artist.portfolioVideos && artist.portfolioVideos.length > 0) || (user?.id === id || user?.id === artist.userId)) && (
          <div className="mt-24 border-t border-slate-100 pt-24">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">Visual Folio</span>
                <h3 className="text-5xl font-black text-indigo-950 tracking-tighter font-headline">The Portfolio</h3>
              </div>
              <div className="flex items-center gap-6">
                {(user?.id === id || user?.id === artist.userId) && (
                  <label className="flex items-center gap-2 px-6 py-3 bg-indigo-900 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-900/20">
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? "Uploading..." : "Add Media"}
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                )}
                <p className="text-slate-400 text-sm font-medium max-w-xs text-right hidden md:block">A curated selection of performances and artistic moments.</p>
              </div>
            </div>
            
            <div className="masonry-grid">
              {[
                ...(artist.portfolioVideos || []).map((url: string) => ({ url, type: 'video' })),
                ...(artist.portfolio || []).map((url: string) => ({ url, type: 'image' }))
              ].map((item: any, i: number) => {
                const isVideo = item.type === 'video';
                // Deterministic aspect ratio for masonry effect
                const aspectRatio = i % 3 === 0 ? "aspect-[3/4]" : i % 3 === 1 ? "aspect-square" : "aspect-[4/3]";
                
                return (
                  <motion.div 
                    key={`${item.type}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedMedia(item)}
                    className={cn(
                      "masonry-item group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-zoom-in",
                      aspectRatio,
                      isVideo ? "bg-slate-900" : ""
                    )}
                  >
                    {isVideo ? (
                      <>
                        <video 
                          src={item.url} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          controls={false}
                          muted
                          loop
                          playsInline
                          onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseOut={(e) => {
                            const v = e.target as HTMLVideoElement;
                            v.pause();
                            v.currentTime = 0;
                          }}
                        />
                        <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-none z-10">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-indigo-950/20">
                          <div className="p-4 bg-white/20 backdrop-blur-xl rounded-full text-white border border-white/30">
                            <Video className="w-8 h-8 fill-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <img 
                          src={item.url} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt={`Portfolio ${i + 1}`} 
                        />
                        <div className="absolute inset-0 bg-indigo-950/0 group-hover:bg-indigo-950/20 transition-colors duration-500" />
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedMedia && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/95 backdrop-blur-2xl p-6 md:p-12"
              onClick={() => setSelectedMedia(null)}
            >
              <button 
                className="absolute top-8 right-8 p-4 text-white hover:bg-white/10 rounded-full transition-all z-[110]"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="w-8 h-8" />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-6xl w-full max-h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {selectedMedia.type === 'video' ? (
                  <video 
                    src={selectedMedia.url} 
                    className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10" 
                    controls 
                    autoPlay 
                    playsInline
                  />
                ) : (
                  <img 
                    src={selectedMedia.url} 
                    className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl border border-white/10" 
                    alt="Portfolio Preview" 
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white font-body">
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/browse" element={<ArtistListingPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute role="artist">
                  <ArtistDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/artist/:id" element={<ArtistDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </AnimatePresence>
        <Footer />
      </div>
    </AuthProvider>
  );
}
