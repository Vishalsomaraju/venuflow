import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  addDoc, 
  query, 
  QueryConstraint,
  onSnapshot,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  WithFieldValue
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Zone, Facility, Alert } from '../types';

// Generic converter for Firestore types
const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: WithFieldValue<T>): DocumentData => data as DocumentData,
  fromFirestore: (snap: QueryDocumentSnapshot): T => snap.data() as T,
});

// Typed references
export const refs = {
  users: collection(db, 'users').withConverter(createConverter<User>()),
  zones: collection(db, 'zones').withConverter(createConverter<Zone>()),
  facilities: collection(db, 'facilities').withConverter(createConverter<Facility>()),
  alerts: collection(db, 'alerts').withConverter(createConverter<Alert>()),
};

// Generic read/write helpers
export const getDocument = async <T extends DocumentData>(colName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, colName, id).withConverter(createConverter<T>());
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

export const setDocument = <T extends DocumentData>(colName: string, id: string, data: T) => {
  const docRef = doc(db, colName, id).withConverter(createConverter<T>());
  return setDoc(docRef, data);
};

export const updateDocument = <T extends DocumentData>(colName: string, id: string, data: Partial<T>) => {
  const docRef = doc(db, colName, id);
  return updateDoc(docRef, data as Record<string, unknown>);
};

export const addDocument = async <T extends DocumentData>(colName: string, data: T): Promise<string> => {
  const colRef = collection(db, colName).withConverter(createConverter<T>());
  const docRef = await addDoc(colRef, data);
  return docRef.id;
};

export const queryDocuments = async <T extends DocumentData>(colName: string, ...constraints: QueryConstraint[]): Promise<T[]> => {
  const colRef = collection(db, colName).withConverter(createConverter<T>());
  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

export const subscribeToDocuments = <T extends DocumentData>(
  colName: string,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
) => {
  const colRef = collection(db, colName).withConverter(createConverter<T>());
  const q = query(colRef, ...constraints);
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data()));
  });
};
