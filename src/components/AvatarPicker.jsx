// src/components/AvatarPicker.jsx
// Reusable avatar picker — shows preset avatars + custom upload option
// Usage: <AvatarPicker selected={url} onSelect={(url) => ...} />

import { useRef, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";
import { toast } from "react-hot-toast";

// ── Preset avatar sets ─────────────────────────────────────────────────────
// Using DiceBear API — free, no signup, generates beautiful SVG avatars
const STYLES = [
  { id: "adventurer",     label: "Adventurer" },
  { id: "avataaars",      label: "Cartoon"    },
  { id: "bottts",         label: "Robot"      },
  { id: "fun-emoji",      label: "Emoji"      },
  { id: "lorelei",        label: "Lorelei"    },
  { id: "micah",          label: "Micah"      },
];

const SEEDS = ["alpha","beta","gamma","delta","epsilon","zeta","eta","theta","iota","kappa","lambda","mu"];

function dicebearUrl(style, seed) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AvatarPicker({ selected, onSelect, uid, compact = false }) {
  const [activeStyle, setActiveStyle] = useState("adventurer");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef();

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const path = uid ? `avatars/${uid}` : `avatars/temp_${Date.now()}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise((res, rej) =>
        task.on(
          "state_changed",
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          rej,
          res
        )
      );
      const url = await getDownloadURL(task.snapshot.ref);
      onSelect(url);
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed, try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Currently selected preview ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
      }}>
        <div style={{
          width: compact ? 56 : 72, height: compact ? 56 : 72,
          borderRadius: "50%",
          border: "3px solid var(--blue)",
          overflow: "hidden",
          background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 0 4px var(--blue-glow)",
          transition: "box-shadow 0.3s",
        }}>
          {selected ? (
            <img src={selected} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 28 }}>👤</span>
          )}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
            {selected ? "Looking good! 🎉" : "Pick your avatar"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Choose a preset or upload your own photo
          </div>
        </div>
      </div>

      {/* ── Style tabs ── */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12,
      }}>
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStyle(s.id)}
            style={{
              padding: "4px 12px",
              borderRadius: 99,
              border: "1px solid",
              borderColor: activeStyle === s.id ? "var(--blue)" : "var(--border)",
              background: activeStyle === s.id ? "var(--blue-glow)" : "transparent",
              color: activeStyle === s.id ? "var(--blue)" : "var(--mid)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Avatar grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 8,
        marginBottom: 16,
      }}>
        {SEEDS.map((seed) => {
          const url = dicebearUrl(activeStyle, seed);
          const isSelected = selected === url;
          return (
            <button
              key={seed}
              onClick={() => onSelect(url)}
              title={`${activeStyle} — ${seed}`}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: "50%",
                border: isSelected ? "3px solid var(--blue)" : "2px solid var(--border)",
                padding: 2,
                background: isSelected ? "var(--blue-glow)" : "var(--bg-2)",
                cursor: "pointer",
                overflow: "hidden",
                transition: "all 0.18s",
                transform: isSelected ? "scale(1.12)" : "scale(1)",
                boxShadow: isSelected ? "0 0 0 3px var(--blue-glow)" : "none",
              }}
              onMouseEnter={(e) => !isSelected && (e.currentTarget.style.transform = "scale(1.08)")}
              onMouseLeave={(e) => !isSelected && (e.currentTarget.style.transform = "scale(1)")}
            >
              <img
                src={url}
                alt={seed}
                style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }}
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* ── Upload own photo ── */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: "2px dashed var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: uploading ? "wait" : "pointer",
          transition: "border-color 0.2s, background 0.2s",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--blue)";
          e.currentTarget.style.background = "var(--blue-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span style={{ fontSize: 20 }}>{uploading ? "⏳" : "📷"}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            {uploading ? `Uploading… ${uploadProgress}%` : "Upload your own photo"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>JPG, PNG or GIF · max 5MB</div>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div style={{
            marginLeft: "auto", width: 60, height: 4,
            background: "var(--border)", borderRadius: 99, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${uploadProgress}%`,
              background: "var(--blue)", borderRadius: 99,
              transition: "width 0.2s",
            }} />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
      />
    </div>
  );
}