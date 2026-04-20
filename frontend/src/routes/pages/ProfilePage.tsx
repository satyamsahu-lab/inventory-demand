import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { api } from "../../shared/api";
import type { ApiResponse } from "../../shared/types";
import { Toolbar } from "../../shared/components/Toolbar";
import { Button } from "../../shared/components/Button";

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

      <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-3xl">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <div className="text-sm font-medium">Profile image</div>
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 overflow-hidden grid place-items-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      className="h-full w-full object-cover"
                    />
                  ) : profile?.profile_image ? (
                    <img
                      src={profile.profile_image}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs">No image</div>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  Drag & drop not implemented yet; use file picker.
                </div>
              </div>

              <div className="mt-4">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                  }}
                />
                <div className="text-xs text-slate-500 mt-1">
                  Allowed: jpg, png (max 2MB)
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-8">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                value={profile?.email ?? ""}
                readOnly
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Full name</label>
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                value={fullName}
                placeholder="Enter full name"
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium">Hobbies</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {HOBBIES.map((h) => (
                  <label
                    key={h}
                    className="flex items-center gap-2 text-sm border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={hobbies.includes(h)}
                      onChange={() => toggleHobby(h)}
                    />
                    {h}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() =>
                  onSave().catch((e) =>
                    toast.error(
                      e?.response?.data?.settings?.message ?? "Update failed",
                    ),
                  )
                }
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
