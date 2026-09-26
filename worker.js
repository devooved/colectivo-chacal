export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Cuando Cloudflare está realizando la transformación,
        // dejamos que la petición vaya directamente al archivo original.
        if (/image-resizing/.test(request.headers.get("Via") || "")) {
            return env.ASSETS.fetch(request);
        }

        // Solo transformamos las imágenes solicitadas mediante /thumbs/
        if (url.pathname.startsWith("/thumbs/")) {
            const nombre = url.pathname.replace("/thumbs/", "");

            // El original permanece en /uploads/
            const imagenOriginal = new URL(
                `/uploads/${nombre}`,
                request.url
            );

            const respuesta = await fetch(imagenOriginal, {
                headers: request.headers,
                cf: {
                    image: {
                        width: 500,
                        height: 500,
                        fit: "scale-down",
                        format: "webp"
                    }
                }
            });

            return respuesta;
        }

        // Todo lo demás sigue funcionando como hasta ahora.
        return env.ASSETS.fetch(request);
    }
};