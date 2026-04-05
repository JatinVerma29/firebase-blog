// src/firebase/community.js
import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, doc,
  updateDoc, increment, deleteDoc,
} from "firebase/firestore";
import { db } from "./config";

const COMMUNITY = "community";
const REPLIES   = "replies";

export const createCommunityPost = async (data) => {
  const ref = await addDoc(collection(db, COMMUNITY), {
    ...data,
    createdAt: serverTimestamp(),
    likes: 0,
    repliesCount: 0,
  });
  return ref.id;
};

export const subscribeToCommunity = (callback) => {
  const q = query(
    collection(db, COMMUNITY),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const addReply = async (postId, reply) => {
  const ref = await addDoc(
    collection(db, COMMUNITY, postId, REPLIES), {
      ...reply,
      createdAt: serverTimestamp(),
    }
  );
  await updateDoc(doc(db, COMMUNITY, postId), {
    repliesCount: increment(1),
  });
  return ref.id;
};

export const subscribeToReplies = (postId, callback) => {
  const q = query(
    collection(db, COMMUNITY, postId, REPLIES),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const likeCommunityPost = async (id) =>
  updateDoc(doc(db, COMMUNITY, id), { likes: increment(1) });

export const deleteCommunityPost = async (id) =>
  deleteDoc(doc(db, COMMUNITY, id));