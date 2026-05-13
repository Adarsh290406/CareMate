import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export function usePatientCaregivers(patientId: string | undefined) {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const fetchCaregivers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "caregiver"),
          where("patientIds", "array-contains", patientId)
        );
        const snap = await getDocs(q);
        setCaregivers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching caregivers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCaregivers();
  }, [patientId]);

  return { caregivers, loading };
}
