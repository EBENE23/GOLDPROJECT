interface AvatarProps {
  prenom?: string | null;
  nom?: string | null;
  photo?: string | null;
  // Diamètre en pixels.
  taille?: number;
  className?: string;
}

/** Photo de profil, ou les initiales lorsque la personne n'en a pas. */
export default function Avatar({ prenom, nom, photo, taille = 40, className = "" }: AvatarProps) {
  const initiales = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";
  const style = { width: taille, height: taille, fontSize: Math.max(11, taille * 0.38) };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 font-bold text-emerald-700 ${className}`}
      style={style}
    >
      {photo ? (
        <img src={photo} alt={`Photo de ${prenom ?? ""} ${nom ?? ""}`.trim()} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initiales
      )}
    </span>
  );
}
