import os
from dotenv import load_dotenv
from supabase import create_client, Client


# ============================================================
# CONFIGURACIÓN
# ============================================================

TABLA_LIBROS = "libros"

CAMPO_ID = "id"
CAMPO_TITULO = "titulo"
CAMPO_AUTOR = "autor"
CAMPO_PORTADA = "portada_url"


# ============================================================
# SUPABASE
# ============================================================

def crear_cliente() -> Client:
    load_dotenv()

    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")

    if not url or not key:
        raise RuntimeError(
            "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY "
            "en el archivo .env"
        )

    return create_client(url, key)


# ============================================================
# LIBROS
# ============================================================

def obtener_libros_sin_portada(
    supabase: Client
) -> list:
    """Obtiene los libros cuya portada_url está vacía o NULL."""

    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(
            f"{CAMPO_ID},"
            f"{CAMPO_TITULO},"
            f"{CAMPO_AUTOR},"
            f"{CAMPO_PORTADA}"
        )
        .execute()
    )

    # Consideramos vacía tanto NULL como ""
    libros = [
        libro
        for libro in response.data
        if not libro.get(CAMPO_PORTADA)
    ]

    return libros


# ============================================================
# ACTUALIZAR
# ============================================================

def actualizar_portada(
    supabase: Client,
    libro_id,
    url: str
) -> None:
    """Actualiza la portada de un libro."""

    (
        supabase
        .table(TABLA_LIBROS)
        .update({
            CAMPO_PORTADA: url
        })
        .eq(
            CAMPO_ID,
            libro_id
        )
        .execute()
    )


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    print("=" * 60)
    print("CARGAR PORTADAS FALTANTES")
    print("=" * 60)

    try:

        # ----------------------------------------------------
        # Conectar
        # ----------------------------------------------------

        supabase = crear_cliente()

        print("\n✓ Conectado a Supabase")

        # ----------------------------------------------------
        # Obtener libros
        # ----------------------------------------------------

        libros = obtener_libros_sin_portada(
            supabase
        )

        if not libros:
            print(
                "\n✓ Todos los libros tienen una portada."
            )
            return

        print(
            f"\nSe encontraron "
            f"{len(libros)} libros sin portada."
        )

        # ----------------------------------------------------
        # Procesar libros
        # ----------------------------------------------------

        actualizados = 0
        omitidos = 0

        for i, libro in enumerate(libros, 1):

            titulo = libro.get(
                CAMPO_TITULO,
                "Sin título"
            )

            autor = libro.get(
                CAMPO_AUTOR,
                "Autor desconocido"
            )

            print("\n" + "=" * 60)
            print(
                f"LIBRO {i}/{len(libros)}"
            )
            print("=" * 60)

            print(f"Título: {titulo}")
            print(f"Autor:  {autor}")

            print(
                "\nIntroducí la URL de la portada."
            )
            print(
                "Enter = omitir este libro."
            )

            url = input("\nURL → ").strip()

            # Enter = no modificar
            if not url:
                print("→ Omitido.")
                omitidos += 1
                continue

            # ------------------------------------------------
            # Confirmación
            # ------------------------------------------------

            print(f"\nURL ingresada:")
            print(url)

            confirmar = input(
                "\n¿Guardar esta URL? [S/n]: "
            ).strip().lower()

            if confirmar in ("", "s", "si", "sí"):

                actualizar_portada(
                    supabase,
                    libro[CAMPO_ID],
                    url
                )

                print("✓ Portada actualizada.")
                actualizados += 1

            else:
                print("→ No se modificó.")
                omitidos += 1

        # ----------------------------------------------------
        # Resumen
        # ----------------------------------------------------

        print("\n" + "=" * 60)
        print("PROCESO TERMINADO")
        print("=" * 60)

        print(f"\n✓ Actualizados: {actualizados}")
        print(f"→ Omitidos:     {omitidos}")

    except Exception as e:

        print("\n✗ Error:")
        print(e)


if __name__ == "__main__":
    main()