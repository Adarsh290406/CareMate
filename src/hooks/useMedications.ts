import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  pillsRemaining: number;
  refillAlertThreshold: number;
  patientId: string;
}

export function useMedications(patientId: string | undefined) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, "medications"),
      where("patientId", "==", patientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[];
      setMedications(docs);
      setLoading(false);
    }, (error) => {
      console.error("Medication fetch error:", error.message, {
        code: error.code,
        patientId
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  return { medications, loading };
}
