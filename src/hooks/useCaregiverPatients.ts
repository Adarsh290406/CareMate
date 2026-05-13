import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, getDocs, documentId } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useCaregiverPatients(caregiverId: string | undefined) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caregiverId) return;

    // Listen to caregiver's linked IDs
    const caregiverRef = doc(db, "users", caregiverId);
    
    const unsubscribe = onSnapshot(caregiverRef, async (snap) => {
      if (!snap.exists()) {
        setPatients([]);
        setLoading(false);
        return;
      }

      const ids = snap.data()?.patientIds || [];
      if (ids.length === 0) {
        setPatients([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch detailed info for these IDs
        const q = query(collection(db, "users"), where(documentId(), "in", ids));
        const pSnap = await getDocs(q);
        setPatients(pSnap.docs.map(d => ({
          uid: d.id,
          ...d.data()
        })));
      } catch (err) {
        console.error("Patient fetch err:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [caregiverId]);

  return { patients, loading };
}
