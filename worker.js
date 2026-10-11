
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

            // El original permanece intacto en /uploads/.
            const imagenOriginal = new URL(
                `/uploads/${nombre}`,
                request.url
            );

            let opcionesImagen;

            if (esMiniatura) {
                const anchoSolicitado = Number(
                    url.searchParams.get("w")
                );

                // Escritorio: 800 px. Móvil: 500 px.
                const ancho = anchoSolicitado === 500 ? 500 : 800;

                opcionesImagen = {
                    width: ancho,
                    height: ancho,
                    fit: "scale-down",
                    format: "webp"
                };

                // Calidad reducida únicamente para miniaturas móviles.
                if (ancho === 500) {
                    opcionesImagen.quality = 82;
                }
            } else {
                const anchoSolicitado = Number(
                    url.searchParams.get("w")
                );

                // Carrusel: 600 o 1400 px.
                const ancho = anchoSolicitado === 600 ? 600 : 1400;

                opcionesImagen = {
                    width: ancho,
                    height: ancho,
                    fit: "scale-down",
                    format: "webp"
                };

                // El carrusel móvil permanece igual.
                // Solo optimizamos el carrusel de escritorio.
                if (ancho === 1400) {
                    opcionesImagen.quality = 82;
                }
            }

            const respuesta = await fetch(imagenOriginal, {
                headers: request.headers,
                cf: {
                    image: opcionesImagen
                }
            });

            // Si la carga falla, conservar la respuesta de error.
            if (!respuesta.ok) {
                return respuesta;
            }

            // Caché privada del navegador durante 30 minutos.
            const respuestaConCache = new Response(
                respuesta.body,
                respuesta
            );

            respuestaConCache.headers.set(
                "Cache-Control",
                "private, max-age=1800"
            );

            return respuestaConCache;
        }

        // El resto de la web continúa funcionando igual.
        return env.ASSETS.fetch(request);
    }
};
