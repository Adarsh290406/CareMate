import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useIncomingCall(userId: string | undefined) {
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Query for active calls directed to this user
    const q = query(
      collection(db, "calls"),
      where("toId", "==", userId),
      where("status", "==", "calling")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort by createdAt desc in JS to avoid index requirement
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
        docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setIncomingCall(docs[0]);
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return { incomingCall, setIncomingCall };
}
