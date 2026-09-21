import { useEffect, useState, type FormEvent } from "react";
import { Check, Mail, Phone, User, type LucideIcon } from "lucide-react";
import api from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import AvatarPicker from "../../components/AvatarPicker";
import {
  loadUserAvatar,
  saveUserAvatar,
} from "../../utils/userPreferences";

export default function Profil() {
  const { utilisateur } = useAuthStore();
  const [form, setForm] = useState({
    nom: utilisateur?.nom || "",
    prenom: utilisateur?.prenom || "",
    email: utilisateur?.email || "",
    telephone: utilisateur?.telephone || "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(() =>
    loadUserAvatar(utilisateur)
  );

  useEffect(() => {
    setAvatar(loadUserAvatar(utilisateur));
  }, [utilisateur?.idUtilisateur]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await api.put("/profil/me", form);
      useAuthStore.setState({ utilisateur: response.data.utilisateur });
      localStorage.setItem("smartcitywaste_user", JSON.stringify(response.data.utilisateur));
      saveUserAvatar(response.data.utilisateur, avatar);
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="app-page bg-slate-50"><div className="app-container max-w-3xl space-y-6"><div><p className="text-sm font-medium text-emerald-600">Mon compte</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Mon profil</h1><p className="mt-1 text-sm text-slate-500">Gérez les informations utilisées pour vos missions.</p></div>{message && <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><Check size={17} />{message}</div>}<form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><AvatarPicker name={`${form.prenom} ${form.nom}`} value={avatar} onChange={setAvatar} /><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Prénom" icon={User} value={form.prenom} onChange={(value) => setForm({...form, prenom: value})} /><Field label="Nom" icon={User} value={form.nom} onChange={(value) => setForm({...form, nom: value})} /><Field label="Email" icon={Mail} type="email" value={form.email} onChange={(value) => setForm({...form, email: value})} /><Field label="Téléphone" icon={Phone} value={form.telephone} onChange={(value) => setForm({...form, telephone: value})} /></div><button disabled={saving} onClick={() => saveUserAvatar(utilisateur, avatar)} className="mt-6 min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button></form></div></div>;
}

interface FieldProps {
  label: string;
  icon: LucideIcon;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}

function Field({ label, icon: Icon, type = "text", value, onChange }: FieldProps) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<div className="relative mt-1.5"><Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input required={label !== "Téléphone"} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50" /></div></label>;
}
