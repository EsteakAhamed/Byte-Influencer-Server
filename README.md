# Byte Influencer Server 

The backend engine powering **Byte Influencer**, a comprehensive management platform designed to aggregate, analyze, and manage influencer data across multiple social media platforms. Built with Node.js and MongoDB, this server provides a robust API for handling unified influencer profiles, automated metric calculations, and seamless multi-platform imports.

---

##  Key Features

- **Unified Influencer Profiles**: Consolidates data from YouTube, TikTok, Instagram, and Facebook into a single, aggregated profile.
- **Automated Analytics**: Real-time calculation of engagement rates, average likes, and views across different platforms.
- **Multi-Platform Import Engine**: Specialized controllers for importing data via various social media APIs (YouTube, RapidAPI, etc.).
- **Robust Data Validation**: Comprehensive Mongoose schemas ensuring data integrity for complex nested metric structures.
- **Scalable Architecture**: Clean MVC-style separation of concerns (Routes, Controllers, Models, Services).

##  Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **API Communication**: Axios
- **Environment**: Dotenv
- **Dev Tools**: Nodemon

##  Project Structure

```text
├── config/             # Database & global configurations
├── controllers/        # Request handling logic
│   ├── importController.js     # External API data processing
│   └── influencerController.js # Core business logic
├── models/             # Mongoose schemas & data validation
├── routes/             # API endpoint definitions
├── services/           # Reusable business logic & utility functions
├── server.js           # Application entry point
└── .env                # Environment variables configuration
```

##  Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EsteakAhamed/Byte-Influencer-Server.git
   cd Byte-Influencer-Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   RAPIDAPI_KEY=your_rapid_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   FACEBOOK_API_KEY=your_facebook_api_key
   ```

4. **Run the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   node server.js
   ```

##  API Endpoints Summary

### Influencers
- `GET /api/influencers` - Fetch all influencers
- `GET /api/influencers/:id/profile` - Get detailed aggregated profile
- `POST /api/influencers/import-ig` - Import Instagram data
- `POST /api/influencers/import-youtube` - Import YouTube data
- `PATCH /api/influencers/:id` - Update influencer details
- `DELETE /api/influencers/:id` - Remove influencer

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client account
- `PATCH /api/clients/:id` - Update client information

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Developed with ❤️ by [Esteak Ahamed](https://github.com/EsteakAhamed)*
