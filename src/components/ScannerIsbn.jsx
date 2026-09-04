import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const ID_VIEWPORT = 'lector-isbn-viewport'

// Escanea el código de barras (EAN-13, el formato que usan los ISBN impresos)
// usando la cámara del dispositivo. Llama a onDetectado(codigo) apenas
// reconoce uno y corta la cámara automáticamente.
export default function ScannerIsbn({ onDetectado, onCerrar }) {
  const scannerRef = useRef(null)
  const yaDetectoRef = useRef(false)
  const [error, setError] = useState(null)
  const [iniciando, setIniciando] = useState(true)

  useEffect(() => {
    const scanner = new Html5Qrcode(ID_VIEWPORT, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
      ],
      verbose: false,
    })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 130 } },
        (codigoDetectado) => {
          if (yaDetectoRef.current) return // evita disparos duplicados mientras se apaga la cámara
          yaDetectoRef.current = true
          detener().then(() => onDetectado(codigoDetectado))
        },
        () => {
          // Errores de decodeo frame a frame (no encontró código en ese cuadro).
          // Pasa todo el tiempo mientras se apunta la cámara, no hace falta mostrar nada.
        }
      )
      .then(() => setIniciando(false))
      .catch(() => {
        setIniciando(false)
        setError('No se pudo acceder a la cámara. Revisá que le hayas dado permiso al navegador.')
      })

    return () => {
      detener()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function detener() {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
      scanner.clear()
    } catch (e) {
      // La cámara puede estar ya detenida (por ejemplo si el usuario cambió de pantalla rápido); no pasa nada.
    }
  }

  async function handleCerrar() {
    await detener()
    onCerrar()
  }

  return (
    <div className="scanner-isbn">
      <div id={ID_VIEWPORT} className="scanner-viewport" />
      {iniciando && <p className="mensaje">Iniciando cámara...</p>}
      {error && <p className="error">{error}</p>}
      {!error && !iniciando && (
        <p className="scanner-ayuda">Apuntá al código de barras de la contratapa del libro</p>
      )}
      <button type="button" className="btn-secundario" onClick={handleCerrar}>
        Cancelar
      </button>
    </div>
  )
}
