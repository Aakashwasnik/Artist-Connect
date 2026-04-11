import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'editorial-stage-secret-key';

// --- Mongoose Models ---

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['artist', 'organizer'], default: 'artist' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const bookingSchema = new mongoose.Schema({
  artistId: { type: String, required: true },
  artistName: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

const artistProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 5.0 },
  image: { type: String },
  bio: { type: String },
  portfolio: [{ type: String }],
  portfolioVideos: [{ type: String }],
  instagram: { type: String },
  youtube: { type: String },
  website: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ArtistProfile = mongoose.model('ArtistProfile', artistProfileSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Multer Configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images and videos are allowed'));
      }
    }
  });

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  
  let isConnected = false;
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log('Connected to MongoDB');
        isConnected = true;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.log('Continuing with mock data mode for auth...');
      });
  } else {
    console.log('MONGODB_URI not found. Running with mock data mode for auth.');
  }

  // --- Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---
  
  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    
    if (!isConnected) {
      // Mock registration if no DB
      return res.json({ 
        message: 'User registered (Mock Mode)', 
        token: jwt.sign({ id: 'mock-id', name, email, role }, JWT_SECRET),
        user: { id: 'mock-id', name, email, role }
      });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword, role });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id, name, email, role }, JWT_SECRET);
      res.status(201).json({ 
        message: 'User registered', 
        token,
        user: { id: newUser._id, name, email, role }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!isConnected) {
      // Mock login if no DB
      if (email === 'test@example.com' && password === 'password') {
        return res.json({ 
          message: 'Login successful (Mock Mode)', 
          token: jwt.sign({ id: 'mock-id', name: 'Test User', email, role: 'artist' }, JWT_SECRET),
          user: { id: 'mock-id', name: 'Test User', email, role: 'artist' }
        });
      }
      return res.status(401).json({ message: 'Invalid credentials (Mock Mode: use test@example.com / password)' });
    }

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id, name: user.name, email, role: user.role }, JWT_SECRET);
      res.json({ 
        message: 'Login successful', 
        token,
        user: { id: user._id, name: user.name, email, role: user.role }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Artist Routes
  app.get('/api/artists', async (req, res) => {
    if (isConnected) {
      try {
        const artists = await ArtistProfile.find();
        if (artists.length > 0) return res.json(artists);
      } catch (error) {
        console.error('Error fetching artists from DB:', error);
      }
    }

    const mockArtists = [
      { id: '1', name: 'Elena Volkov', category: 'Classical Fusion Cello', price: 1200, rating: 4.9, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4CwDOjS5SapqyAyJMRMS-cMp_OT5vmiaNcHWg5C9S9G54YbLv5Akf7Y81EBpMlk-4yAcCZSj5yfQVpXsBiTOkWvAjnT3WBtZnajQX38rSNJ6vX_GlQSayp_ZVDY-H4WMm1-GQy0D2Q5PU2LxSCoPpr-q1u8Er88wzaObUpNcOg3lzw7cmTDru7ZlLBFzRHp5KQ42OMnen3ag8QkIjDfr7PQvT4Uzct0oO6-BcygRKP1e_xkf1QO-NziyyafRPCOTNf6y9YzkmNQ-B' },
      { id: '2', name: 'Marcus Thorne', category: 'Jazz & Soul Vocalist', price: 450, rating: 4.8, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3SVyDoztkUfxUehtUh9uU5LdYjRDW2bUNYIbLn1N2XQ-VR0pHjXP626rOrerZEPxKMz7ZBPEuxFF513i1vMlQCtcXbjusx3HM7MPH7O42IE9Yg3iZmSp8v8AOBXH3bgzESK4okbBG_pMbK5_JtJ8TbH9UIzbuZxG2L6ZzPO0zpvV5PFua8KK1zIz9VkAqpOPy_jwZsSYabMecRUGFhqk-KZZ-tpfdd7Oowm9rf_uV8wcrjwIRLdK_yfl5Exd1mIo6VE_Og85eZEz7' },
      { id: '3', name: 'SARA-L', category: 'Techno & House Specialist', price: 800, rating: 4.9, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpR-MsimlV6bOUX2kldzy6QnU6MrvAM0SRtcz_28hjAWKRSNH2p-MX29wydAYfgSTUToUXF0xt34j6GDt15Jf1Ws-isOKFjLhVHGi2Y2eR4OUz4TypNH6b-V0AMwqchs7NE6_VJIu_IncEq1ChHWPgsDDKZwPBaccup4c52QGuYXHIpmX3Zsvo4sQ_wTJk4tC4CpKafewpqTLGoSlZKCzW1BUd2pGlpnSKYsT87oaBuQqx2NG2h_b5iihD8JHC2Mjmo7LZn-7giX' }
    ];
    res.json(mockArtists);
  });

  app.get('/api/artists/:id', async (req, res) => {
    const { id } = req.params;

    if (isConnected) {
      try {
        const artist = await ArtistProfile.findOne({ userId: id }) || await ArtistProfile.findById(id);
        if (artist) return res.json(artist);
      } catch (error) {
        console.error('Error fetching artist from DB:', error);
      }
    }

    const mockArtists = [
      { 
        id: '1', 
        name: 'Elena Volkov', 
        category: 'Classical Fusion Cello', 
        price: 1200, 
        rating: 4.9, 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4CwDOjS5SapqyAyJMRMS-cMp_OT5vmiaNcHWg5C9S9G54YbLv5Akf7Y81EBpMlk-4yAcCZSj5yfQVpXsBiTOkWvAjnT3WBtZnajQX38rSNJ6vX_GlQSayp_ZVDY-H4WMm1-GQy0D2Q5PU2LxSCoPpr-q1u8Er88wzaObUpNcOg3lzw7cmTDru7ZlLBFzRHp5KQ42OMnen3ag8QkIjDfr7PQvT4Uzct0oO6-BcygRKP1e_xkf1QO-NziyyafRPCOTNf6y9YzkmNQ-B',
        bio: 'Elena Volkov is a world-renowned cellist known for her innovative fusion of classical techniques with modern electronic soundscapes. With over 15 years of performance experience, she has headlined major festivals across Europe and North America.',
        portfolio: [
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800'
        ],
        reviews: [
          { id: 'r1', user: 'Sarah J.', rating: 5, comment: 'Absolutely breathtaking performance. Elena brought a unique energy to our gala.', date: '2024-03-15' },
          { id: 'r2', user: 'Michael R.', rating: 4, comment: 'Incredible talent. The fusion of styles was exactly what we needed.', date: '2024-02-20' }
        ]
      },
      { 
        id: '2', 
        name: 'Marcus Thorne', 
        category: 'Jazz & Soul Vocalist', 
        price: 450, 
        rating: 4.8, 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3SVyDoztkUfxUehtUh9uU5LdYjRDW2bUNYIbLn1N2XQ-VR0pHjXP626rOrerZEPxKMz7ZBPEuxFF513i1vMlQCtcXbjusx3HM7MPH7O42IE9Yg3iZmSp8v8AOBXH3bgzESK4okbBG_pMbK5_JtJ8TbH9UIzbuZxG2L6ZzPO0zpvV5PFua8KK1zIz9VkAqpOPy_jwZsSYabMecRUGFhqk-KZZ-tpfdd7Oowm9rf_uV8wcrjwIRLdK_yfl5Exd1mIo6VE_Og85eZEz7',
        bio: 'Marcus Thorne brings a smooth, soulful voice to any stage. Specializing in Jazz standards and contemporary Soul, his performances are intimate, powerful, and unforgettable.',
        portfolio: [
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&q=80&w=800'
        ],
        reviews: [
          { id: 'r3', user: 'David L.', rating: 5, comment: 'Marcus has a voice that stops you in your tracks. Highly recommend.', date: '2024-01-10' }
        ]
      },
      { 
        id: '3', 
        name: 'SARA-L', 
        category: 'Techno & House Specialist', 
        price: 800, 
        rating: 4.9, 
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkXpR-MsimlV6bOUX2kldzy6QnU6MrvAM0SRtcz_28hjAWKRSNH2p-MX29wydAYfgSTUToUXF0xt34j6GDt15Jf1Ws-isOKFjLhVHGi2Y2eR4OUz4TypNH6b-V0AMwqchs7NE6_VJIu_IncEq1ChHWPgsDDKZwPBaccup4c52QGuYXHIpmX3Zsvo4sQ_wTJk4tC4CpKafewpqTLGoSlZKCzW1BUd2pGlpnSKYsT87oaBuQqx2NG2h_b5iihD8JHC2Mjmo7LZn-7giX',
        bio: 'SARA-L is a powerhouse in the electronic music scene. Her sets are a journey through deep house and driving techno, designed to keep the dance floor moving from start to finish.',
        portfolio: [
          'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800'
        ],
        reviews: [
          { id: 'r4', user: 'Club X', rating: 5, comment: 'The energy was unmatched. SARA-L knows how to read a crowd.', date: '2024-03-01' }
        ]
      }
    ];
    const artist = mockArtists.find(a => a.id === id);
    if (artist) {
      res.json(artist);
    } else {
      res.status(404).json({ message: 'Artist not found' });
    }
  });

  app.put('/api/artists/:id', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: 'Unauthorized' });

    if (!isConnected) {
      return res.json({ message: 'Profile updated (Mock Mode)', artist: req.body });
    }

    try {
      const artist = await ArtistProfile.findOneAndUpdate(
        { userId: id },
        { ...req.body },
        { new: true, upsert: true }
      );
      res.json(artist);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, type: req.file.mimetype.startsWith('video/') ? 'video' : 'image' });
  });

  // Booking Routes
  app.post('/api/bookings', async (req, res) => {
    const { artistId, artistName, userEmail, userName, date, time, location, message } = req.body;
    
    if (!isConnected) {
      console.log(`[Email Simulation] To: ${userEmail}, Artist: ${artistName}. Status: Booking Requested.`);
      return res.json({ message: 'Booking request sent (Mock Mode)', bookingId: 'mock-booking-id' });
    }

    try {
      const newBooking = new Booking({
        artistId, artistName, userEmail, userName, date, time, location, message
      });
      await newBooking.save();

      // Email Simulation
      console.log(`[Email Simulation] To: ${userEmail}, Artist: ${artistName}. Status: Booking Requested.`);
      console.log(`[Email Simulation] To: artist-email@example.com, User: ${userName}. Status: New Booking Request.`);

      res.status(201).json({ message: 'Booking request sent', bookingId: newBooking._id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/bookings', async (req: any, res) => {
    const { artistId } = req.query;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user: any = null;

    if (token) {
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // Token invalid, treat as unauthenticated
      }
    }

    // If no artistId provided, we MUST be authenticated to see "our" bookings
    if (!artistId && !user) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!isConnected) {
      let mockBookings = [
        { id: '1', artistId: '1', artistName: 'Elena Volkov', userName: 'Grand Heritage Hotel', date: '2024-10-24', time: '19:30 - 22:00', status: 'Pending', location: 'London' },
        { id: '2', artistId: '1', artistName: 'Elena Volkov', userName: 'TechX Conference', date: '2024-10-28', time: '21:00 - 00:00', status: 'Confirmed', location: 'Berlin' },
        { id: '3', artistId: '1', artistName: 'Elena Volkov', userName: 'Private Wedding', date: '2024-11-05', time: '18:00 - 21:00', status: 'Confirmed', location: 'Paris' }
      ];

      let results: any[] = mockBookings;
      if (artistId) {
        results = results.filter(b => b.artistId === artistId);
        // If not authenticated as the artist, strip sensitive info
        if (!user || user.id !== artistId) {
          results = results.map(b => ({ date: b.date, status: b.status }));
        }
      } else if (user) {
        // Return all bookings for the logged-in artist
        results = results.filter(b => b.artistId === user.id);
      }
      return res.json(results);
    }

    try {
      const query: any = {};
      if (artistId) {
        query.artistId = artistId;
      } else if (user) {
        query.artistId = user.id;
      }

      const bookings = await Booking.find(query).sort({ createdAt: -1 });
      
      // Privacy filter: If not authenticated as the artist, only return date and status
      if (artistId && (!user || user.id !== artistId)) {
        return res.json(bookings.map(b => ({ date: b.date, status: b.status })));
      }

      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch('/api/bookings/:id/status', authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!isConnected) {
      return res.json({ message: `Booking ${status} (Mock Mode)` });
    }

    try {
      const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      // Email Simulation
      console.log(`[Email Simulation] To: ${booking.userEmail}, Artist: ${booking.artistName}. Status: Booking ${status}.`);

      res.json({ message: `Booking ${status}`, booking });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
