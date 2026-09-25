import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

import { preparerPhotoProfil } from "../utils/imageProfil";
import { useTranslation } from "../i18n";

interface AvatarPickerProps {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function AvatarPicker({
  name,
  value,
  onChange,
}: AvatarPickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const selectPhoto = async (file?: File) => {
    if (!file) return;

    try {
      setError("");
      onChange(await preparerPhotoProfil(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("avatarPicker.imageInvalide"));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 ring-4 ring-emerald-50">
          {value ? (
            <img src={value} alt={t("avatarPicker.photoDeAlt", { nom: name })} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
          aria-label={t("avatarPicker.modifierAria")}
          title={t("avatarPicker.modifierTitre")}
        >
          <Camera size={16} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => selectPhoto(event.target.files?.[0])}
        />
      </div>

      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-slate-800">{t("avatarPicker.photoLabel")}</p>
        <p className="mt-1 text-xs text-slate-500">{t("avatarPicker.formatDesc")}</p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <Trash2 size={13} />
            {t("avatarPicker.supprimerPhoto")}
          </button>
        )}
        {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
