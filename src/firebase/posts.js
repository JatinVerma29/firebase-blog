// src/firebase/posts.js
import {
  collection, addDoc, getDocs, getDoc, doc,
  deleteDoc, updateDoc, query, orderBy,
  onSnapshot, serverTimestamp, where, increment,
} from "firebase/firestore";
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "firebase/storage";
import { db, storage } from "./config";

const POSTS    = "posts";
const COMMENTS = "comments";

// ── Upload image to Firebase Storage ──
export const uploadImage = (file, onProgress) =>
  new Promise((resolve, reject) => {
    const storageRef = ref(storage, `blog-images/${Date.now()}_${file.name}`);
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      "state_changed",
      (snap) => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), path: storageRef.fullPath })
    );
  });

export const deleteImage = async (path) => {
  if (!path) return;
  try { await deleteObject(ref(storage, path)); } catch {}
};

// ── Posts CRUD ──
export const createPost = async (data) => {
  const docRef = await addDoc(collection(db, POSTS), {
    ...data,
    authorId:      data.uid,           // ✅ fixed: added authorId
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
    likes:         0,
    views:         0,
    commentsCount: 0,
  });
  return docRef.id;
};

export const subscribeToPosts = (callback) => {
  const q = query(collection(db, POSTS), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const getPost = async (id) => {
  const snap = await getDoc(doc(db, POSTS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updatePost = async (id, data) =>
  updateDoc(doc(db, POSTS, id), { ...data, updatedAt: serverTimestamp() });

export const deletePost = async (id, imagePath) => {
  await deleteDoc(doc(db, POSTS, id));
  if (imagePath) await deleteImage(imagePath);
};

export const likePost = async (id) =>
  updateDoc(doc(db, POSTS, id), { likes: increment(1) });

export const incrementViews = async (id) =>
  updateDoc(doc(db, POSTS, id), { views: increment(1) });

// ── Comments ──
export const addComment = async (postId, comment) => {
  const commentRef = await addDoc(collection(db, POSTS, postId, COMMENTS), {
    ...comment,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, POSTS, postId), { commentsCount: increment(1) });
  return commentRef.id;
};

export const subscribeToComments = (postId, callback) => {
  const q = query(
    collection(db, POSTS, postId, COMMENTS),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const deleteComment = async (postId, commentId) => {
  await deleteDoc(doc(db, POSTS, postId, COMMENTS, commentId));
  await updateDoc(doc(db, POSTS, postId), { commentsCount: increment(-1) });
};

// ── Bookmarks (localStorage) ──
export const getBookmarks = () => {
  try { return JSON.parse(localStorage.getItem("aero_bookmarks") || "[]"); }
  catch { return []; }
};

export const toggleBookmark = (postId) => {
  const bm  = getBookmarks();
  const idx = bm.indexOf(postId);
  if (idx === -1) bm.push(postId);
  else bm.splice(idx, 1);
  localStorage.setItem("aero_bookmarks", JSON.stringify(bm));
  return idx === -1;
};

export const isBookmarked = (postId) => getBookmarks().includes(postId);