# League Decay Tracker

A full-stack web application to track League of Legends ranked decay status across multiple accounts with real-time data from Riot Games API.

## Features

- 🔐 **Firebase Authentication** - Secure user authentication
- 🎮 **Riot Games API Integration** - Real-time League of Legends data
- 📊 **Multi-Account Tracking** - Track decay status for multiple accounts across different regions
- ⏰ **Real-time Countdown** - See at a glance when your next decay will occur
- 🔄 **Automatic Data Refresh** - Real-time updates from Riot API
- 📱 **Responsive Design** - Modern UI with Material UI components
- 🛡️ **Security** - Rate limiting, CORS, and input validation

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **UI Library**: Material UI (MUI)
- **Authentication**: Firebase Auth
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Deployment**: Railway

### Backend
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Auth
- **API Integration**: Riot Games API
- **Security**: Helmet, CORS, Rate limiting
- **Deployment**: Railway

## Screenshots

<details>
  <summary>📸 Click to show screenshots</summary>

  ![Screenshot 1](http://cdn.petrichor.one/u/lu1UEW.png)
  ![Screenshot 2](http://cdn.petrichor.one/u/yWaNok.png)
  ![Screenshot 3](http://cdn.petrichor.one/u/nNl10B.png)

</details>

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (local or cloud instance)
- Firebase project
- Riot Games API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/league-decay-tracker.git
   cd league-decay-tracker
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   cp env.example .env
   ```

   Edit `backend/.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/league-decay-tracker
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=your-firebase-private-key
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   
   # Riot Games API Configuration
   RIOT_API_KEY=your-riot-api-key
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   cp env.example .env
   ```

   Edit `frontend/.env` with your configuration:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:5000
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   ```

4. **Start the development servers:**

   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## Database Schema

### Users Collection
```javascript
{
  firebaseUid: String,    // Firebase user ID (required, unique, indexed)
  email: String,          // User email (optional, unique, sparse)
  name: String,           // Display name (required)
  picture: String,        // Profile picture URL
  emailVerified: Boolean, // Email verification status (default: false)
  nickname: String,       // Optional nickname
  createdAt: Date,        // Account creation date
  updatedAt: Date         // Last update date
}
```

### League Accounts Collection
```javascript
{
  puuid: String,          // Riot API unique identifier (required, unique, indexed)
  gameName: String,       // In-game name (required, indexed)
  tagLine: String,        // Tag line (required)
  region: String,         // Server region (required, enum: NA1, EUN1, EUW1, etc.)
  summonerIcon: Number,   // Profile icon ID (default: 0)
  summonerLevel: Number,  // Summoner level (default: 1, min: 1)
  tier: String,           // Rank tier (enum: IRON, BRONZE, SILVER, etc.)
  division: String,       // Rank division (enum: I, II, III, IV)
  lp: Number,             // League points (default: 0, min: 0)
  lastSoloDuoGameId: String, // Last ranked game ID (required)
  isActive: Boolean,      // Account status (default: true, indexed)
  lastUpdated: Date,      // Last data update (indexed)
  createdAt: Date         // Account creation date
}
```

### User League Accounts Collection
```javascript
{
  userId: ObjectId,       // Reference to User (required, indexed)
  leagueAccountId: ObjectId, // Reference to LeagueAccount (required, indexed)
  remainingDecayDays: Number, // Days until decay (default: 28, min: -1, max: 28, indexed)
  isDecaying: Boolean,    // Decay status flag (default: false, indexed)
  isSpecial: Boolean,     // Special account flag (default: false, indexed)
  isActive: Boolean,      // User-specific active status (default: true, indexed)
  lastUpdated: Date,      // Last update date (indexed)
  createdAt: Date         // Creation date
}
```

## Deployment

### Railway Deployment
The project is configured for Railway deployment with both frontend and backend services.

1. **Connect your repository to Railway**
2. **Set up environment variables** in Railway dashboard
3. **Deploy automatically** on git push

## Development

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Required |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Required |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Required |
| `RIOT_API_KEY` | Riot Games API key | Required |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Legal

- [Terms of Service](./frontend/src/components/TermsOfService.jsx)
- [Privacy Policy](./frontend/src/components/Privacy.jsx)

## License

This project is licensed under the ISC License.

## Acknowledgments

- Riot Games for providing the API that makes this tool possible
- The League of Legends community for the inspiration
- Firebase for secure authentication
- Material UI for the beautiful components

## Disclaimer

League Decay Tracker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and League of Legends are trademarks or registered trademarks of Riot Games, Inc.
