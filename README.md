# NexusLend Protocol 🏦

Este proyecto es una DApp de préstamos descentralizados construida con **Solidity**, **Hardhat**, y **React (Vite)**. Permite a los usuarios:

- Depositar tokens como colateral (cUSD)
- Solicitar préstamos en otro token (dDAI) con una colateralización mínima del 150%
- Pagar la deuda con un interés fijo del 5% y retirar el colateral
- Todo sin oráculos externos ni liquidadores

---

## 📂 Estructura del Proyecto

solid-loans/
├── contracts/
│ ├── LendingProtocol.sol
│ ├── CollateralToken.sol
│ ├── LoanToken.sol
│ └──    MockFailToken.sol
├── test/
│ ├── LendingProtocol.test.js
│ ├── CollateralToken.test.js
│ └── LoanToken.test.js
├── coverage/ (autogenerado)
├── scripts/
│ └── deploy.js
├── hardhat.config.js
├── .env
└── package.json

## 📂 Requisitos

Node.js y npm

Hardhat

MetaMask

Alchemy (u otro proveedor RPC)

Cuenta en Sepolia con ETH (para pagar gas)


## 🧪 Tests y cobertura

El proyecto incluye pruebas unitarias para todos los contratos, incluyendo casos de éxito y errores.

### ✅ Ejecutar los tests

```bash
npx hardhat test
```

## 🧪  Verificar cobertura de código

```bash
npm run coverage

```

## Contratos
CollateralToken.sol: ERC20 básico para simular cUSD (colateral)

LoanToken.sol: ERC20 para representar dDAI (préstamos)

LendingProtocol.sol: Contrato principal que maneja la lógica de préstamos, colateral, intereses y repago.

## Deploy en Ephemery
El contrato fue desplegado en la testnet Ephemery con las direcciones correspondientes de tokens registradas en LendingProtocol.

Configuración en .env:

PRIVATE_KEY=tu_clave_privada
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/MI_API_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=0x48BB6BF5384b6491E623460d2C8f40d47ceC19c7
NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=0xD36eBf549C377a5EF6bA8A4B54B0e2AB23BF3954
ETHERSCAN_API_KEY=TU_API_KEY


## Scripts útiles:

## Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
Cada vez que corremos el script de deploy, estamos desplegando una nueva instancia de tus contratos en la red Sepolia, lo que significa que las direcciones anteriores (como 0x48BB... y 0xD36eBf...) en NEXT_PUBLIC_CONTRACT_ADDRESS y NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS respectivamente, ya no son válidas para esta nueva versión del frontend, a menos que sigas usando esas instancias anteriores.
Deben ser reemplazadas por las nuevas que nos aparecen en la terminal:

NEXT_PUBLIC_CONTRACT_ADDRESS=<nueva dirección de LendingProtocol>
NEXT_PUBLIC_COLLATERAL_TOKEN_ADDRESS=<nueva dirección del token CollateralToken>

## Verificación en Etherscan:

```bash
npx hardhat verify --network sepolia <contractAddress> <args...>
```

