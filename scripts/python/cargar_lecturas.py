import os
from dotenv import load_dotenv
from supabase import create_client, Client


# ============================================================
# CONFIGURACIÓN
# ============================================================

TABLA_PERFILES = "perfiles"
TABLA_LIBROS = "libros"
TABLA_LECTURAS = "lecturas"

CAMPO_PERFIL_ID = "id"
CAMPO_PERFIL_NOMBRE = "nombre"

CAMPO_LIBRO_ID = "id"
CAMPO_LIBRO_SAGA = "saga"

CAMPO_LECTURA_LIBRO = "libro_id"
CAMPO_LECTURA_PERFIL = "perfil_id"


# ============================================================
# SUPABASE
# ============================================================

def crear_cliente() -> Client:
    """Crea el cliente de Supabase usando las variables del .env."""

    load_dotenv()

    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY")

    if not url or not key:
        raise RuntimeError(
            "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env"
        )

    return create_client(url, key)


# ============================================================
# PERFILES
# ============================================================

def obtener_perfiles(supabase: Client) -> list:
    """Obtiene ID y nombre de todos los perfiles."""

    response = (
        supabase
        .table(TABLA_PERFILES)
        .select(f"{CAMPO_PERFIL_ID}, {CAMPO_PERFIL_NOMBRE}")
        .order(CAMPO_PERFIL_NOMBRE)
        .execute()
    )

    return response.data


def seleccionar_perfiles(perfiles: list) -> list:
    """Muestra los perfiles y permite seleccionar uno o varios."""

    print("\n" + "=" * 60)
    print("PERFILES")
    print("=" * 60)

    for i, perfil in enumerate(perfiles, start=1):
        print(f"{i}. {perfil[CAMPO_PERFIL_NOMBRE]}")

    print("\nPodés seleccionar varios separados por coma.")
    print("Ejemplo: 1,3,4")

    while True:
        entrada = input("\n¿Quién/quiénes? → ").strip()

        try:
            indices = [
                int(x.strip())
                for x in entrada.split(",")
            ]

            if not indices:
                raise ValueError

            if any(i < 1 or i > len(perfiles) for i in indices):
                raise ValueError

            # Eliminar duplicados manteniendo el orden
            indices = list(dict.fromkeys(indices))

            seleccionados = [
                perfiles[i - 1]
                for i in indices
            ]

            print("\nPerfiles seleccionados:")
            for perfil in seleccionados:
                print(f"  ✓ {perfil[CAMPO_PERFIL_NOMBRE]}")

            return seleccionados

        except ValueError:
            print("Selección inválida. Ejemplo válido: 1,3,4")


# ============================================================
# SAGAS
# ============================================================

def obtener_sagas(supabase: Client) -> list:
    """Obtiene todas las sagas únicas de libros."""

    response = (
        supabase
        .table(TABLA_LIBROS)
        .select(CAMPO_LIBRO_SAGA)
        .not_.is_(CAMPO_LIBRO_SAGA, "null")
        .execute()
    )

    # Eliminar duplicados y valores vacíos
    sagas = sorted({
        libro[CAMPO_LIBRO_SAGA]
        for libro in response.data
        if libro.get(CAMPO_LIBRO_SAGA)
    })

    return sagas


def seleccionar_sagas(sagas: list) -> list:
    """Muestra las sagas y permite seleccionar una o varias."""

    print("\n" + "=" * 60)
    print("SAGAS")
    print("=" * 60)

    for i, saga in enumerate(sagas, start=1):
        print(f"{i}. {saga}")

    print("\nPodés seleccionar varias separadas por coma.")
    print("Ejemplo: 2,5,8")

    while True:
        entrada = input("\n¿Qué saga/saga? → ").strip()

        try:
            indices = [
                int(x.strip())
                for x in entrada.split(",")
            ]

            if not indices:
                raise ValueError

            if any(i < 1 or i > len(sagas) for i in indices):
                raise ValueError

            indices = list(dict.fromkeys(indices))

            seleccionadas = [
                sagas[i - 1]
                for i in indices
            ]

            print("\nSagas seleccionadas:")
            for saga in seleccionadas:
                print(f"  ✓ {saga}")

            return seleccionadas

        except ValueError:
            print("Selección inválida. Ejemplo válido: 2,5,8")


# ============================================================
# LIBROS
# ============================================================

def obtener_libros_de_sagas(
    supabase: Client,
    sagas: list
) -> list:
    """Obtiene los libros pertenecientes a las sagas seleccionadas."""

    libros = []

    for saga in sagas:
        response = (
            supabase
            .table(TABLA_LIBROS)
            .select(f"{CAMPO_LIBRO_ID}, {CAMPO_LIBRO_SAGA}")
            .eq(CAMPO_LIBRO_SAGA, saga)
            .execute()
        )

        libros.extend(response.data)

    return libros


# ============================================================
# LECTURAS
# ============================================================

def crear_lecturas(
    libros: list,
    perfiles: list
) -> list:
    """Genera todas las combinaciones libro/perfil."""

    lecturas = []

    for perfil in perfiles:
        for libro in libros:
            lecturas.append({
                CAMPO_LECTURA_LIBRO: libro[CAMPO_LIBRO_ID],
                CAMPO_LECTURA_PERFIL: perfil[CAMPO_PERFIL_ID]
            })

    return lecturas


def insertar_lecturas(
    supabase: Client,
    lecturas: list
) -> None:
    """Inserta las lecturas evitando duplicados."""

    if not lecturas:
        return

    supabase.table(TABLA_LECTURAS).upsert(
        lecturas,
        on_conflict=(
            f"{CAMPO_LECTURA_LIBRO},"
            f"{CAMPO_LECTURA_PERFIL}"
        ),
        ignore_duplicates=True
    ).execute()


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    print("=" * 60)
    print("ASIGNAR SAGAS A PERFILES")
    print("=" * 60)

    try:
        # ----------------------------------------------------
        # Conectar
        # ----------------------------------------------------

        supabase = crear_cliente()

        print("\n✓ Conectado a Supabase")

        # ----------------------------------------------------
        # Obtener perfiles
        # ----------------------------------------------------

        perfiles = obtener_perfiles(supabase)

        if not perfiles:
            print("No hay perfiles disponibles.")
            return

        perfiles_seleccionados = seleccionar_perfiles(perfiles)

        # ----------------------------------------------------
        # Obtener sagas
        # ----------------------------------------------------

        sagas = obtener_sagas(supabase)

        if not sagas:
            print("No hay sagas disponibles.")
            return

        sagas_seleccionadas = seleccionar_sagas(sagas)

        # ----------------------------------------------------
        # Obtener libros
        # ----------------------------------------------------

        libros = obtener_libros_de_sagas(
            supabase,
            sagas_seleccionadas
        )

        print(f"\n✓ Libros encontrados: {len(libros)}")

        # ----------------------------------------------------
        # Crear registros
        # ----------------------------------------------------

        lecturas = crear_lecturas(
            libros,
            perfiles_seleccionados
        )

        # ----------------------------------------------------
        # Confirmación
        # ----------------------------------------------------

        print("\n" + "=" * 60)
        print("RESUMEN")
        print("=" * 60)

        print("\nPerfiles:")
        for perfil in perfiles_seleccionados:
            print(f"  • {perfil[CAMPO_PERFIL_NOMBRE]}")

        print("\nSagas:")
        for saga in sagas_seleccionadas:
            print(f"  • {saga}")

        print(f"\nLibros: {len(libros)}")
        print(f"Registros a procesar: {len(lecturas)}")

        confirmar = input("\n¿Continuar? [s/N]: ").strip().lower()

        if confirmar != "s":
            print("\nOperación cancelada.")
            return

        # ----------------------------------------------------
        # Insertar
        # ----------------------------------------------------

        insertar_lecturas(
            supabase,
            lecturas
        )

        print("\n✓ Operación completada correctamente.")

    except Exception as e:
        print("\n✗ Error:")
        print(e)


if __name__ == "__main__":
    main()