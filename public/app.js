const galeriaImagen = document.querySelector(".galeria-imagen");
const galeriaPlaceholder = document.querySelector(".galeria-placeholder");
const flechaIzquierda = document.querySelector(".galeria-flecha-izquierda");
const flechaDerecha = document.querySelector(".galeria-flecha-derecha");

if (
    galeriaImagen &&
    galeriaPlaceholder &&
    flechaIzquierda &&
    flechaDerecha
) {
    const imagenes = [
        "01.webp",
        "02.webp",
        "03.webp"
    ];

    let imagenActual = 0;

    const imagen = document.createElement("img");

    imagen.alt = "PUBLICACIÓN 01";
    imagen.style.width = "100%";
    imagen.style.height = "100%";
    imagen.style.objectFit = "cover";
    imagen.style.display = "block";

    galeriaPlaceholder.remove();

    galeriaImagen.insertBefore(imagen, flechaIzquierda);

    function mostrarImagen() {
        imagen.src = imagenes[imagenActual];
    }

    flechaIzquierda.addEventListener("click", function () {
        imagenActual--;

        if (imagenActual < 0) {
            imagenActual = imagenes.length - 1;
        }

        mostrarImagen();
    });

    flechaDerecha.addEventListener("click", function () {
        imagenActual++;

        if (imagenActual >= imagenes.length) {
            imagenActual = 0;
        }

        mostrarImagen();
    });

    mostrarImagen();
}