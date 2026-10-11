
export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Evitar repetir la transformación de imágenes.
        if (/image-resizing/.test(request.headers.get("Via") || "")) {
            return env.ASSETS.fetch(request);
        }

        const esMiniatura = url.pathname.startsWith("/thumbs/");
        const esFotoCarrusel = url.pathname.startsWith("/fotos/");

        if (esMiniatura || esFotoCarrusel) {
            const nombre = url.pathname.replace(
                /^\/(?:thumbs|fotos)\//,
                ""
            );

            // El original permanece en /uploads/.
            const imagenOriginal = new URL(
                `/uploads/${nombre}`,
                request.url
            );

            // Las miniaturas mantienen 800 px.
            // El carrusel acepta únicamente 600 o 1400 px.
            let ancho = 800;

            if (esFotoCarrusel) {
                const anchoSolicitado = Number(url.searchParams.get("w"));

                ancho = anchoSolicitado === 600 ? 600 : 1400;
            }

            const opcionesImagen = {
                width: ancho,
                height: ancho,
                fit: "scale-down",
                format: "webp"
            };

            return fetch(imagenOriginal, {
                headers: request.headers,
                cf: {
                    image: opcionesImagen
                }
            });
        }

        // El resto de la web continúa funcionando igual.
        return env.ASSETS.fetch(request);
    }
};
