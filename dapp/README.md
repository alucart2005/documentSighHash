# FileHashStorage dApp

Aplicación descentralizada (dApp) para almacenar y verificar hashes de documentos en la blockchain Ethereum usando Foundry y Next.js.

## Características

- ✅ **100% Cliente**: Funciona completamente en el navegador
- ✅ **Conexión a Anvil**: JsonRpcProvider conectado directamente a Anvil (http://localhost:8545)
- ✅ **10 Wallets Integradas**: Sistema integrado con las 10 wallets de prueba de Anvil
- ✅ **Gestión de Estado**: Context API de React para compartir estado de wallet globalmente
- ✅ **Hash SHA-256**: Cálculo de hash usando crypto-js
- ✅ **Firmas ECDSA**: Firmas manejadas por Ethers.js con ethers.Wallet
- ✅ **Selector de Wallet**: Cambio dinámico entre las 10 cuentas de prueba
- ✅ **Verificación de Documentos**: Interfaz para verificar documentos almacenados
- ✅ **Visualización**: Estado de documentos en blockchain
- ✅ **Alertas de Confirmación**: Confirmación antes de firmar y almacenar

## Prerrequisitos

1. **Node.js** (v18 o superior)
2. **Foundry** instalado
3. **Anvil** corriendo en http://localhost:8545

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Desplegar el contrato en Anvil:

Primero, inicia Anvil en una terminal:

```bash
cd ../sc
anvil
```

En otra terminal, despliega el contrato:

```bash
cd ../sc
forge script script/FileHashStorage.s.sol:FileHashStorageScript --rpc-url http://localhost:8545 --broadcast
```

3. Actualizar la dirección del contrato:

Después del deployment, copia la dirección del contrato desplegado y actualízala en `lib/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "0x..."; // Dirección del contrato desplegado
```

## Uso

1. Inicia Anvil:

```bash
cd sc
anvil
```

2. Despliega el contrato (si aún no está desplegado):

```bash
cd sc
forge script script/FileHashStorage.s.sol:FileHashStorageScript --rpc-url http://localhost:8545 --broadcast
```

3. Inicia la aplicación Next.js:

```bash
cd dapp
npm run dev
```

4. Abre http://localhost:3000 en tu navegador

## Funcionalidades

### 1. Selección de Wallet

- Selecciona entre las 10 wallets de prueba de Anvil
- Visualiza la dirección de la wallet activa
- Cambio dinámico de wallet sin recargar la página

### 2. Subir y Almacenar Documento

- Selecciona un archivo desde tu computadora
- El hash SHA-256 se calcula automáticamente
- Confirma antes de firmar y almacenar
- La firma se realiza con la wallet activa
- El documento se almacena en la blockchain

### 3. Verificar Documento

- Selecciona un archivo para verificar
- El sistema busca el documento en la blockchain
- Verifica la firma usando ECDSA
- Muestra información completa del documento

### 4. Lista de Documentos

- Busca documentos por hash
- Visualiza información de documentos almacenados
- Escucha eventos de nuevos documentos en tiempo real

## Estructura del Proyecto

```
dapp/
├── app/
│   ├── layout.tsx          # Layout principal con Providers
│   ├── page.tsx            # Página principal
│   └── globals.css          # Estilos globales
├── components/
│   ├── WalletSelector.tsx   # Selector de wallet
│   ├── FileUpload.tsx       # Componente para subir archivos
│   ├── DocumentVerifier.tsx # Componente para verificar documentos
│   ├── DocumentList.tsx     # Lista de documentos
│   └── Providers.tsx        # Wrapper para providers
├── contexts/
│   └── WalletContext.tsx   # Context API para gestión de wallet
├── lib/
│   ├── contract.ts         # ABI y configuración del contrato
│   └── utils.ts            # Utilidades (hash, firmas, formateo)
└── package.json
```

## Tecnologías

- **Next.js 16**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Ethers.js v6**: Interacción con blockchain
- **Crypto-js**: Cálculo de hash SHA-256
- **Tailwind CSS 4**: Estilos
- **React 19**: Biblioteca UI

## Notas Importantes

1. **Anvil debe estar corriendo**: La aplicación requiere que Anvil esté ejecutándose en http://localhost:8545
2. **Dirección del contrato**: Asegúrate de actualizar `CONTRACT_ADDRESS` en `lib/contract.ts` después del deployment
3. **Wallets de prueba**: Las 10 wallets están preconfiguradas con las claves privadas de Anvil por defecto
4. **Firmas**: Las firmas se realizan usando el estándar Ethereum Signed Message

## Desarrollo

Para desarrollo con hot-reload:

```bash
npm run dev
```

Para build de producción:

```bash
npm run build
npm start
```

## Solución de Problemas

### Error: "Error connecting to Anvil"

- Asegúrate de que Anvil esté corriendo en http://localhost:8545
- Verifica que el puerto 8545 no esté siendo usado por otro proceso

### Error: "Contract not deployed"

- Despliega el contrato usando el script de Foundry
- Actualiza la dirección del contrato en `lib/contract.ts`

### Error: "Invalid signature"

- Verifica que el hash sea correcto (32 bytes)
- Asegúrate de que la wallet tenga fondos en Anvil

## Licencia

UNLICENSED
