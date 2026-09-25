import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Le navigateur d'un téléphone n'autorise la géolocalisation (itinéraire de
// l'agent) qu'en HTTPS. Le serveur de développement est donc servi en HTTPS avec
// un certificat auto-signé, et l'API passe par le même serveur (/api) pour
// éviter le blocage « contenu mixte » d'une page HTTPS appelant une API HTTP.
//
// Exception : derrière un tunnel (ngrok, cloudflared…), c'est le tunnel qui
// fournit déjà un vrai certificat HTTPS au navigateur ; le certificat auto-signé
// local devient inutile et complique la connexion du tunnel. On peut donc le
// désactiver pour cette session avec VITE_HTTPS=false (PowerShell :
// $env:VITE_HTTPS="false"; npm run dev).
const httpsLocal = process.env.VITE_HTTPS !== "false";

const proxyApi = {
    "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
    },
};

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        ...(httpsLocal ? [basicSsl()] : []),
    ],
    server: {
        host: true,
        port: 5173,
        proxy: proxyApi,
        // Depuis Vite 6+, un nom d'hôte externe (tunnel ngrok/cloudflared, etc.)
        // est refusé par défaut ("Blocked request. This host is not allowed.").
        // Nécessaire pour partager l'application via un tunnel.
        allowedHosts: true,
    },
    preview: {
        host: true,
        proxy: proxyApi,
        allowedHosts: true,
    },
});
