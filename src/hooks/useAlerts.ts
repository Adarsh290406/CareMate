import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Alert {
  id: string;
  patientId: string;
  type: "missed_dose" | "low_supply" | "interaction" | "sos";
  priority: "low" | "medium" | "critical";
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: any;
}

export function useAlerts(patientId: string | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    const q = query(
      collection(db, "alerts"),
      where("patientId", "==", patientId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((a: any) => a.type !== "chat_message") as Alert[];
      
      // Sort in memory
      docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setAlerts(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  const triggerSOS = async (message: string = "Emergency SOS triggered by patient.", metadata?: any) => {
    if (!patientId) return;
    try {
      await addDoc(collection(db, "alerts"), {
        patientId,
        type: "sos",
        priority: "critical",
        message,
        metadata: metadata || null,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("SOS trigger error:", error);
    }
  };

  const triggerLowSupplyAlert = async (medName: string, count: number) => {
    if (!patientId) return;
    try {
      await addDoc(collection(db, "alerts"), {
        patientId,
        type: "low_supply",
        priority: "medium",
        message: `Low supply: ${medName} (${count} remaining). Please refill soon.`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
       console.error("Refill alert error:", error);
    }
  };

  return { alerts, loading, triggerSOS, triggerLowSupplyAlert };
}
