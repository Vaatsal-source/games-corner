A modern, interactive React application for discovering, rating, and reviewing popular video games. This platform features real-time data synchronization via Firebase, Google Authentication, and a responsive glassmorphism UI.
________________________________________
🎮 Features
1. Game Discovery & Search
•	Dynamic Browse: Explore a curated list of top-tier titles like Elden Ring, Cyberpunk 2077, and Valorant.
•	Real-time Search: Instantly filter the game library via a responsive search bar to find specific titles.
•	Detailed Views: In-depth game descriptions, official links, and high-quality key art for every entry.
2. Social & Community Interaction
•	Star Rating System: Users can submit 1–5 star ratings for games. The platform calculates and displays a real-time average rating and total vote count.
•	Review System: A full CRUD (Create, Read, Update, Delete) comment section allowing users to share detailed feedback and edit their existing reviews.
•	Authenticated Profiles: Integration with Firebase Auth (Google) ensures that only verified users can interact with the community.
3. Modern Technical Architecture
•	Backend-as-a-Service: Uses Cloud Firestore for real-time document updates and data persistence.
•	Responsive UI: Styled with a custom CSS framework featuring video backgrounds, gradient text, and sleek "comment bubble" layouts.
•	State Management: Built with React Hooks (useState, useEffect) for seamless view switching between Home, Browse, and Details.
________________________________________
🛠️ Technical Stack
•	Frontend: React.js (Hooks, Functional Components)
•	Database: Firebase Firestore (NoSQL)
•	Authentication: Firebase Auth (Google Provider)
•	Styling: Custom CSS3 (Flexbox/Grid, Animations, Video Overlays)
•	Icons/Assets: Dynamic image hosting and standard Unicode glyphs.
________________________________________
📂 Project Structure
Plaintext
src/
├── App.js            # Main logic, routing, and Game Data
├── firebase.js       # Firebase configuration and initialization
├── index.css         # Custom styling (Hero, Navbar, Grid, Comments)
└── index.js          # Entry point
________________________________________
⚙️ Setup & Installation
1. Clone & Install
Bash
npm install firebase
2. Configure Firebase
Ensure your firebase.js matches your project credentials. The following collections are required in your Firestore database:
•	ratings: { gameId, rating, userId, createdAt }
•	comments: { gameId, text, userId, userName, userPhoto, createdAt, editedAt }
3. Run the App
Bash
npm start
________________________________________
📝 Usage Guide
1.	Home: Click "Browse Games Now" to enter the library.
2.	Auth: Click "Login" in the navbar to enable rating and reviewing features via your Google account.
3.	Rating: Click on stars below a game card to cast your vote (one vote per game per user).
4.	Reviewing: Enter the "Details" view of a game to read existing community feedback or post your own. You can edit or delete your reviews at any time.
________________________________________
⚖️ Disclaimer
This project is a community-focused showcase. All game descriptions and images are the property of their respective developers and publishers.

