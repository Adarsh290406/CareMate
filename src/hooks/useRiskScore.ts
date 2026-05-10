import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useRiskScore(patientId: string | undefined) {
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const unsubscribe = onSnapshot(doc(db, "riskScores", patientId), (doc) => {
      if (doc.exists()) {
        setRisk(doc.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  return { risk, loading };
}
