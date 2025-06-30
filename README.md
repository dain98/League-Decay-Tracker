# Ranked Decay Tracker
A web application to track League of Legends ranked decay status across multiple accounts.

## Features

- **Riot Games Authentication**: Sign in with your Riot Games account (OAuth)
- **Multi-Account Tracking**: Track decay status for multiple accounts across different regions
- **Countdown Timer**: See at a glance when your next decay will occur
- **Manual Updates**: Manually input days until decay for each account

## Tech Stack

- **Frontend**: React with Vite, Material UI
- **Backend**: Fastify
- **Database**: MariaDB
- **Authentication**: Riot Games OAuth

## Screenshots

<details>
  <summary>📸 Click to show screenshots</summary>

  ![Screenshot 1](http://cdn.petrichor.one/u/lu1UEW.png)
  ![Screenshot 2](http://cdn.petrichor.one/u/yWaNok.png)
  ![Screenshot 3](http://cdn.petrichor.one/u/nNl10B.png)

</details>

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or higher)
- NPM or Yarn
- MariaDB (v10.5 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/riot-decay-tracker.git
   cd riot-decay-tracker
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   # Frontend Environment Variables
   VITE_API_URL=http://localhost:3001
   VITE_RIOT_CLIENT_ID=your-riot-client-id
   
   # Backend Environment Variables (for backend setup)
   DATABASE_URL=mysql://username:password@localhost:3306/decaytracker
   RIOT_CLIENT_ID=your-riot-client-id
   RIOT_CLIENT_SECRET=your-riot-client-secret
   JWT_SECRET=your-jwt-secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The application will be available at `http://localhost:3000`

### Backend Setup (Coming Soon)

Instructions for setting up the Fastify backend and MariaDB database will be added as development progresses.

## Project Structure

```
riot-decay-tracker/
├── public/              # Static assets
├── src/                 # Application source code
│   ├── assets/          # Assets processed by Vite
│   ├── components/      # React components
│   │   ├── AccountList.jsx
│   │   ├── AddAccountDialog.jsx
│   │   ├── AuthGuard.jsx
│   │   ├── Dashboard.jsx
│   │   ├── GlobalDecayCountdown.jsx
│   │   └── Login.jsx
│   ├── App.css          # Global styles
│   ├── App.jsx          # Main App component
│   ├── main.jsx         # Entry point
│   └── index.css        # Base styles
├── .env                 # Environment variables (not committed)
├── .gitignore           # Git ignore file
├── index.html           # HTML template
├── package.json         # Project dependencies
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## Development Roadmap

- [x] Frontend UI design and implementation
- [x] Mock login functionality
- [ ] Backend API with Fastify
- [ ] Database schema and integration
- [ ] Riot Games OAuth implementation
- [ ] Account management features
- [ ] Deployment pipeline

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Riot Games for providing the API that makes this tool possible
- The League of Legends community for the inspiration

## Disclaimer

Ranked Decay Tracker is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and League of Legends are trademarks or registered trademarks of Riot Games, Inc.
