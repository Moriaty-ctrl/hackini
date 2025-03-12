// database.js - Firebase database functions
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    arrayUnion,
    query,
    orderBy,
    limit,
    where,
    onSnapshot,
    increment,
    addDoc,
  } from "firebase/firestore"
  import { db } from "./firebase"
  
  // Get leaderboard data
  export const getLeaderboard = async (limitCount = 10) => {
    try {
      const q = query(collection(db, "users"), orderBy("score", "desc"), limit(limitCount))
  
      const querySnapshot = await getDocs(q)
      const leaderboardData = []
  
      querySnapshot.forEach((doc) => {
        leaderboardData.push({
          id: doc.id,
          ...doc.data(),
        })
      })
  
      return leaderboardData
    } catch (error) {
      console.error("Error getting leaderboard:", error)
      return []
    }
  }
  
  // Join a challenge
  export const joinChallenge = async (userId, challengeId) => {
    try {
      // Check if challenge exists
      const challengeDoc = await getDoc(doc(db, "challenges", challengeId))
      if (!challengeDoc.exists()) {
        return { success: false, error: "Challenge not found" }
      }
  
      // Check if user already joined this challenge
      const userDoc = await getDoc(doc(db, "users", userId))
      if (!userDoc.exists()) {
        return { success: false, error: "User not found" }
      }
  
      const userData = userDoc.data()
      const userChallenges = userData.challenges || []
  
      if (userChallenges.some((c) => c.id === challengeId)) {
        return { success: false, error: "Already joined this challenge" }
      }
  
      // Add challenge to user's challenges
      await updateDoc(doc(db, "users", userId), {
        challenges: arrayUnion({
          id: challengeId,
          startedAt: new Date(),
          status: "in-progress",
        }),
      })
  
      // Increment participant count in challenge
      await updateDoc(doc(db, "challenges", challengeId), {
        participantCount: increment(1),
      })
  
      // Add activity record
      await addActivity(userId, {
        type: "challenge_started",
        title: `Started "${challengeDoc.data().name}" challenge`,
        challengeId: challengeId,
        timestamp: new Date(),
      })
  
      return { success: true }
    } catch (error) {
      console.error("Error joining challenge:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Complete a challenge
  export const completeChallenge = async (userId, challengeId, points) => {
    try {
      // Update user's challenge status
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
  
      if (!userDoc.exists()) {
        return { success: false, error: "User not found" }
      }
  
      const userData = userDoc.data()
      const challenges = userData.challenges || []
      const challengeIndex = challenges.findIndex((c) => c.id === challengeId)
  
      if (challengeIndex === -1) {
        return { success: false, error: "Challenge not found in user's challenges" }
      }
  
      // Create updated challenges array
      const updatedChallenges = [...challenges]
      updatedChallenges[challengeIndex] = {
        ...updatedChallenges[challengeIndex],
        status: "completed",
        completedAt: new Date(),
      }
  
      // Update user document
      await updateDoc(userRef, {
        challenges: updatedChallenges,
        score: increment(points),
      })
  
      // Get challenge details for activity
      const challengeDoc = await getDoc(doc(db, "challenges", challengeId))
  
      // Add activity record
      await addActivity(userId, {
        type: "challenge_completed",
        title: `Completed "${challengeDoc.data().name}" challenge`,
        challengeId: challengeId,
        points: points,
        timestamp: new Date(),
      })
  
      return { success: true }
    } catch (error) {
      console.error("Error completing challenge:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Add activity record
  export const addActivity = async (userId, activityData) => {
    try {
      await addDoc(collection(db, "activity"), {
        userId,
        ...activityData,
      })
      return { success: true }
    } catch (error) {
      console.error("Error adding activity:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Get user's activity
  export const getUserActivity = async (userId, limitCount = 10) => {
    try {
      const q = query(
        collection(db, "activity"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )
  
      const querySnapshot = await getDocs(q)
      const activityData = []
  
      querySnapshot.forEach((doc) => {
        activityData.push({
          id: doc.id,
          ...doc.data(),
        })
      })
  
      return activityData
    } catch (error) {
      console.error("Error getting user activity:", error)
      return []
    }
  }
  
  // Setup challenge listeners for real-time updates
  export const setupChallengeListeners = (callback) => {
    const q = query(collection(db, "challenges"))
    return onSnapshot(q, callback)
  }
  
  // Get challenge details
  export const getChallengeDetails = async (challengeId) => {
    try {
      const challengeDoc = await getDoc(doc(db, "challenges", challengeId))
      if (challengeDoc.exists()) {
        return { success: true, data: { id: challengeDoc.id, ...challengeDoc.data() } }
      }
      return { success: false, error: "Challenge not found" }
    } catch (error) {
      console.error("Error getting challenge details:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Get user's challenges
  export const getUserChallenges = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (!userDoc.exists()) {
        return { success: false, error: "User not found" }
      }
  
      const userData = userDoc.data()
      const userChallenges = userData.challenges || []
  
      // Fetch full challenge details for each challenge ID
      const challengePromises = userChallenges.map(async (challenge) => {
        const challengeDoc = await getDoc(doc(db, "challenges", challenge.id))
        if (challengeDoc.exists()) {
          return {
            ...challengeDoc.data(),
            id: challengeDoc.id,
            status: challenge.status,
            startedAt: challenge.startedAt,
            completedAt: challenge.completedAt,
          }
        }
        return null
      })
  
      const challenges = (await Promise.all(challengePromises)).filter(Boolean)
  
      return { success: true, data: challenges }
    } catch (error) {
      console.error("Error getting user challenges:", error)
      return { success: false, error: error.message }
    }
  }
  
  