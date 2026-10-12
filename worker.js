export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Evitar repetir la transformación de imágenes.
        if (/image-resizing/.test(request.headers.get("Via") || "")) {
            return env.ASSETS.fetch(request);
        }

        const esMiniatura = url.pathname.startsWith("/thumbs/");
        const esFotoCarrusel = url.pathname.startsWith("/fotos/");

        if (esMiniatura || esFotoCarrusel) {
            const nombre = url.pathname.replace(/^\/(?:thumbs|fotos)\//, "");
            const imagenOriginal = new URL(`/uploads/${nombre}`, request.url);

            const anchoSolicitado = Number(url.searchParams.get("w"));
            let opcionesImagen;

            if (esMiniatura) {
                const ancho = anchoSolicitado === 500 ? 500 : 800;
                opcionesImagen = { width: ancho, height: ancho, fit: "scale-down", format: "webp" };
                if (ancho === 500) opcionesImagen.quality = 82;
            } else {
                const anchoSolicitado = Number(url.searchParams.get("w"));
                const ancho = anchoSolicitado === 600 ? 600 : 1400;
                opcionesImagen = { width: ancho, height: ancho, fit: "scale-down", format: "webp" };
                if (ancho === 1400) opcionesImagen.quality = 82;
            }

            const respuesta = await fetch(imagenOriginal, {
                headers: request.headers,
                cf: { image: opcionesImagen }
            });

            if (!respuesta.ok) return respuesta;

            const respuestaConCache = new Response(respuesta.body, respuesta);
            respuestaConCache.headers.set("Cache-Control", "private, max-age=1800");
            return respuestaConCache;
        }

        // --- SSR SEGURO PARA LA PÁGINA DE INICIO ---
        if (url.pathname === "/" || url.pathname === "/index.html") {
            try {
                const respuestaHtml = await env.ASSETS.fetch(request);
                const respuestaCatalogo = await env.ASSETS.fetch(new URL("/catalogo.json", request.url));

                if (respuestaHtml.ok && respuestaCatalogo.ok) {
                    const datos = await respuestaCatalogo.json();
                    const publicaciones = datos.publicaciones || [];

                    const htmlCatalogo = publicaciones.map((pub, idx) => {
                        const numero = String(idx + 1).padStart(2, "0");
                        const esLCP = idx === 0;
                        
                        let imgTag = "";
                        if (Array.isArray(pub.images) && pub.images.length > 0) {
                            const original = pub.images[0];
                            const src = original.startsWith("/uploads/") ? original.replace("/uploads/", "/thumbs/") : original;
                            const attrPriority = esLCP ? 'fetchpriority="high"' : 'loading="lazy"';
                            imgTag = `<img alt="${pub.title || ''}" decoding="async" ${attrPriority} src="${src}">`;
                        } else {
                            imgTag = `<span>IMAGEN ${numero}</span>`;
                        }

                        const href = pub.slug ? `publicacion.html?slug=${encodeURIComponent(pub.slug)}` : '#';

                        return `
                            <article class="producto">
                                <a href="${href}">
                                    <div class="producto-imagen">${imgTag}</div>
                                    <h2>${pub.title || ''}</h2>
                                    <p>${pub.price || ''}</p>
                                </a>
                            </article>
                        `;
                    }).join("");

                    return new HTMLRewriter()
                        .on("#catalogo", {
                            element(el) {
                                el.setInnerContent(htmlCatalogo, { html: true });
                            }
                        })
                        .transform(respuestaHtml);
                }
            } catch (error) {
                // Si algo falla en el servidor, registramos el error y servimos el HTML estático original sin romper la web
                console.error("Error en SSR Worker:", error);
            }
        }

        return env.ASSETS.fetch(request);
    }
};