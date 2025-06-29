# League Decay Tracker Backend

A Node.js/Express backend API for the League of Legends Decay Tracker application, featuring Auth0 authentication and MongoDB database integration.

## Features

- 🔐 **Auth0 Authentication** - Secure JWT-based authentication
- 🗄️ **MongoDB Database** - Flexible document storage with Mongoose ODM
- 🎮 **Riot Games API Integration** - Real-time League of Legends data
- 📊 **User Management** - Complete user profile and account management
- 🏆 **League Account Tracking** - Monitor multiple League accounts
- ⏰ **Decay Calculation** - Automatic decay day calculations
- 🔄 **Data Refresh** - Real-time data updates from Riot API
- 🛡️ **Security** - Rate limiting, CORS, and input validation

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Auth0 JWT tokens
- **API Integration**: Riot Games API
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- Auth0 account and application
- Riot Games API key

## Installation

1. **Clone the repository and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/league-decay-tracker
   
   # Auth0 Configuration
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
   
   # Riot Games API Configuration
   RIOT_API_KEY=your-riot-api-key
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Database Schema

### Users Collection
```javascript
{
  auth0Id: String,        // Auth0 user ID
  email: String,          // User email
  name: String,           // Display name
  picture: String,        // Profile picture URL
  emailVerified: Boolean, // Email verification status
  nickname: String,       // Optional nickname
  createdAt: Date,        // Account creation date
  updatedAt: Date         // Last update date
}
```

### League Accounts Collection
```javascript
{
  userId: ObjectId,       // Reference to user
  puuid: String,          // Riot account PUUID
  summonerIcon: Number,   // Profile icon ID
  gameName: String,       // In-game name
  tagLine: String,        // Tag line
  region: String,         // Server region
  remainingDecayDays: Number, // Days until decay
  division: String,       // Rank division (I, II, III, IV)
  tier: String,           // Rank tier (IRON, BRONZE, etc.)
  lp: Number,             // League points
  lastSoloDuoGameId: String, // Last ranked game ID
  lastSoloDuoGameDate: Date, // Last ranked game date
  summonerLevel: Number,  // Summoner level
  isActive: Boolean,      // Account status
  lastUpdated: Date,      // Last data update
  createdAt: Date         // Account creation date
}
```

## API Endpoints

### Authentication
All protected endpoints require a valid Auth0 JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

### User Management
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `GET /api/users/me/accounts` - Get user's league accounts
- `GET /api/users/me/stats` - Get user statistics
- `DELETE /api/users/me` - Delete user account

### League Accounts
- `GET /api/accounts` - Get all user's league accounts
- `GET /api/accounts/:id` - Get specific league account
- `POST /api/accounts` - Add new league account
- `PUT /api/accounts/:id` - Update league account
- `DELETE /api/accounts/:id` - Delete league account
- `POST /api/accounts/:id/refresh` - Refresh account data from Riot API

## API Examples

### Add League Account
```bash
curl -X POST http://localhost:5000/api/accounts \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gameName": "SummonerName",
    "tagLine": "NA1",
    "region": "NA1"
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Refresh Account Data
```bash
curl -X POST http://localhost:5000/api/accounts/64f1a2b3c4d5e6f7g8h9i0j1/refresh \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/league-decay-tracker` |
| `AUTH0_DOMAIN` | Auth0 domain | Required |
| `AUTH0_AUDIENCE` | Auth0 API audience | Required |
| `RIOT_API_KEY` | Riot Games API key | Required |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Development

### Running in Development
```bash
npm run dev
```

### Running in Production
```bash
npm start
```

### Database Connection
The application automatically connects to MongoDB on startup. Make sure MongoDB is running or your cloud database is accessible.

### Logging
The application logs all requests and errors to the console. In production, consider using a logging service.

## Security Features

- **JWT Token Validation** - All protected routes validate Auth0 tokens
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Restricts cross-origin requests
- **Input Validation** - Validates all user inputs
- **Helmet Security** - Adds security headers
- **Error Handling** - Graceful error responses

## Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 
