import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Dose {
  id: string;
  medId: string;
  patientId: string;
  scheduledAt: Timestamp;
  takenAt: Timestamp | null;
  status: "pending" | "taken" | "missed" | "snoozed";
  photoUrl?: string;
  medName?: string;
}

export function useMedSchedule(patientId: string | undefined) {
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, "doses"),
      where("patientId", "==", patientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dose[];
      
      // Sort in memory to avoid index requirement
      docs.sort((a, b) => b.scheduledAt.toMillis() - a.scheduledAt.toMillis());
      
      setDoses(docs);
      setLoading(false);
    }, (error) => {
      console.error("Dose fetch error:", error.message, {
        code: error.code,
        patientId
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  return { doses, loading };
}
