/**
 * firestore.ts — Offline-safe Firestore read utilities
 */
import {
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  getDoc,
  getDocs,
} from "firebase/firestore";

export async function safeGetDoc<T>(
  ref: DocumentReference<T>
): Promise<DocumentSnapshot<T> | null> {
  try {
    return await getDoc(ref);
  } catch (err: any) {
    console.warn("CareMate [offline]: skipping getDoc for", ref.path);
    return null;
  }
}

export async function safeGetDocs<T>(
  q: Query<T>
): Promise<DocumentSnapshot<T>[]> {
  try {
    const snap: QuerySnapshot<T> = await getDocs(q);
    return snap.docs as DocumentSnapshot<T>[];
  } catch (err: any) {
    console.warn("CareMate [offline]: skipping getDocs query");
    return [];
  }
}
