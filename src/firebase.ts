import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  where,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { UserProfile, Transaction } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database with custom database ID and ignoreUndefinedProperties
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId || 'default');

// Define Collections
const USERS_COL = 'users';
const TRANSACTIONS_COL = 'transactions';

// --- Error Handling Interface & Helper (As required by Firebase Integration Skill) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Real-time Connection Test (As required by Firebase Integration Skill) ---
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

/**
 * Syncs user profiles from Firestore in real-time.
 */
export function subscribeUsers(onUpdate: (users: UserProfile[]) => void) {
  const q = collection(db, USERS_COL);
  return onSnapshot(q, (snapshot) => {
    const users: UserProfile[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    // Sort users by name or joinedAt for stable rendering
    users.sort((a, b) => a.name.localeCompare(b.name));
    onUpdate(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, USERS_COL);
  });
}

/**
 * Syncs transactions from Firestore in real-time.
 */
export function subscribeTransactions(onUpdate: (transactions: Transaction[]) => void) {
  const q = collection(db, TRANSACTIONS_COL);
  return onSnapshot(q, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((doc) => {
      txs.push(doc.data() as Transaction);
    });
    // Sort transactions by date descending, then ID descending
    txs.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    onUpdate(txs);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, TRANSACTIONS_COL);
  });
}

/**
 * Saves or updates a user profile in Firestore.
 */
export async function saveUserProfile(user: UserProfile) {
  const ref = doc(db, USERS_COL, user.id);
  try {
    await setDoc(ref, user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
}

/**
 * Deletes a user profile and all associated transactions in a single atomic batch operation.
 */
export async function deleteUserProfileAndData(userId: string) {
  const userRef = doc(db, USERS_COL, userId);
  const batch = writeBatch(db);
  batch.delete(userRef);

  try {
    // Query and delete all transaction docs for this user
    const txQuery = query(collection(db, TRANSACTIONS_COL), where('userId', '==', userId));
    const txSnapshot = await getDocs(txQuery);
    txSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `user_${userId}_and_transactions`);
  }
}

/**
 * Saves a transaction in Firestore.
 */
export async function saveTransaction(tx: Transaction) {
  const ref = doc(db, TRANSACTIONS_COL, tx.id);
  try {
    await setDoc(ref, tx, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TRANSACTIONS_COL}/${tx.id}`);
  }
}

/**
 * Deletes a transaction from Firestore.
 */
export async function deleteTransactionFromDb(id: string) {
  const ref = doc(db, TRANSACTIONS_COL, id);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TRANSACTIONS_COL}/${id}`);
  }
}

/**
 * Wipes all data (users and transactions) from Firestore for clean slate.
 */
export async function wipeAllDataFromDb() {
  try {
    const batch = writeBatch(db);

    // Get and delete all users
    const usersSnapshot = await getDocs(collection(db, USERS_COL));
    usersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Get and delete all transactions
    const txSnapshot = await getDocs(collection(db, TRANSACTIONS_COL));
    txSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'all_collections');
  }
}
