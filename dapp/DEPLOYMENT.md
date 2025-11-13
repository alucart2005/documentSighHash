# Guía de Deployment del Contrato

## Problema: Error "could not decode result data (value="0x")"

Este error indica que **el contrato no está desplegado** en la dirección especificada en `lib/contract.ts`.

## Solución: Desplegar el Contrato

### Paso 1: Iniciar Anvil

En una terminal, inicia Anvil:

```bash
cd sc
anvil
```

Anvil debería mostrar algo como:

```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

### Paso 2: Desplegar el Contrato

En **otra terminal**, ejecuta el script de deployment:

```bash
cd sc
forge script script/FileHashStorage.s.sol:FileHashStorageScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Paso 3: Obtener la Dirección del Contrato

Después del deployment, busca en la salida una línea como:

```
Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

O busca en el archivo de broadcast:

```bash
cat sc/broadcast/FileHashStorage.s.sol/31337/run-latest.json | grep -A 5 "contractAddress"
```

### Paso 4: Actualizar la Dirección del Contrato

Actualiza `dapp/lib/contract.ts` con la dirección real:

```typescript
export const CONTRACT_ADDRESS = "0x..."; // Dirección del contrato desplegado
```

### Paso 5: Verificar el Deployment

Recarga la aplicación web. El componente `ContractStatus` debería mostrar:

- ✅ "Contrato desplegado" si todo está correcto
- ⚠️ "Contrato No Desplegado" si aún hay problemas

## Verificación Rápida

Puedes verificar si el contrato está desplegado usando:

```bash
cast code 0x5FbDB2315678afecb367f032d93F642f64180aa3 --rpc-url http://localhost:8545
```

Si devuelve `0x`, el contrato no está desplegado.
Si devuelve código (muchos caracteres hex), el contrato está desplegado.

## Troubleshooting

### Error: "Contract not deployed"

- Verifica que Anvil esté corriendo
- Verifica que el deployment se completó exitosamente
- Verifica que la dirección en `lib/contract.ts` sea correcta

### Error: "could not decode result data"

- El contrato no está desplegado en la dirección especificada
- Sigue los pasos de deployment arriba

### El contrato se desplegó pero sigue sin funcionar

- Verifica que estés usando la misma red (Anvil en localhost:8545)
- Verifica que la dirección del contrato sea correcta
- Recarga la página después de actualizar `CONTRACT_ADDRESS`
