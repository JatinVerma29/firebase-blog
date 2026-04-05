import { useState, useEffect } from "react";
import "./styles/global.css";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import PostsSection from "./components/PostsSection";
import { About, Footer } from "./components/About";
import WriteModal from "./components/WriteModal";
import PostReader from "./components/PostReader";
import BookmarksPanel from "./components/BookmarksPanel";
import FirebaseStatus from "./components/FirebaseStatus";
import ReadingProgress from "./components/ReadingProgress";
import AuthModal from "./components/AuthModal";
import CommunityPage from "./components/CommunityPage";
import UserProfilePage from "./components/UserProfilePage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

import { usePosts } from "./hooks/usePosts";
import { useDarkMode } from "./hooks/useDarkMode";
import { useAuth } from "./hooks/useAuth";
import { getBookmarks } from "./firebase/posts";

import { Toaster, toast } from "react-hot-toast";

function LoadingScreen({ done }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "#0c0c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      transition: "opacity 0.6s", opacity: done ? 0 : 1, pointerEvents: done ? "none" : "auto",
    }}>
      <h1 style={{ color: "#fff" }}>AERO BLOG</h1>
    </div>
  );
}

export default function App() {
  const [loadingDone, setLoadingDone]     = useState(false);
  const [showWrite, setShowWrite]         = useState(false);
  const [selectedPost, setSelectedPost]   = useState(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAuth, setShowAuth]           = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(getBookmarks().length);

  const { posts, loading, isDemo, addDemoPost } = usePosts();
  const [dark, setDark] = useDarkMode();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => { setTimeout(() => setLoadingDone(true), 1200); }, []);

  useEffect(() => {
    if (!showBookmarks && !selectedPost) setBookmarkCount(getBookmarks().length);
  }, [showBookmarks, selectedPost]);

  const handlePublished   = () => toast.success("Post published successfully!");
  const handleDemoPublish = (d) => { addDemoPost(d); handlePublished(); };
  const handleWriteClick  = () => { if (!user) { setShowAuth(true); return; } setShowWrite(true); };

  return (
    <>
      <Toaster position="top-right" />
      <LoadingScreen done={loadingDone || !authLoading} />
      <ReadingProgress />
      <FirebaseStatus />

      <Navbar
        onWriteClick={handleWriteClick}
        isDemo={isDemo} dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        bookmarkCount={bookmarkCount}
        onBookmarksClick={() => setShowBookmarks(true)}
        onCommunityClick={() => setShowCommunity(true)}
        onAuthClick={() => setShowAuth(true)}
        onProfileClick={() => setShowProfile(true)}
        onAnalyticsClick={() => setShowAnalytics(true)}
        user={user}
      />

      <main style={{ paddingTop: 36 }}>
        <Hero postCount={posts.length} onWriteClick={handleWriteClick}
          onExplore={() => document.getElementById("posts")?.scrollIntoView({ behavior: "smooth" })} />
        <Features />
        <PostsSection posts={posts} loading={loading} isDemo={isDemo} onOpenPost={setSelectedPost} />
        <About />
      </main>

      <Footer onWriteClick={handleWriteClick} />

      {showWrite && <WriteModal onClose={() => setShowWrite(false)} onPublished={handlePublished}
        isDemo={isDemo} onDemoPublish={handleDemoPublish} currentUser={user} />}

      {selectedPost && <PostReader post={selectedPost}
        onClose={() => { setSelectedPost(null); setBookmarkCount(getBookmarks().length); }}
        isDemo={isDemo} currentUser={user} allPosts={posts} />}

      {showBookmarks && <BookmarksPanel allPosts={posts}
        onOpenPost={(p) => { setShowBookmarks(false); setSelectedPost(p); }}
        onClose={() => setShowBookmarks(false)} />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)}
        onSuccess={() => toast.success("Welcome to AERO BLOG!")} />}

      {showCommunity && <CommunityPage onClose={() => setShowCommunity(false)}
        currentUser={user} isDemo={isDemo} />}

      {showProfile && <UserProfilePage currentUser={user} onClose={() => setShowProfile(false)}
        onOpenPost={(p) => { setShowProfile(false); setSelectedPost(p); }}
        allPosts={posts} isDemo={isDemo} />}

      {showAnalytics && <AnalyticsDashboard currentUser={user} allPosts={posts}
        onClose={() => setShowAnalytics(false)} />}
    </>
  );
}