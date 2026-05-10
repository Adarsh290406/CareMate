import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useCaregiverPatients(caregiverId: string | undefined) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caregiverId) return;

    // Fetch patients where this caregiver's ID is in their caregiverIds array
    const q = query(
      collection(db, "users"),
      where("caregiverIds", "array-contains", caregiverId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatients(docs);
      setLoading(false);
    }, (error) => {
      console.error("Caregiver patients fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caregiverId]);

  return { patients, loading };
}
