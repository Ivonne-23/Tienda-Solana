# Sistema de Gestión de Inventario (Tienda Solana)

Este proyecto es una aplicación descentralizada (dApp) desarrollada para la red de Solana. Permite a un administrador gestionar el inventario de una tienda (Crear, Leer, Actualizar y Eliminar productos) de manera segura y eficiente utilizando Smart Contracts.

## Características Técnicas
- **Framework**: Anchor (Rust).
- **Estructura CRUD**:
  - **Create**: Registro de tienda y productos.
  - **Read**: Consulta de estados de cuenta desde el cliente.
  - **Update**: Modificación de stock de productos existentes.
  - **Delete**: Eliminación de productos y recuperación de renta (SOL).
- **Uso de PDAs**: El proyecto utiliza *Program Derived Addresses* para organizar los datos, asegurando que cada producto tenga una dirección única basada en su código y la identidad del administrador.

## Estructura del Proyecto
- `src/lib.rs`: Contiene la lógica del Smart Contract en Rust.
- `client/client.ts`: Script de TypeScript para interactuar con el programa y realizar pruebas.
