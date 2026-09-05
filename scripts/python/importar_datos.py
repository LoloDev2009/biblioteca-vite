import os
from dotenv import load_dotenv
from supabase import create_client, Client


# ============================================================
# CONFIGURACIÓN
# ============================================================

TABLA_LIBROS = "libros"

CAMPO_ID = "id"
CAMPO_TITULO = "titulo"
CAMPO_SAGA = "saga"

DETALLES_COPIABLES = {
    "numero_saga": "Número de saga",
    "idioma": "Idioma",
    "genero": "Género",
    "paginas": "Páginas",
    "ejemplares_totales": "Ejemplares totales",
    "estante": "Estante",
}


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
# SAGAS
# ============================================================

def obtener_sagas(supabase: Client) -> list:
    """Obtiene todas las sagas únicas."""

    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(CAMPO_SAGA)
        .not_.is_(CAMPO_SAGA, "null")
        .execute()
    )

    sagas = sorted({
        libro[CAMPO_SAGA]
        for libro in response.data
        if libro.get(CAMPO_SAGA)
    })

    return sagas


def seleccionar_saga(sagas: list) -> str:
    """Permite seleccionar una saga."""

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

def obtener_libros_de_saga(
    supabase: Client,
    saga: str
) -> list:
    """Obtiene todos los libros de una saga."""

    campos = ", ".join([
        CAMPO_ID,
        CAMPO_TITULO,
        CAMPO_SAGA,
        *DETALLES_COPIABLES.keys()
    ])

    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(campos)
        .eq(CAMPO_SAGA, saga)
        .order(CAMPO_TITULO)
        .execute()
    )

    return response.data


def mostrar_libros(
    libros: list,
    titulo: str = "LIBROS"
) -> None:

    print("\n" + "=" * 60)
    print(titulo)
    print("=" * 60)

    for i, libro in enumerate(libros, 1):
        print(
            f"{i}. "
            f"{libro.get(CAMPO_TITULO, 'Sin título')}"
        )


def seleccionar_libro_origen(libros: list) -> dict:
    """Selecciona el libro del cual copiar los detalles."""

    while True:
        try:
            numero = int(
                input("\n¿De qué libro tomar los detalles? → ")
            )

            if 1 <= numero <= len(libros):
                return libros[numero - 1]

        except ValueError:
            pass

        print("Selección inválida.")


def seleccionar_libros_destino(libros: list) -> list:
    """Selecciona los libros a los que se aplicarán los detalles."""

    print("\nPodés seleccionar varios separados por coma.")
    print("Ejemplo: 2,3,4")

    while True:
        entrada = input(
            "\n¿A qué libros aplicar los detalles? → "
        ).strip()

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

            # Eliminar duplicados manteniendo el orden
            numeros = list(dict.fromkeys(numeros))

            seleccionados = [
                libros[numero - 1]
                for numero in numeros
            ]

            return seleccionados

        except ValueError:
            print(
                "Selección inválida. "
                "Ejemplo: 2,3,4"
            )


# ============================================================
# DETALLES
# ============================================================

def mostrar_detalles(libro: dict) -> None:
    """Muestra los detalles del libro origen."""

    print("\n" + "=" * 60)
    print("DETALLES DEL LIBRO ORIGEN")
    print("=" * 60)

    print(f"\nLibro: {libro.get(CAMPO_TITULO, 'Sin título')}")

    for campo, nombre in DETALLES_COPIABLES.items():
        valor = libro.get(campo)

        if valor is None:
            valor = "NULL"

        print(f"  {nombre}: {valor}")


def seleccionar_detalles() -> list:
    """Permite seleccionar qué campos copiar."""

    campos = list(DETALLES_COPIABLES.keys())

    print("\n" + "=" * 60)
    print("DETALLES A COPIAR")
    print("=" * 60)

    for i, campo in enumerate(campos, 1):
        print(
            f"{i}. "
            f"{DETALLES_COPIABLES[campo]}"
        )

    print("\nPodés seleccionar varios separados por coma.")
    print("Ejemplo: 1,2,4,6")
    print("También podés escribir 'todos'.")

    while True:
        entrada = input(
            "\n¿Qué detalles aplicar? → "
        ).strip().lower()

        if entrada == "todos":
            return campos

        try:
            numeros = [
                int(x.strip())
                for x in entrada.split(",")
            ]

            if not numeros:
                raise ValueError

            if any(
                numero < 1 or numero > len(campos)
                for numero in numeros
            ):
                raise ValueError

            numeros = list(dict.fromkeys(numeros))

            return [
                campos[numero - 1]
                for numero in numeros
            ]

        except ValueError:
            print(
                "Selección inválida. "
                "Ejemplo: 1,2,4,6"
            )


# ============================================================
# ACTUALIZAR
# ============================================================

def actualizar_libros(
    supabase: Client,
    libros_destino: list,
    libro_origen: dict,
    detalles: list
) -> None:
    """Copia los detalles seleccionados a los libros destino."""

    valores = {
        campo: libro_origen.get(campo)
        for campo in detalles
    }

    for libro in libros_destino:

        (
            supabase
            .table(TABLA_LIBROS)
            .update(valores)
            .eq(
                CAMPO_ID,
                libro[CAMPO_ID]
            )
            .execute()
        )


# ============================================================
# RESUMEN
# ============================================================

def mostrar_resumen(
    libro_origen: dict,
    libros_destino: list,
    detalles: list
) -> None:

    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)

    print(
        f"\nLibro origen: "
        f"{libro_origen.get(CAMPO_TITULO, 'Sin título')}"
    )

    print("\nDetalles a copiar:")

    for campo in detalles:
        valor = libro_origen.get(campo)

        if valor is None:
            valor = "NULL"

        print(
            f"  • {DETALLES_COPIABLES[campo]}: "
            f"{valor}"
        )

    print("\nLibros destino:")

    for libro in libros_destino:
        print(
            f"  • "
            f"{libro.get(CAMPO_TITULO, 'Sin título')}"
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("COPIAR DETALLES ENTRE LIBROS")
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

        libros = obtener_libros_de_saga(
            supabase,
            saga
        )

        if not libros:
            print("No hay libros en esta saga.")
            return

        # ----------------------------------------------------
        # Seleccionar libro origen
        # ----------------------------------------------------

        mostrar_libros(
            libros,
            "LIBROS DE LA SAGA"
        )

        libro_origen = seleccionar_libro_origen(
            libros
        )

        mostrar_detalles(libro_origen)

        # ----------------------------------------------------
        # Seleccionar detalles
        # ----------------------------------------------------

        detalles = seleccionar_detalles()

        # ----------------------------------------------------
        # Seleccionar libros destino
        # ----------------------------------------------------

        libros_destino = seleccionar_libros_destino(
            libros
        )

        # Evitar aplicar a sí mismo
        libros_destino = [
            libro
            for libro in libros_destino
            if libro[CAMPO_ID] != libro_origen[CAMPO_ID]
        ]

        if not libros_destino:
            print(
                "\nNo hay libros destino "
                "después de excluir el libro origen."
            )
            return

        # ----------------------------------------------------
        # Resumen
        # ----------------------------------------------------

        mostrar_resumen(
            libro_origen,
            libros_destino,
            detalles
        )

        # ----------------------------------------------------
        # Confirmación
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

        actualizar_libros(
            supabase,
            libros_destino,
            libro_origen,
            detalles
        )

        print(
            f"\n✓ Se actualizaron "
            f"{len(libros_destino)} libros."
        )

    except Exception as e:
        print("\n✗ Error:")
        print(e)


if __name__ == "__main__":
    main()
