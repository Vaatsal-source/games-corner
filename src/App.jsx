import React, { useState, useEffect } from "react";
import "./index.css";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, addDoc, query, where, onSnapshot, 
  serverTimestamp, getDocs, doc, updateDoc, deleteDoc 
} from "firebase/firestore";

const StarRating = ({ rating, onRate }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? "star filled" : "star"} onClick={() => onRate && onRate(star)}>★</span>
    ))}
  </div>
);


const LandingPage = ({ onExplore }) => (
  <div className="landing-container">
    <div className="hero-banner">
      <div className="hero-video-container">
        <video autoPlay muted loop playsInline className="hero-video-bg">
          <source src="/Landing_page.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <p className="hero-subtitle">Welcome to</p>
        <h1 className="hero-main-title">Gamer's Corner</h1>
        <button className="register-btn" onClick={onExplore}>Browse Games Now</button>
      </div>
    </div>
  </div>
);

const AuthPage = ({ onBack }) => {
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); onBack(); }
    catch (error) { console.error("Login Error:", error); }
  };
  return (
    <div className="auth-overlay fade-in">
      <div className="login-box">
        <h2>Join the Community</h2>
        <button className="login-submit-btn" onClick={handleLogin}>Continue with Google</button>
        <button className="nav-link-btn" onClick={onBack} style={{marginTop: '10px'}}>Cancel</button>
      </div>
    </div>
  );
};

const GameSection = ({ game, onViewDetails }) => {
  const [stats, setStats] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    const q = query(collection(db, "ratings"), where("gameId", "==", game.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ratings = snapshot.docs.map(doc => doc.data().rating);
      if (ratings.length > 0) {
        const sum = ratings.reduce((a, b) => a + b, 0);
        setStats({ avg: (sum / ratings.length).toFixed(1), total: ratings.length });
      } else { setStats({ avg: 0, total: 0 }); }
    });
    return () => unsubscribe();
  }, [game.id]);

  const handleRate = async (stars) => {
    if (!auth.currentUser) return alert("Please login to rate!");
    const q = query(collection(db, "ratings"), where("gameId", "==", game.id), where("userId", "==", auth.currentUser.uid));
    const existing = await getDocs(q);
    if (!existing.empty) return alert("You've already rated this game!");
    await addDoc(collection(db, "ratings"), { gameId: game.id, rating: stars, userId: auth.currentUser.uid, createdAt: serverTimestamp() });
  };

  return (
    <div className="info-section">
      <div className="image-container">
        <img src={game.imgSrc} alt={game.title} className="side-image" onClick={() => onViewDetails(game)} />
        <StarRating rating={0} onRate={handleRate} />
        <div className="rating-stats"><p>Avg: {stats.avg} ★ ({stats.total})</p></div>
      </div>
      <div className="description-card">
        <h2 className="section-title">{game.title}</h2>
        <p>{game.shortDescription}</p>
      </div>
    </div>
  );
};

const GameDetailView = ({ game, onBack }) => {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "comments"), where("gameId", "==", game.id));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
  }, [game.id]);

  const handlePost = async () => {
    if (!auth.currentUser || !input.trim()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, "comments", editingId), { 
          text: input, 
          editedAt: serverTimestamp() 
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "comments"), {
          gameId: game.id,
          text: input,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName,
          userPhoto: auth.currentUser.photoURL,
          createdAt: serverTimestamp()
        });
      }
      setInput("");
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this review?")) {
      await deleteDoc(doc(db, "comments", id));
    }
  };

  return (
    <div className="game-page-layout">
      <button className="gradient-button" onClick={onBack}>← Back</button>
      <div className="detail-header">
        <img src={game.imgSrc} className="side-image" alt="" />
        <div className="detail-text">
          <h1 className="gradient-text">{game.title}</h1>
          <div className="description-card">
            <p>{game.description}</p>
            {game.officialUrl && (
              <a href={game.officialUrl} target="_blank" rel="noreferrer">
                <button className="register-btn" style={{marginTop: '20px'}}>Visit Official Site</button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="comment-section">
        <h3>Reviews ({comments.length})</h3>
        <div className="comment-input-group">
          <input 
            placeholder={editingId ? "Editing your review..." : "Add a review..."} 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
          />
          <button onClick={handlePost} className="post-btn">{editingId ? "Update" : "Post"}</button>
          {editingId && <button onClick={() => {setEditingId(null); setInput("");}}>Cancel</button>}
        </div>
        
        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.id} className="comment-bubble">
              <div className="comment-user">
                <img src={c.userPhoto} className="user-avatar" alt="" />
                <div className="user-info-meta">
                  <strong>{c.userName}</strong>
                  {c.editedAt && <span className="edited-tag">(edited)</span>}
                </div>
               {auth.currentUser?.uid === c.userId && (
               <div className="comment-actions">
                <button className="deco-btn edit" onClick={() => { setEditingId(c.id); setInput(c.text); }}>
                  <span>✎</span> Edit
                </button>
                <button className="deco-btn delete" onClick={() => handleDelete(c.id)}>
                  <span>🗑</span> Delete
                </button>
                </div>
              )}
              </div>
              <p className="comment-text">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState("home"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGame, setActiveGame] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const gamesData = [
    { id: 1, title: "Valorant", imgSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCt4E0UCCSN8xHJC7NyWWWk33TV7Jm4bgDBVcd8l2xTnC6HuCH0o4-C8CtP2U-Zt_gytojtw&s=10", officialUrl: "https://playvalorant.com", shortDescription: "A team-based tactical hero shooter where unique abilities meet precise gunplay.",description:"Valorant is a team-based first-person tactical hero shooter set in the near future. Players play as one of a set of Agents, characters based on several countries and cultures around the world. In the main game mode, players are assigned to either the attacking or defending team with each team having five players on it. Agents have unique abilities, each requiring charges, as well as a unique ultimate ability that requires charging through kills, deaths, orbs, or objectives" },
    { id: 2, title: "A Plague Tale", imgSrc: "https://assets.altarofgaming.com/wp-content/uploads/2022/07/a-plague-tale-requiem-game-cover-altar-of-gaming.jpg", officialUrl: "https://www.focus-entmt.com/en/games/a-plague-tale-requiem", shortDescription: "A heart-wrenching journey through a dark, rat-infested medieval world.",description:"Requiem is an action-adventure game played from a third-person perspective. In the game, the player assumes control of Amicia and must face off against both hostile humans and hordes of rats that are spreading the black plague. Gameplay is largely similar to the first game, though the combat system is significantly expanded. Amicia is equipped with weapons such as a knife to stab enemies, a sling that can be used to throw rocks, and a crossbow which allows her to defeat armoured opponents."},
    { id: 3, title: "Phasmophobia", imgSrc: "https://www.uploadvr.com/content/images/size/w1200/2024/10/PhasmophobiaKeyArt16x9-1.png", officialUrl: "https://kineticgames.co.uk/phasmophobia", shortDescription: "A 4-player online co-op psychological horror where you hunt for paranormal evidence.",description:"Phasmophobia is a horror investigation survival game played from a first-person perspective. The player works solo or in a group with up to three other players to complete a contract in which they must identify the type of ghost haunting the specified site. Players can communicate through voice chat, both locally within a short distance and globally via walkie-talkies. Phasmophobia features speech recognition allowing certain pieces of equipment, Cursed Possessions, and the ghost to understand key words and phrases spoken by players" },
    { id: 4, title: "Minecraft", imgSrc: "https://upload.wikimedia.org/wikipedia/commons/a/af/Minecraft_key-art_%22useless%22_version.png", officialUrl: "https://www.minecraft.net/", shortDescription: "Explore a blocky, procedurally generated world with infinite possibilities for building." , description:"Minecraft is a 3D sandbox video game that has no required goals to accomplish, allowing players a large amount of freedom in choosing how to play the game. The game also features an optional achievement system. Gameplay is in the first-person perspective by default, but players have the option of third-person perspectives. The game world is composed of rough 3D objects—mainly cubes, referred to as blocks—representing various materials, such as dirt, stone, ores, tree trunks, water, and lava. The core gameplay revolves around picking up and placing these objects."},
    { id: 5, title: "Cyberpunk 2077", imgSrc: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/a757b56d2078be8b09a04e2ad531f1fefafaa129/capsule_616x353.jpg?t=1769690377",officialUrl:"https://www.cyberpunk.net/us/en/", shortDescription: "An open-world action RPG set in Night City, a megalopolis obsessed with power and glamour.",description:"Cyberpunk 2077 is an action role-playing game played from a first-person perspective as V, a mercenary whose voice, face, hairstyle, body type and modifications, background, and clothing are customisable. There are also five attributes (Body, Intelligence, Reflexes, Technical Ability, and Cool) that can be customised to suit the player's gameplay style" },
    { id: 6, title: "Elden Ring", imgSrc: "https://baylorlariat.com/wp-content/uploads/2022/03/Elden_Ring_player_character_landscape.jpeg", officialUrl: "https://en.bandainamcoent.eu/elden-ring/elden-ring", shortDescription: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.",description:"Elden Ring is an action role-playing game set in third-person perspective. It includes elements that are similar to those in other FromSoftware-developed games, such as the Dark Souls series, Bloodborne, and Sekiro: Shadows Die Twice. The game is set in an open world; players can freely explore the Lands Between and its six main areas" },
    { id: 7, title: "Hades II", imgSrc: "https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/store/software/switch2/70010000105526/4ea19bfcd0c389ee5d02bb0c9bbb562802c40b73eba39e1582ac057ea7f73ad4", officialUrl: "https://www.supergiantgames.com/games/hades-ii/", shortDescription: "Battle beyond the Underworld using dark sorcery to take on the Titan of Time.",description:"Like the first game, Hades II is a roguelike dungeon crawler game. The player controls Melinoë, Princess of the Underworld and sister to the protagonist of the first game, Zagreus. Alongside her mentor Hecate, she aims to defeat Chronos, the titan of time, who returned to enact revenge on all gods and mortals who opposed him in the past and took her family prisoner. Along her quest, she is supported by the Olympians, who grant her Boons as she battles her way to Tartarus and subsequently Mount Olympus" },
    { id: 8, title: "Stray", imgSrc: "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000080625/d8c81b018b2e579aa5c224e635cf5368266ef168c7828e9ae18ad9444158efc4", officialUrl: "https://stray.game", shortDescription: "Lost, alone and separated from family, a stray cat must untangle an ancient mystery.",description:"Stray is an adventure game played by a single player in a third-person perspective. The player controls a stray cat, who can leap across platforms, climb up obstacles, and open new paths by interacting with the environment, such as clawing at objects, climbing in buckets, overturning paint cans, and operating a vending machine." },
    { id: 9, title: "League of Legends", imgSrc: "https://gaming-cdn.com/images/products/9456/orig/league-of-legends-pc-game-cover.jpg?v=1747212286", officialUrl: "https://www.leagueoflegends.com", shortDescription: "A team-based strategy game where two teams of five powerful champions face off.",description:"League of Legends is a multiplayer online battle arena (MOBA) game in which the player controls a character with a set of unique abilities from an isometric perspective. During a match, champions gain levels by accruing experience points (XP) through killing enemies."},
    { id: 10, title: "Apex Legends", imgSrc: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJdGT_dIF_3erNS3zYsMXVte2wLHUZMcTb5num9UbSB5ZkAetZoCIp6PJj-RpPwoxZdbyaTIOE-ugIF6Q6qJFybJI3J73p3M5hi7zgvj0&s=10", officialUrl: "https://www.ea.com/games/apex-legends", shortDescription: "Conquer with character in a free-to-play Hero shooter where legendary competitors battle.",description:"Apex Legends is an online multiplayer battle royale game featuring squads of three players using pre-made characters with distinctive abilities, called, similar to those of hero shooters. Alternate modes have been introduced allowing for single and for two-player squads since the game's release." },
    { id: 11, title: "Overwatch 2", imgSrc: "https://i.ytimg.com/vi/dZl1yGUetjI/maxresdefault.jpg", officialUrl: "https://overwatch.blizzard.com", shortDescription: "A globally renowned team-based shooter set in an optimistic future.",description:"Overwatch 2 is a hero shooter, where players are split into two teams of five characters known as from a roster of over 40. Heroes are organized into a  role, responsible for offensive efforts; a role, responsible for healing and buffing; and a role, responsible for creating space for their team." },
    { id: 12, title: "Assassins Creed Shadows", imgSrc: "https://i0.wp.com/uploads.saigacdn.com/2025/03/ubisoft-assassins-creed-shadows-release01.jpg", officialUrl: "https://www.ubisoft.com/en-gb/game/assassins-creed/shadows", shortDescription: "An action adventure game following a samurai in feudal Japan.",description:"Assassin's Creed Shadows is an action role-playing game with an emphasis on each of its two playable characters' set of unique skills. It is developed on an upgraded version of Anvil, using dynamic lighting and environmental interactions. Improvements include the addition of breakable objects and the ability to manipulate shadows and use a grappling hook for parkour" },
    { id: 13, title: "Hollow Knight", imgSrc: "https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_1240/b_white/f_auto/q_auto/store/software/switch/70010000003208/4643fb058642335c523910f3a7910575f56372f612f7c0c9a497aaae978d3e51", officialUrl: "https://www.hollowknight.com", shortDescription: "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom.",description:"Hollow Knight is a 2017 Metroidvania video game developed and published by Australian independent developer Team Cherry. The player controls a nameless insectoid warrior in exploring Hallownest, a fallen kingdom plagued by a supernatural disease. The game is set in diverse subterranean locations, featuring friendly and hostile insectoid characters and numerous bosses" },
    { id: 14, title: "Subnautica", imgSrc: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/264710/capsule_616x353.jpg?t=1751944840", officialUrl: "https://unknownworlds.com/subnautica/", shortDescription: "Descend into the depths of an alien underwater world filled with wonder and peril.",description:"Subnautica is a 2018 action-adventure survival game developed and published by Unknown Worlds Entertainment. The player controls Ryley Robinson, a survivor of a spaceship crash on an alien oceanic planet, which they are free to explore. The main objectives are to find essential resources, survive the local flora and fauna, and find a way to escape the planet." },
    { id: 15, title: "Ghost of Tsushima", imgSrc: "https://gmedia.playstation.com/is/image/SIEPDC/ghost-of-tsushima-master-image-en-24jun21?$facebook$", officialUrl: "https://www.playstation.com/games/ghost-of-tsushima/", shortDescription: "Uncover the hidden wonders of Tsushima in this open-world action-adventure.",description:"Ghost of Tsushima is a 2020 action-adventure game developed by Sucker Punch Productions and published by Sony Interactive Entertainment. The player controls Jin Sakai, a samurai on a quest to protect Tsushima Island during the first Mongol invasion of Japan. Jin must choose between following the warrior code to fight honorably, or by using practical but dishonorable methods of repelling the Mongols with minimal casualties." },
    { id: 16, title: "The Witcher 3", imgSrc: "https://image.api.playstation.com/vulcan/ap/rnd/202211/0711/kh4MUIuMmHlktOHar3lVl6rY.png", officialUrl: "https://www.thewitcher.com/en/witcher3", shortDescription: "Become a monster slayer for hire and embark on an epic journey to find the child of prophecy.",description:"The game takes place in a fictional fantasy world based on Slavic folklore. Players control Geralt of Rivia, a monster slayer for hire known as a Witcher, and search for his adopted daughter who is on the run from the Wild Hunt. Players battle the game's many dangers with weapons and magic, interact with non-player characters, and complete quests to acquire experience points and gold, which are used to increase Geralt's abilities and purchase equipment" },
    { id: 17, title: "Blair Witch", imgSrc: "https://xboxwire.thesourcemediaassets.com/sites/2/2019/08/BlairWitchTitledHeroArt.jpg", officialUrl: "https://blairwitchgame.com/", shortDescription: "A FPS story driven psychological horror game based on the lore of Blair Witch.",description:"The game focuses on survival horror mechanics and stealth and is played from a first person perspective, requiring the player to use items such as a camera, cellphone, flashlight or Ellis' dog, Bullet, to track and follow the trail of missing nine-year old Peter Shannon while fending off shadowy creatures. Along the way, players will find strange wooden dolls, photographs and cassette tapes and will also be tasked with solving puzzles" },
    { id: 18, title: "Ready Or Not", imgSrc: "https://static0.thegamerimages.com/wordpress/wp-content/uploads/sharedimages/2025/09/ready-or-not-tag-page-cover-art.jpg?w=1200&h=1200&fit=crop", officialUrl: "https://www.playstation.com/en-in/games/ready-or-not/", shortDescription: "Extremely Intense Tactical shooter" ,description :"Ready or Not delivers an immersive SWAT experience. Equip your team with authentic weapons and gear, deploy into high-stakes, real-world inspired missions to secure locations concealing unknown criminal threats and potential civilians. Every mission demands tactical precision and situational awareness. Bullets from known and concealed threats react realistically with the environment, passing through walls, furniture and bodies. Cover your six, clear your corners, apprehend the threats and rescue the innocent."},
    { id: 19, title: "Red Dead Redemption 2", imgSrc: "https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc4/rdr2-switch-2-port-alive.jpg", officialUrl: "https://www.rockstargames.com/reddeadredemption2", shortDescription: "An epic tale of life in America's unforgiving heartland." , description:"The story is set in a fictionalized representation of the United States in 1899 and follows the exploits of Arthur Morgan, an outlaw and member of the Van der Linde gang, who must face the challenges of a declining Wild West, while attempting to survive against government forces, rival gangs, and other adversaries."},
    { id: 20, title: "Resident Evil Village", imgSrc: "https://cdn.dlcompare.com/game_tetiere/upload/gameimage/file/2c75-resident_evil_village.jpeg.webp", officialUrl: "https://www.residentevil.com/village/en-asia/", shortDescription: "Experience survival horror like never before.",description:" Players control Ethan Winters, who searches for his kidnapped daughter in a mysterious village filled with mutant creatures. Village maintains survival horror elements from previous games, with players scavenging environments for items and managing resources while adding more action-oriented gameplay, with higher enemy counts and a greater emphasis on combat." },
    { id: 21, title: "Call of Duty Black Ops 7", imgSrc: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3606480/d7041a15f572f7702d5f4bc97e498cd3e1cc62e2/header.jpg?t=1766101946", officialUrl: "https://www.callofduty.com/blackops7", shortDescription: "Set in 2035, it takes the player through an elevated combat experience.",description:"Black Ops 7's story—playable in co-op or single-player—follows a JSOC unit led by David Mason as they investigate the apparent return of deceased terrorist Raul Menendez. As with previous Call of Duty titles, the game also includes a multiplayer component and the cooperative round-based Zombies mode." }
  ];

  const filteredGames = gamesData.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (showLogin) return <AuthPage onBack={() => setShowLogin(false)} />;

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-logo" onClick={() => setView("home")} style={{cursor:'pointer'}}>Gamer's Corner</div>
        {view === "browse" && (
          <div className="search-container">
            <input type="text" placeholder="Search Games..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button className="search-btn"></button>
          </div>
        )}
        <ul className="nav-links">
          <li><button className="nav-link-btn" onClick={() => setView("home")}>Home</button></li>
          <li><button className="nav-link-btn" onClick={() => setView("browse")}>Browse</button></li>
          <li>
            {user ? (
              <button className="nav-link-btn" onClick={() => signOut(auth)}>Logout ({user.displayName.split(' ')[0]})</button>
            ) : (
              <button className="nav-link-btn" onClick={() => setShowLogin(true)}>Login</button>
            )}
          </li>
        </ul>
      </nav>

      <div className="content">
        {view === "home" ? (
          <LandingPage onExplore={() => setView("browse")} />
        ) : view === "details" && activeGame ? (
          <GameDetailView game={activeGame} onBack={() => setView("browse")} />
        ) : (
          <div className="browse-section">
            <h1 className="gradient-text">{searchTerm ? `Results for "${searchTerm}"` : "Browse Games"}</h1>
            <div className="games-grid"> 
              {filteredGames.map((game) => (
                <GameSection key={game.id} game={game} onViewDetails={(g) => { setActiveGame(g); setView("details"); }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}