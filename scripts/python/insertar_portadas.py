from supabase_admin import crear_cliente

TABLA_LIBROS = "libros"
CAMPO_ID = "id"
CAMPO_TITULO = "titulo"
CAMPO_AUTOR = "autor"
CAMPO_PORTADA = "portada_url"


def obtener_libros_sin_portada(supabase):
    respuesta = (
        supabase
        .table(TABLA_LIBROS)
        .select(f"{CAMPO_ID}, {CAMPO_TITULO}, {CAMPO_AUTOR}, {CAMPO_PORTADA}")
        .execute()
    )

    libros = respuesta.data or []

    return [
        libro for libro in libros
        if not libro.get(CAMPO_PORTADA)
    ]


def main():
    supabase = crear_cliente()

    libros = obtener_libros_sin_portada(supabase)

    if not libros:
        print("No hay libros sin portada.")
        return

    print(f"\nLibros sin portada: {len(libros)}\n")

    actualizados = 0
    omitidos = 0

    for i, libro in enumerate(libros, 1):
        print(f"{i}. {libro.get(CAMPO_TITULO, 'Sin título')}")
        print(f"   Autor: {libro.get(CAMPO_AUTOR, 'Desconocido')}")

        url = input("   URL de portada (Enter para omitir): ").strip()

        if not url:
            omitidos += 1
            print()
            continue

        try:
            (
                supabase
                .table(TABLA_LIBROS)
                .update({
                    CAMPO_PORTADA: url
                })
                .eq(CAMPO_ID, libro[CAMPO_ID])
                .execute()
            )

            actualizados += 1
            print("   ✓ Actualizado\n")

        except Exception as e:
            print(f"   ✗ Error: {e}\n")

    print("=" * 40)
    print("RESUMEN")
    print("=" * 40)
    print(f"Actualizados: {actualizados}")
    print(f"Omitidos:     {omitidos}")


if __name__ == "__main__":
    main()