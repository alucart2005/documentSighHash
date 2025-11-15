"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { calculateFileHash, formatAddress, formatTimestamp } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/contract";

export default function DocumentVerifier() {
  const { contract, isConnected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    documentInfo: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setVerificationResult(null);
    setStatus(null);

    try {
      setLoading(true);
      const fileHash = await calculateFileHash(selectedFile);
      setHash(fileHash);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Error calculando hash del archivo",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!hash || !contract) {
      setStatus({
        type: "error",
        message: "Por favor selecciona un archivo primero",
      });
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      // Verificar que el contrato esté desplegado
      // En ethers.js v6, el provider está en contract.runner.provider
      const provider = contract.runner?.provider;
      if (!provider) {
        throw new Error(
          "Provider no disponible. Asegúrate de estar conectado a Anvil."
        );
      }

      // Usar CONTRACT_ADDRESS directamente en lugar de contract.target para evitar errores
      // Verificar si el contrato tiene código
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (!code || code === "0x" || code === "0x0") {
        throw new Error(
          "El contrato no está desplegado en la dirección especificada. " +
            "Por favor despliega el contrato primero usando: " +
            "forge script script/FileHashStorage.s.sol:FileHashStorageScript --rpc-url http://localhost:8545 --broadcast"
        );
      }

      // Verificar si el documento existe
      let exists: boolean;
      try {
        exists = await contract.isDocumentStored(hash);
      } catch (callError: any) {
        // Si el error es BAD_DATA con value="0x", el contrato no está desplegado
        if (
          callError?.code === "BAD_DATA" ||
          callError?.message?.includes("could not decode result data")
        ) {
          throw new Error(
            "El contrato no está desplegado o la dirección es incorrecta. " +
              `Dirección actual: ${CONTRACT_ADDRESS}. ` +
              "Por favor verifica que el contrato esté desplegado y actualiza CONTRACT_ADDRESS en lib/contract.ts"
          );
        }
        throw callError;
      }

      if (!exists) {
        setStatus({
          type: "error",
          message: "El documento no está almacenado en la blockchain",
        });
        setVerificationResult(null);
        return;
      }

      // Obtener información del documento
      const [documentHash, timestamp, signer, signature] =
        await contract.getDocumentInfo(hash);

      // Verificar la firma
      const isValid = await contract.verifyDocument(hash, signer, signature);

      setVerificationResult({
        isValid,
        documentInfo: {
          hash: documentHash,
          timestamp,
          signer,
          signature,
        },
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Error al verificar el documento",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-verdigris-200 dark:border-lapis-lazuli-700">
        <p className="text-verdigris-700 dark:text-verdigris-300 font-medium">
          Conectando a Anvil...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-lg p-6 border-2 border-verdigris-200 dark:border-lapis-lazuli-700">
      <h2 className="text-2xl font-bold mb-6 text-indigo-dye dark:text-verdigris-200 flex items-center gap-2">
        <span className="text-2xl">🔍</span>
        Verificar Documento
      </h2>

      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-indigo-dye-600 dark:text-verdigris-300">
              Seleccionar Archivo para Verificar
            </label>
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg bg-keppel-100 dark:bg-keppel-900/30 hover:bg-keppel-200 dark:hover:bg-keppel-900/50 border border-keppel-300 dark:border-keppel-700 transition-colors"
              title="Ayuda"
              aria-label="Mostrar ayuda"
            >
              <span className="text-lg">❓</span>
            </button>
          </div>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-keppel-600 dark:text-verdigris-300
              file:mr-4 file:py-2.5 file:px-5
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-verdigris-500 file:text-white
              hover:file:bg-verdigris-600 file:transition-all
              file:shadow-md hover:file:shadow-lg file:cursor-pointer
              dark:file:bg-verdigris-600 dark:hover:file:bg-verdigris-700"
            disabled={loading}
          />
        </div>

        {file && (
          <div className="p-4 bg-verdigris-50 dark:bg-verdigris-900/20 rounded-xl border border-verdigris-200 dark:border-verdigris-700">
            <p className="text-sm text-indigo-dye-700 dark:text-verdigris-200">
              <span className="font-semibold">Archivo seleccionado:</span>{" "}
              {file.name}
            </p>
            <p className="text-xs text-keppel-600 dark:text-keppel-400 mt-2">
              El hash del documento se mostrará después de la verificación
              exitosa.
            </p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!hash || loading}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-verdigris-500 to-bondi-blue-500 hover:from-verdigris-600 hover:to-bondi-blue-600 disabled:from-indigo-dye-300 disabled:to-indigo-dye-300 
            text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:transform-none"
        >
          {loading ? "⏳ Verificando..." : "✓ Verificar Documento"}
        </button>

        {verificationResult && (
          <div className="p-5 bg-light-green-50 dark:bg-keppel-900/20 rounded-xl border border-light-green-200 dark:border-keppel-700 space-y-4">
            <div
              className={`p-4 rounded-xl border-2 ${
                verificationResult.isValid
                  ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600"
                  : "bg-bondi-blue-100 dark:bg-bondi-blue-900/30 border-bondi-blue-400 dark:border-bondi-blue-600"
              }`}
            >
              <p
                className={`font-bold text-lg ${
                  verificationResult.isValid
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-bondi-blue-800 dark:text-bondi-blue-200"
                }`}
              >
                {verificationResult.isValid ? "✓ Válido" : "✗ Inválido"}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              {/* Hash del documento - Solo visible después de verificación exitosa */}
              <div className="bg-white dark:bg-lapis-lazuli-800 rounded-lg p-3 border border-verdigris-200 dark:border-verdigris-700">
                <p className="text-xs font-medium text-keppel-600 dark:text-keppel-400 mb-1">
                  Hash del documento:
                </p>
                <p className="text-sm font-mono text-indigo-dye dark:text-keppel-100 break-all select-all">
                  {verificationResult.documentInfo.hash}
                </p>
              </div>
              <p className="text-indigo-dye-700 dark:text-keppel-200">
                <span className="font-semibold">Timestamp:</span>{" "}
                <span className="text-indigo-dye dark:text-keppel-100">
                  {formatTimestamp(verificationResult.documentInfo.timestamp)}
                </span>
              </p>
              <p className="text-indigo-dye-700 dark:text-keppel-200">
                <span className="font-semibold">Signer:</span>{" "}
                <span className="font-mono text-indigo-dye dark:text-keppel-100">
                  {formatAddress(verificationResult.documentInfo.signer)}
                </span>
              </p>
            </div>
          </div>
        )}

        {status && status.type === "error" && !verificationResult && (
          <div className="p-4 rounded-xl border-2 bg-bondi-blue-50 dark:bg-bondi-blue-900/30 border-bondi-blue-300 dark:border-bondi-blue-600">
            <p className="text-sm font-medium text-bondi-blue-800 dark:text-bondi-blue-200">
              ⚠ {status.message}
            </p>
          </div>
        )}
      </div>

      {/* Panel de ayuda emergente */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-lapis-lazuli-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-emerald-200 dark:border-lapis-lazuli-700">
            <div className="sticky top-0 bg-white dark:bg-lapis-lazuli-900 border-b border-emerald-200 dark:border-lapis-lazuli-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-indigo-dye dark:text-emerald-200 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Ayuda: Verificar Documento
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 rounded-lg hover:bg-keppel-100 dark:hover:bg-keppel-900/30 transition-colors"
                aria-label="Cerrar ayuda"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="p-6 space-y-6 text-keppel-700 dark:text-keppel-300">
              {/* Instrucciones paso a paso */}
              <div>
                <h4 className="font-semibold text-lg text-indigo-dye dark:text-emerald-200 mb-3">
                  📋 Instrucciones paso a paso
                </h4>
                <ol className="list-decimal list-inside space-y-3 ml-2">
                  <li>
                    <strong>Selecciona un archivo:</strong> Haz clic en el botón{" "}
                    <span className="font-mono bg-keppel-100 dark:bg-keppel-900/30 px-2 py-1 rounded">
                      "Examinar"
                    </span>{" "}
                    y elige el documento que deseas verificar.
                  </li>
                  <li>
                    <strong>Verifica el archivo:</strong> Una vez seleccionado,
                    haz clic en el botón{" "}
                    <span className="font-mono bg-keppel-100 dark:bg-keppel-900/30 px-2 py-1 rounded">
                      "Verificar Documento"
                    </span>{" "}
                    para iniciar el proceso de verificación.
                  </li>
                  <li>
                    <strong>Revisa los resultados:</strong> Después de la
                    verificación, se mostrará si el documento es válido o no,
                    junto con información detallada como el hash, timestamp y el
                    signer.
                  </li>
                </ol>
              </div>

              {/* Ejemplos de uso */}
              <div>
                <h4 className="font-semibold text-lg text-indigo-dye dark:text-emerald-200 mb-3">
                  📄 Ejemplos de uso
                </h4>
                <div className="space-y-3">
                  <div className="bg-keppel-50 dark:bg-keppel-900/20 p-4 rounded-lg border border-keppel-200 dark:border-keppel-700">
                    <p className="font-semibold text-indigo-dye dark:text-emerald-200 mb-2">
                      Verificar un documento almacenado:
                    </p>
                    <p className="text-sm">
                      Si ya has almacenado un documento previamente usando la
                      función "Subir Documento", puedes verificar su integridad
                      seleccionando el mismo archivo y haciendo clic en
                      "Verificar Documento".
                    </p>
                  </div>
                  <div className="bg-keppel-50 dark:bg-keppel-900/20 p-4 rounded-lg border border-keppel-200 dark:border-keppel-700">
                    <p className="font-semibold text-indigo-dye dark:text-emerald-200 mb-2">
                      Verificar autenticidad:
                    </p>
                    <p className="text-sm">
                      El sistema verifica que el documento no haya sido
                      modificado desde su almacenamiento original, comparando el
                      hash del archivo con el hash almacenado en la blockchain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Información importante */}
              <div>
                <h4 className="font-semibold text-lg text-indigo-dye dark:text-emerald-200 mb-3">
                  ⚠️ Información importante
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    El documento debe haber sido previamente almacenado en la
                    blockchain para poder ser verificado.
                  </li>
                  <li>
                    El hash del documento solo se muestra después de una
                    verificación exitosa para mantener la privacidad.
                  </li>
                  <li>
                    La verificación confirma tanto la existencia del documento
                    en la blockchain como la validez de su firma digital.
                  </li>
                  <li>
                    Si el documento no está almacenado, recibirás un mensaje de
                    error indicando que no se encontró en la blockchain.
                  </li>
                </ul>
              </div>

              {/* Qué se verifica */}
              <div>
                <h4 className="font-semibold text-lg text-indigo-dye dark:text-emerald-200 mb-3">
                  ✅ ¿Qué se verifica?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm mb-1">
                      Integridad
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Confirma que el documento no ha sido modificado
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm mb-1">
                      Autenticidad
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Verifica la firma digital del documento
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm mb-1">
                      Existencia
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Confirma que el documento está en la blockchain
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm mb-1">
                      Timestamp
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Muestra cuándo fue almacenado el documento
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="pt-4 border-t border-keppel-200 dark:border-keppel-700">
                <p className="text-sm text-keppel-600 dark:text-keppel-400">
                  💡 <strong>Tip:</strong> Asegúrate de seleccionar exactamente
                  el mismo archivo que fue almacenado originalmente. Cualquier
                  modificación, por mínima que sea, resultará en un hash
                  diferente y la verificación fallará.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-lapis-lazuli-900 border-t border-emerald-200 dark:border-lapis-lazuli-700 p-6">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
