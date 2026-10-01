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
CAMPO_SAGA = "saga"
CAMPO_ANIO = "paginas"#"anio_publicacion"

# ============================================================
# SAGAS
# ============================================================

def obtener_sagas(supabase: Client) -> list:
    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(CAMPO_SAGA)
        .not_.is_(CAMPO_SAGA, "null")
        .execute()
    )

    return sorted({
        libro[CAMPO_SAGA]
        for libro in response.data
        if libro.get(CAMPO_SAGA)
    })


def seleccionar_saga(sagas: list) -> str:
    print("\n" + "=" * 60)
    print("SAGAS")
    print("=" * 60)

    for i, saga in enumerate(sagas, 1):
        print(f"{i}. {saga}")

    while True:
        try:
            numero = int(input("\n¿Qué saga? → "))

            if 1 <= numero <= len(sagas):
                return sagas[numero - 1]

        except ValueError:
            pass

        print("Selección inválida.")


# ============================================================
# LIBROS
# ============================================================

def obtener_libros(
    supabase: Client,
    saga: str
) -> list:

    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(
            f"{CAMPO_ID},"
            f"{CAMPO_TITULO},"
            f"{CAMPO_SAGA},"
            f"{CAMPO_ANIO}"
        )
        .eq(CAMPO_SAGA, saga)
        .order(CAMPO_TITULO)
        .execute()
    )

    return response.data


def mostrar_libros(libros: list) -> None:
    print("\n" + "=" * 60)
    print("LIBROS")
    print("=" * 60)

    for i, libro in enumerate(libros, 1):

        anio = libro.get(CAMPO_ANIO)

        if anio is None:
            anio = "NULL"

        print(
            f"{i}. "
            f"{libro.get(CAMPO_TITULO, 'Sin título')}"
            f" → {anio}"
        )


# ============================================================
# AÑOS
# ============================================================

def pedir_anios(libros: list) -> list:
    """
    Pide un año por cada libro.

    Una posición vacía significa:
    'no modificar este libro'.

    Ejemplo:
        2009,,2006,,2048
    """

    cantidad = len(libros)

    print("\n" + "=" * 60)
    print("AÑOS")
    print("=" * 60)

    print(
        "\nIntroducí un año por libro, en el mismo orden."
    )

    print(
        "Dejá vacío entre comas para NO modificar ese libro."
    )

    print(
        f"\nHay {cantidad} libros."
    )

    while True:

        entrada = input(
            "\nAños → "
        )

        # IMPORTANTE:
        # split(",") conserva las posiciones vacías.
        valores = entrada.split(",")

        if len(valores) != cantidad:
            print(
                f"\n✗ Tenés que introducir exactamente "
                f"{cantidad} valores."
            )

            print(
                "Ejemplo:",
                ",".join(
                    "2009" if i % 2 == 0 else ""
                    for i in range(cantidad)
                )
            )

            continue

        anios = []
        valido = True

        for valor in valores:

            valor = valor.strip()

            # Campo vacío → no modificar
            if valor == "":
                anios.append(None)
                continue

            # Verificar que sea un número
            try:
                anio = int(valor)

                # Validación básica
                if anio < 0 or anio > 9999:
                    raise ValueError

                anios.append(anio)

            except ValueError:
                print(
                    f"\n✗ '{valor}' no es un año válido."
                )

                valido = False
                break

        if valido:
            return anios


# ============================================================
# ACTUALIZAR
# ============================================================

def actualizar_anios(
    supabase: Client,
    libros: list,
    anios: list
) -> int:
    """
    Actualiza únicamente las posiciones que
    no están vacías.
    """

    actualizados = 0

    for libro, anio in zip(libros, anios):

        # None significa:
        # NO modificar este libro.
        if anio is None:
            continue

        (
            supabase
            .table(TABLA_LIBROS)
            .update({
                CAMPO_ANIO: anio
            })
            .eq(
                CAMPO_ID,
                libro[CAMPO_ID]
            )
            .execute()
        )

        actualizados += 1

    return actualizados


# ============================================================
# RESUMEN
# ============================================================

def mostrar_resumen(
    libros: list,
    anios: list
) -> None:

    print("\n" + "=" * 60)
    print("CAMBIOS")
    print("=" * 60)

    for libro, anio in zip(libros, anios):

        titulo = libro.get(
            CAMPO_TITULO,
            "Sin título"
        )

        anterior = libro.get(CAMPO_ANIO)

        if anio is None:

            print(
                f"  - {titulo}: "
                f"NO MODIFICAR "
                f"(actual: {anterior})"
            )

        else:

            print(
                f"  ✓ {titulo}: "
                f"{anterior} → {anio}"
            )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("APLICAR AÑOS A UNA SAGA")
    print("=" * 60)

    try:

        # ----------------------------------------------------
        # Conectar
        # ----------------------------------------------------

        supabase = crear_cliente()

        print("\n✓ Conectado a Supabase")

        # ----------------------------------------------------
        # Seleccionar saga
        # ----------------------------------------------------

        sagas = obtener_sagas(supabase)

        if not sagas:
            print("No hay sagas disponibles.")
            return

        saga = seleccionar_saga(sagas)

        print(f"\n✓ Saga seleccionada: {saga}")

        # ----------------------------------------------------
        # Obtener libros
        # ----------------------------------------------------

        libros = obtener_libros(
            supabase,
            saga
        )

        if not libros:
            print("No hay libros en esta saga.")
            return

        mostrar_libros(libros)

        # ----------------------------------------------------
        # Pedir años
        # ----------------------------------------------------

        anios = pedir_anios(libros)

        # ----------------------------------------------------
        # Mostrar cambios
        # ----------------------------------------------------

        mostrar_resumen(
            libros,
            anios
        )

        # ----------------------------------------------------
        # Confirmar
        # ----------------------------------------------------

        confirmar = input(
            "\n¿Aplicar estos cambios? [s/N]: "
        ).strip().lower()

        if confirmar != "s":
            print("\nOperación cancelada.")
            return

        # ----------------------------------------------------
        # Actualizar
        # ----------------------------------------------------

        actualizados = actualizar_anios(
            supabase,
            libros,
            anios
        )

        print(
            f"\n✓ Se actualizaron "
            f"{actualizados} libros."
        )

        print(
            "✓ Los campos dejados vacíos "
            "no fueron modificados."
        )

    except Exception as e:

        print("\n✗ Error:")
        print(e)


if __name__ == "__main__":
    main()