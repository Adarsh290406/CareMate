import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Scheduled function to check for missed doses every hour
 * Sends push notifications to patients and caregivers
 */
export const checkMissedDoses = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const oneHourAgo = new admin.firestore.Timestamp(now.seconds - 3600, 0);

    // 1. Find all 'pending' doses that were scheduled more than an hour ago
    const snapshot = await db.collection("doses")
      .where("status", "==", "pending")
      .where("scheduledAt", "<", oneHourAgo)
      .get();

    if (snapshot.empty) return null;

    for (const doc of snapshot.docs) {
      const dose = doc.data();
      const userId = dose.userId;

      // 2. Mark as 'missed'
      await doc.ref.update({ status: "missed" });

      // 3. Get user details for notification
      const userSnap = await db.collection("users").doc(userId).get();
      const userData = userSnap.data();

      if (userData && userData.fcmToken) {
        // Send notification to Patient
        await admin.messaging().send({
          token: userData.fcmToken,
          notification: {
            title: "Missed Medication Alert",
            body: `You missed your ${dose.medName} dose scheduled at ${dose.time}.`,
          },
          data: {
            type: "missed_dose",
            doseId: doc.id
          }
        });

        // 4. If high priority, notify caregivers
        if (userData.caregiverIds && userData.caregiverIds.length > 0) {
           for (const caregiverId of userData.caregiverIds) {
              const caregiverSnap = await db.collection("users").doc(caregiverId).get();
              const caregiverData = caregiverSnap.data();
              if (caregiverData && caregiverData.fcmToken) {
                 await admin.messaging().send({
                    token: caregiverData.fcmToken,
                    notification: {
                       title: "Patient Alert: Missed Dose",
                       body: `${userData.name} missed their ${dose.medName} dose.`,
                    }
                 });
              }
           }
        }
      }
    }
    return null;
  });

/**
 * Daily Health Report Generator
 */
export const generateDailyReports = functions.pubsub
  .schedule("0 9 * * *") // Every day at 9 AM
  .onRun(async (context) => {
     // AI summary logic would go here, calling Gemini to summarize previous day's doses
     return null;
  });
