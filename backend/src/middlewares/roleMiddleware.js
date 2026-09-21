const autoriserRoles = (...rolesAutorises) => {
    return (req, res, next) => {
        // Vérification de l'authentification
        if (!req.user) {
            return res.status(401).json({
                message: "Utilisateur non authentifié."
            });
        }

        // Vérification du rôle
        const roleUtilisateur = String(req.user.role || "").toUpperCase();
        const rolesUtilisateur = new Set([
            roleUtilisateur,
            roleUtilisateur === "ADMIN" ? "ADMINISTRATEUR" : roleUtilisateur,
            roleUtilisateur === "ADMINISTRATOR" ? "ADMINISTRATEUR" : roleUtilisateur,
        ]);

        if (!rolesAutorises.some((role) => rolesUtilisateur.has(role))) {
            return res.status(403).json({
                message: "Accès interdit. Vous n'avez pas les droits nécessaires."
            });
        }

        next();
    };
};

module.exports = autoriserRoles;
