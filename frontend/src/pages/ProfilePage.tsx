import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Mail, User, Heart } from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import type { ApiResponse } from "../types/index";
import { Toolbar } from "../components/layout/Toolbar";
import { Button } from "../components/ui/Button";
import { FieldError } from "../components/ui/FieldError";
import { cn } from "../utils/cn";

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
});

const HOBBIES = ["Reading", "Sports", "Music", "Travel", "Gaming", "Cooking"];

type Profile = {
  id: string;
  full_name: string;
  email: string;
  profile_image: string | null;
  hobbies: string[];
};

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  async function load() {
    const res = await api.get<ApiResponse<{ record: any }>>("/profile");
    const p = res.data.data.record as Profile;
    setProfile(p);
    setFullName(p.full_name);
    setHobbies((p.hobbies as any) ?? []);
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load profile",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave() {
    setErrors({});
    const result = profileSchema.safeParse({ fullName });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const form = new FormData();
    form.append("full_name", fullName);
    // send hobbies as repeated fields
    for (const h of hobbies) form.append("hobbies[]", h);
    if (file) form.append("profile_image", file);

    await api.put("/profile", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Updated");
    setFile(null);
    setErrors({});
    await load();
  }

  function toggleHobby(h: string) {
    setHobbies((cur) =>
      cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h],
    );
  }

  return (
    <div>
      <Toolbar
        title="My Profile"
        subtitle="Update your name, picture, and hobbies"
      />

      <div className="card-premium p-8 max-w-4xl">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-4">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="h-40 w-40 rounded-[2.5rem] bg-surface-50 border-4 border-white shadow-premium-lg overflow-hidden grid place-items-center relative z-10">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                    />
                  ) : profile?.profile_image ? (
                    <img
                      src={profile.profile_image}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-surface-400 gap-2">
                      <User size={48} strokeWidth={1} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        No Image
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <div className="absolute -inset-2 bg-premium-gradient rounded-[2.8rem] opacity-20 blur-xl scale-95 group-hover:scale-100 transition-transform" />
              </div>

              <div className="mt-6 w-full">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                  }}
                />
                <Button
                  variant="secondary"
                  className="w-full h-11"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  <Camera size={18} className="text-[hsl(var(--primary))]" />
                  <span>Change Photo</span>
                </Button>
                <p className="text-[10px] text-surface-400 text-center font-bold uppercase tracking-widest mt-3">
                  JPG or PNG (Max 2MB)
                </p>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-1 mb-1">
                  <Mail size={12} className="text-[hsl(var(--primary))]" />
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    Account Email
                  </label>
                </div>
                <input
                  className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm font-medium text-surface-500 cursor-not-allowed shadow-inner-soft"
                  value={profile?.email ?? ""}
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-1 mb-1">
                  <User size={12} className="text-[hsl(var(--primary))]" />
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    Display Name
                  </label>
                </div>
                <input
                  className={cn(
                    "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
                    errors.fullName
                      ? "border-rose-500 ring-4 ring-rose-500/10"
                      : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
                  )}
                  value={fullName}
                  placeholder="Enter your full name"
                  onChange={(e) => setFullName(e.target.value)}
                />
                <FieldError error={errors.fullName} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-1 mb-1">
                  <Heart size={12} className="text-[hsl(var(--primary))]" />
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    Your Hobbies
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {HOBBIES.map((h) => {
                    const isSelected = hobbies.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggleHobby(h)}
                        className={cn(
                          "px-4 py-3 rounded-2xl text-xs font-bold border transition-all duration-300 text-left relative overflow-hidden group",
                          isSelected
                            ? "bg-[hsl(var(--secondary))] border-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] shadow-sm"
                            : "bg-white border-surface-100 text-surface-500 hover:border-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))] hover:bg-surface-50",
                        )}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          {h}
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-100 flex justify-end">
              <Button
                className="h-12 px-10 shadow-brand-200"
                onClick={() =>
                  onSave().catch((e) =>
                    toast.error(
                      e?.response?.data?.settings?.message ?? "Update failed",
                    ),
                  )
                }
              >
                Save Profile Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
