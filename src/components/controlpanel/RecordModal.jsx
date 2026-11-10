import { useState } from "react";
import { Icons } from "./Icons";
import Button from "./Button";
import Avatar from "./Avatar";
import { blank } from "./constants";
import InstagramEndpoints from "../../services/api-endpoints";

const inputCls = (err) =>
  `w-full rounded-lg border px-3 py-2 text-sm bg-[#0b1527] text-[#a0bce0] placeholder:text-[#3a5a8a] focus:outline-none focus:ring-2 focus:ring-[#3d7aba] ${
    err ? "border-red-400" : "border-[#1e3260]"
  }`;

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#a0bce0] mb-1">
        {label}{" "}
        {required ? (
          <span className="text-red-400">*</span>
        ) : (
          <span className="text-[#3a5a8a] font-normal">(optional)</span>
        )}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function RecordModal({ mode, record, onClose, onSave }) {
  const adv = mode === "advance";
  const editing = !!record;

  const [entries, setEntries] = useState(
    editing ? [{ ...blank(adv), ...record }] : [blank(adv)]
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, field, v) =>
    setEntries((es) => es.map((e) => (e._k === k ? { ...e, [field]: v } : e)));

  const pickFile = async (k, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      // Send old avatar URL so backend can delete it from S3
      const oldAvatarUrl = entries.find(e => e._k === k)?.avatar || '';
      if (oldAvatarUrl) formData.append('oldAvatarUrl', oldAvatarUrl);
      const res = await fetch(`${InstagramEndpoints.backendBaseUrl}/api/avatar/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        set(k, "avatar", data.data.url);
      } else {
        console.error('Avatar upload failed:', data.message);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
  };

  const validate = () => {
    const errs = {};
    entries.forEach((e) => {
      const x = {};
      if (!e.email.trim()) x.email = "Email is required";
      else if (!/^\S+@\S+\.\S+$/.test(e.email)) x.email = "Enter a valid email";
      if (adv) {
        if (!e.username.trim()) x.username = "Username is required";
        if (!e.deviceName.trim()) x.deviceName = "Device name is required";
        if (!e.address.trim()) x.address = "Address is required";
        if (!e.avatar) x.avatar = "Profile picture is required";
      }
      if (Object.keys(x).length) errs[e._k] = x;
    });
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(entries);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-[#0b1527] border border-[#1e3260] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1e3260] px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#a0bce0]">
            {adv && <Icons.Crown className="w-5 h-5 text-[#e8c97a]" />}
            {editing
              ? adv
                ? "Edit advance data"
                : "Edit simple data"
              : adv
              ? "Add new advance data"
              : "Add new simple data"}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[#3a5a8a] hover:bg-[#0f1e38] disabled:opacity-50"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {entries.map((e, i) => {
            const er = errors[e._k] || {};
            return (
              <div
                key={e._k}
                className="rounded-xl border border-[#1e3260] bg-[#060d1c]/30 p-4 space-y-3"
              >
                {entries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#3a5a8a]">
                      Entry {i + 1}
                    </span>
                    <button
                      onClick={() =>
                        setEntries(entries.filter((x) => x._k !== e._k))
                      }
                      aria-label="Remove entry"
                      className="text-[#3a5a8a] hover:text-red-400"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                )}

                <Field
                  label="Username"
                  required={adv}
                  error={er.username}
                >
                  <input
                    className={inputCls(er.username)}
                    value={e.username}
                    onChange={(ev) => set(e._k, "username", ev.target.value)}
                    placeholder="e.g. aarav_k"
                  />
                </Field>

                <Field label="Email" required error={er.email}>
                  <input
                    type="email"
                    className={inputCls(er.email)}
                    value={e.email}
                    onChange={(ev) => set(e._k, "email", ev.target.value)}
                    placeholder="name@company.com"
                  />
                </Field>

                {adv && (
                  <>
                    <Field
                      label="Device name"
                      required
                      error={er.deviceName}
                    >
                      <input
                        className={inputCls(er.deviceName)}
                        value={e.deviceName}
                        onChange={(ev) =>
                          set(e._k, "deviceName", ev.target.value)
                        }
                        placeholder="e.g. Redmi Note 12"
                      />
                    </Field>

                    <Field label="Address" required error={er.address}>
                      <input
                        className={inputCls(er.address)}
                        value={e.address}
                        onChange={(ev) => set(e._k, "address", ev.target.value)}
                        placeholder="City, country"
                      />
                    </Field>

                    <Field
                      label="Profile picture"
                      required
                      error={er.avatar}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={e.avatar} premium />
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1e3260] bg-[#0b1527] px-3 py-2 text-sm text-[#6ab0ff] hover:bg-[#0f1e38]">
                          <Icons.Upload />{" "}
                          {e.avatar ? "Change image" : "Upload image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(ev) => pickFile(e._k, ev.target.files[0])}
                          />
                        </label>
                      </div>
                    </Field>
                  </>
                )}
              </div>
            );
          })}

          {!editing && (
            <button
              onClick={() => setEntries([...entries, blank(adv)])}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#1e3260] px-3 py-2 text-sm text-[#6b8cba] hover:border-[#3d7aba] hover:text-[#6ab0ff]"
            >
              <Icons.Plus /> Add another entry
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#1e3260] px-5 py-3">
          <Button
            onClick={onClose}
            disabled={saving}
            className="border border-[#1e3260] bg-[#0b1527] text-[#a0bce0] hover:bg-[#0f1e38]"
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            loading={saving}
            className="bg-[#3d7aba] text-white hover:bg-[#2d6aa4]"
          >
            {saving ? "Saving" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
