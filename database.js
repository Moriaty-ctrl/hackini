// database.js
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    doc,
    updateDoc,
    arrayUnion,
    onSnapshot,
    increment
  } from "firebase/firestore";
  import { db } from "./firebase.js";
  
  // Load leaderboard data
  export const getLeaderboard = async (limitCount = 10) => {
    const leaderboardQuery = query(
      collection(db, "users"),
      orderBy("score", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    const leaderboardData = [];
    
    querySnapshot.forEach((doc) => {
      leaderboardData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return leaderboardData;
  };
  
  // Join a challenge
  export const joinChallenge = async (userId, challengeId) => {
    try {
      // Update user document
      await updateDoc(doc(db, "users", userId), {
        challenges: arrayUnion(challengeId)
      });
      
      // Increment challenge participant count
      await updateDoc(doc(db, "challenges", challengeId), {
        participantCount: increment(1)
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Setup real-time listener for challenges
  export const setupChallengeListeners = (callback) => {
    return onSnapshot(collection(db, "challenges"), callback);
  };