import os
from dotenv import load_dotenv
from supabase import create_client, Client
from supabase_admin import crear_cliente


# ============================================================
# CONFIGURACIÓN
# ============================================================

TABLA_LIBROS = "libros"

CAMPO_ID = "id"
CAMPO_TITULO = "titulo"
CAMPO_AUTOR = "autor"
CAMPO_SAGA = "saga"


# ============================================================
# AUTORES
# ============================================================

def obtener_autores(supabase: Client) -> list:
    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(CAMPO_AUTOR)
        .not_.is_(CAMPO_AUTOR, "null")
        .execute()
    )

    return sorted({
        libro[CAMPO_AUTOR]
        for libro in response.data
        if libro.get(CAMPO_AUTOR)
    })


def seleccionar_autor(autores: list) -> str:
    print("\n" + "=" * 60)
    print("AUTORES")
    print("=" * 60)

    for i, autor in enumerate(autores, 1):
        print(f"{i}. {autor}")

    while True:
        try:
            numero = int(input("\n¿Qué autor? → "))

            if 1 <= numero <= len(autores):
                return autores[numero - 1]

        except ValueError:
            pass

        print("Selección inválida.")


# ============================================================
# LIBROS
# ============================================================

def obtener_libros_por_autor(
    supabase: Client,
    autor: str
) -> list:

    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(
            f"{CAMPO_ID},"
            f"{CAMPO_TITULO},"
            f"{CAMPO_AUTOR},"
            f"{CAMPO_SAGA}"
        )
        .eq(CAMPO_AUTOR, autor)
        .order(CAMPO_TITULO)
        .execute()
    )

    return response.data


def seleccionar_libros(libros: list) -> list:

    print("\n" + "=" * 60)
    print("LIBROS")
    print("=" * 60)

    for i, libro in enumerate(libros, 1):
        saga = libro.get(CAMPO_SAGA) or "Sin saga"

        print(
            f"{i}. {libro.get(CAMPO_TITULO, 'Sin título')}"
            f"  [{saga}]"
        )

    print("\nSeleccioná los libros separados por coma.")
    print("Ejemplo: 1,2,4")

    while True:
        entrada = input("\n¿Qué libros? → ").strip()

        try:
            numeros = [
                int(x.strip())
                for x in entrada.split(",")
            ]

            if not numeros:
                raise ValueError

            if any(
                numero < 1 or numero > len(libros)
                for numero in numeros
            ):
                raise ValueError

            # Eliminar duplicados manteniendo orden
            numeros = list(dict.fromkeys(numeros))

            seleccionados = [
                libros[numero - 1]
                for numero in numeros
            ]

            print("\nLibros seleccionados:")

            for libro in seleccionados:
                print(
                    f"  ✓ {libro.get(CAMPO_TITULO, 'Sin título')}"
                )

            return seleccionados

        except ValueError:
            print(
                "Selección inválida. "
                "Ejemplo: 1,2,4"
            )


# ============================================================
# ACTUALIZAR
# ============================================================

def actualizar_saga(
    supabase: Client,
    libros: list,
    saga: str
) -> None:

    for libro in libros:
        (
            supabase
            .table(TABLA_LIBROS)
            .update({
                CAMPO_SAGA: saga
            })
            .eq(
                CAMPO_ID,
                libro[CAMPO_ID]
            )
            .execute()
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("ASIGNAR SAGA A LIBROS")
    print("=" * 60)

    try:

        # ----------------------------------------------------
        # Conectar
        # ----------------------------------------------------

        supabase = crear_cliente()

        print("\n✓ Conectado a Supabase")

        # ----------------------------------------------------
        # Elegir autor
        # ----------------------------------------------------

        autores = obtener_autores(supabase)

        if not autores:
            print("No hay autores.")
            return

        autor = seleccionar_autor(autores)

        print(f"\n✓ Autor: {autor}")

        # ----------------------------------------------------
        # Obtener libros del autor
        # ----------------------------------------------------

        libros = obtener_libros_por_autor(
            supabase,
            autor
        )

        if not libros:
            print("No hay libros para este autor.")
            return

        # ----------------------------------------------------
        # Elegir libros
        # ----------------------------------------------------

        libros_seleccionados = seleccionar_libros(
            libros
        )

        # ----------------------------------------------------
        # Elegir saga
        # ----------------------------------------------------

        print("\n" + "=" * 60)

        saga = input(
            "\n¿A qué saga pertenecen? → "
        ).strip()

        if not saga:
            print("\n✗ La saga no puede estar vacía.")
            return

        # ----------------------------------------------------
        # Resumen
        # ----------------------------------------------------

        print("\n" + "=" * 60)
        print("RESUMEN")
        print("=" * 60)

        print(f"\nAutor: {autor}")
        print(f"Saga: {saga}")
        print(
            f"Libros a modificar: "
            f"{len(libros_seleccionados)}"
        )

        print("\nLibros:")

        for libro in libros_seleccionados:
            print(
                f"  • {libro.get(CAMPO_TITULO, 'Sin título')}"
            )

        # ----------------------------------------------------
        # Confirmar
        # ----------------------------------------------------

        confirmar = input(
            "\n¿Confirmar? [s/N]: "
        ).strip().lower()

        if confirmar != "s":
            print("\nOperación cancelada.")
            return

        # ----------------------------------------------------
        # Actualizar
        # ----------------------------------------------------

        actualizar_saga(
            supabase,
            libros_seleccionados,
            saga
        )

        print(
            f"\n✓ Se actualizaron "
            f"{len(libros_seleccionados)} libros."
        )

        print(f"✓ Saga asignada: {saga}")

    except Exception as e:
        print("\n✗ Error:")
        print(e)


if __name__ == "__main__":
    main()