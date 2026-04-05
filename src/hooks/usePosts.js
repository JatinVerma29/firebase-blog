// src/hooks/usePosts.js — FIXED v2
import { useState, useEffect } from "react";
import { subscribeToPosts } from "../firebase/posts";
import { isFirebaseConfigured } from "../firebase/config";

// Sample posts for demo mode (when Firebase is not configured)
const DEMO_POSTS = [
  {
    id: "demo-1",
    title: "The Future of Reactive Blogging with Firebase",
    author: "Jatin Verma",
    category: "Technology",
    excerpt:
      "Discover how Firebase Firestore enables real-time data sync, making AERO BLOG the fastest publishing platform available today.",
    content: `Firebase Firestore is a flexible, scalable database for mobile, web, and server development. Like Firebase Realtime Database, it keeps your data in sync across client apps through realtime listeners and offers offline support for mobile and web.

AERO BLOG leverages this technology to deliver instant content updates across all connected clients. The moment you hit publish, your readers see the post — no refresh needed.

Key advantages of this approach:
• Zero-latency publishing experience
• Offline-first architecture with automatic sync
• Horizontal scaling with no infrastructure management
• Built-in security with Firebase Security Rules

This makes AERO BLOG the ideal platform for news portals, live events, and any scenario where timing matters.`,
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    likes: 42,
    views: 320,
    createdAt: { seconds: Date.now() / 1000 - 3600 },
  },
  {
    id: "demo-2",
    title: "Agile Methodologies in Modern Content Management",
    author: "Jatin",
    category: "Agile",
    excerpt:
      "How agile principles — sprint cycles, continuous feedback, and iterative design — transform the way we approach content strategy.",
    content: `Agile methodology has transformed software development. Now it is transforming content creation too. AERO BLOG was built from the ground up with agile principles embedded into every layer.

Sprint-based content planning allows teams to prioritize high-impact posts, measure engagement, and iterate rapidly. Continuous feedback loops between authors and readers drive content evolution in real time.

The three pillars of Agile Content:
1. Iterative Publishing — release early, refine often
2. Continuous Feedback — real-time engagement metrics  
3. Cross-functional Collaboration — writers, designers, and developers in sync

By applying these principles, AERO BLOG users consistently see 40% faster content cycles and significantly higher reader engagement.`,
    imageUrl:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
    likes: 28,
    views: 215,
    createdAt: { seconds: Date.now() / 1000 - 7200 },
  },
  {
    id: "demo-3",
    title: "Designing for Scale: AERO BLOG Architecture Deep Dive",
    author: "Jatin Verma",
    category: "Design",
    excerpt:
      "A deep dive into the modular, API-first architecture that powers AERO BLOG and enables seamless integration with enterprise systems.",
    content: `Scalability is not an afterthought in AERO BLOG — it is a foundational design principle. Every component of the system was designed to handle growth gracefully, from 10 readers to 10 million.

The architecture follows three core patterns:

Modular Microservices: Each feature (authentication, post management, media storage, search) operates as an independent service communicating via well-defined APIs.

Event-Driven Design: Firebase Cloud Functions respond to Firestore events, triggering actions like notifications, search indexing, and analytics updates automatically.

Edge Caching: Static assets are served from Firebase Hosting's global CDN, ensuring sub-100ms load times worldwide.

This architecture enables AERO BLOG to seamlessly integrate with CMS platforms, CRMs, marketing automation tools, and custom enterprise applications.`,
    imageUrl:
      "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80",
    likes: 61,
    views: 498,
    createdAt: { seconds: Date.now() / 1000 - 14400 },
  },
  {
    id: "demo-4",
    title: "Security Best Practices for Firebase Applications",
    author: "Jatin",
    category: "Technology",
    excerpt:
      "How AERO BLOG uses Firebase Security Rules, Authentication, and App Check to keep your content and users safe.",
    content: `Security in cloud-native applications is multi-layered, and AERO BLOG takes a defense-in-depth approach using every security primitive Firebase offers.

Firebase Authentication: Every write operation requires authentication. We support email/password, Google, GitHub, and enterprise SSO.

Firestore Security Rules: Granular rules ensure authors can only edit their own posts, readers have read-only access, and admin operations require elevated privileges.

Firebase App Check: Protects backend resources from abuse by verifying requests come from your legitimate app using device attestation.

Content Security Policy: A strict CSP prevents XSS attacks by whitelisting trusted content sources.

By combining these layers, AERO BLOG achieves enterprise-grade security without sacrificing developer experience.`,
    imageUrl:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    likes: 35,
    views: 278,
    createdAt: { seconds: Date.now() / 1000 - 21600 },
  },
  {
    id: "demo-5",
    title: "Building Your First AERO BLOG Integration",
    author: "Jatin Verma",
    category: "Tutorial",
    excerpt:
      "Step-by-step guide to integrating AERO BLOG with your existing tech stack using our comprehensive REST API and React SDK.",
    content: `Getting started with AERO BLOG integrations is straightforward, thanks to our comprehensive REST API and official SDKs.

Step 1: Get Your API Keys
Navigate to Settings → Developer → API Keys and generate a new key with the appropriate scopes for your use case.

Step 2: Install the SDK
npm install @aeroblog/sdk

Step 3: Initialize the Client
import { AeroBlog } from '@aeroblog/sdk';
const client = new AeroBlog({ apiKey: 'your-key' });

Step 4: Fetch Posts
const posts = await client.posts.list({ limit: 10 });

Step 5: Create a Post
await client.posts.create({
  title: 'My First Post',
  content: 'Hello, AERO BLOG!'
});

Within minutes your application is fully integrated. Happy building!`,
    imageUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    likes: 19,
    views: 143,
    createdAt: { seconds: Date.now() / 1000 - 28800 },
  },
  {
    id: "demo-6",
    title: "Real-time Analytics for the Modern Blogger",
    author: "Jatin",
    category: "Business",
    excerpt:
      "Understanding your audience in real-time transforms content strategy from guesswork to data-driven decision making.",
    content: `Modern blogging demands more than great writing — it requires understanding your audience at a granular level, in real time. AERO BLOG integrates Firebase Analytics to deliver actionable insights as they happen.

Track what matters:
• Live visitor counts and geographic distribution
• Scroll depth and reading time per post
• Click-through rates on internal links
• Device and browser breakdowns

These metrics feed directly into our recommendation engine, surfacing the most relevant content to each reader based on their behavior patterns.

The result? Higher engagement, lower bounce rates, and content that continuously improves based on real audience feedback rather than periodic surveys.`,
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    likes: 47,
    views: 389,
    createdAt: { seconds: Date.now() / 1000 - 36000 },
  },
];

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // isDemo is true ONLY when Firebase is NOT configured at all.
  // If Firebase IS configured but the database is just empty → isDemo stays false.
  // This is the fix for the "Demo Mode — Real-time disabled" badge showing incorrectly.
  const [isDemo, setIsDemo] = useState(!isFirebaseConfigured);

  useEffect(() => {
    // Firebase not configured at all → show sample posts, stay in demo mode
    if (!isFirebaseConfigured) {
      setPosts(DEMO_POSTS);
      setIsDemo(true);
      setLoading(false);
      return;
    }

    // Firebase IS configured → subscribe to real Firestore
    let unsubscribe;
    try {
      unsubscribe = subscribeToPosts((livePosts) => {
        if (livePosts.length > 0) {
          // Real posts in Firestore — use them
          setPosts(livePosts);
        } else {
          // Connected to Firebase but database is empty — show samples
          // so the UI is not blank, but DO NOT mark as demo
          setPosts(DEMO_POSTS);
        }
        setIsDemo(false); // Always false when Firebase is configured ✅
        setLoading(false);
      });
    } catch (err) {
      // Genuine connection error → fall back to demo mode
      setPosts(DEMO_POSTS);
      setIsDemo(true);
      setLoading(false);
      setError("Could not reach Firebase. Showing sample posts.");
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addDemoPost = (newPost) => {
    setPosts((prev) => [
      {
        id: `demo-${Date.now()}`,
        ...newPost,
        likes: 0,
        views: 0,
        createdAt: { seconds: Date.now() / 1000 },
      },
      ...prev,
    ]);
  };

  return { posts, loading, error, isDemo, addDemoPost };
}

export { DEMO_POSTS };