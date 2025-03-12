// database.js - Firebase database functions
import { db } from "./firebase.js"
import firebase from "firebase/app"
import "firebase/firestore"

// Get leaderboard data
export const getLeaderboard = async (limitCount = 10) => {
  try {
    const querySnapshot = await db.collection("users").orderBy("score", "desc").limit(limitCount).get()

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
    const challengeDoc = await db.collection("challenges").doc(challengeId).get()
    if (!challengeDoc.exists) {
      return { success: false, error: "Challenge not found" }
    }

    // Check if user already joined this challenge
    const userDoc = await db.collection("users").doc(userId).get()
    if (!userDoc.exists) {
      return { success: false, error: "User not found" }
    }

    const userData = userDoc.data()
    const userChallenges = userData.challenges || []

    if (userChallenges.some((c) => c.id === challengeId)) {
      return { success: false, error: "Already joined this challenge" }
    }

    // Add challenge to user's challenges
    await db
      .collection("users")
      .doc(userId)
      .update({
        challenges: firebase.firestore.FieldValue.arrayUnion({
          id: challengeId,
          startedAt: new Date(),
          status: "in-progress",
        }),
      })

    // Increment participant count in challenge
    await db
      .collection("challenges")
      .doc(challengeId)
      .update({
        participantCount: firebase.firestore.FieldValue.increment(1),
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

// Add activity record
export const addActivity = async (userId, activityData) => {
  try {
    await db.collection("activity").add({
      userId,
      ...activityData,
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding activity:", error)
    return { success: false, error: error.message }
  }
}

// Setup challenge listeners for real-time updates
export const setupChallengeListeners = (callback) => {
  return db.collection("challenges").onSnapshot(callback)
}

// Complete a challenge
export const completeChallenge = async (userId, challengeId, points) => {
  try {
    // Update user's challenge status
    const userRef = db.collection("users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
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
    await userRef.update({
      challenges: updatedChallenges,
      score: firebase.firestore.FieldValue.increment(points),
    })

    // Get challenge details for activity
    const challengeDoc = await db.collection("challenges").doc(challengeId).get()

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

// Get user's activity
export const getUserActivity = async (userId, limitCount = 10) => {
  try {
    const querySnapshot = await db
      .collection("activity")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limitCount)
      .get()

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

// Get challenge details
export const getChallengeDetails = async (challengeId) => {
  try {
    const challengeDoc = await db.collection("challenges").doc(challengeId).get()
    if (challengeDoc.exists) {
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
    const userDoc = await db.collection("users").doc(userId).get()
    if (!userDoc.exists) {
      return { success: false, error: "User not found" }
    }

    const userData = userDoc.data()
    const userChallenges = userData.challenges || []

    // Fetch full challenge details for each challenge ID
    const challengePromises = userChallenges.map(async (challenge) => {
      const challengeDoc = await db.collection("challenges").doc(challenge.id).get()
      if (challengeDoc.exists) {
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

