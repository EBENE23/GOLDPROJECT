import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// Le navigateur d'un téléphone n'autorise la géolocalisation (itinéraire de
// l'agent) qu'en HTTPS. Le serveur de développement est donc servi en HTTPS avec
// un certificat auto-signé, et l'API passe par le même serveur (/api) pour
// éviter le blocage « contenu mixte » d'une page HTTPS appelant une API HTTP.
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
        basicSsl(),
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
