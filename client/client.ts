
//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

//////////////////// Constantes ////////////////////
const NOMBRE_TIENDA = "Mi Tiendita Solana";
const CODIGO_PRODUCTO = "PROD-001"; 
const admin = pg.wallet.publicKey;

//////////////////// Logs base ////////////////////
console.log("Direccion del Admin:", admin.toBase58());

//////////////////// PDAs (Program Derived Addresses) ////////////////////

// PDA para la configuracion global de la tienda
function pdaTienda(adminPk: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tienda"), adminPk.toBuffer()],
    pg.PROGRAM_ID
  );
}

// PDA unica para cada producto basada en su codigo
function pdaProducto(adminPk: PublicKey, codigo: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("producto"), adminPk.toBuffer(), Buffer.from(codigo)],
    pg.PROGRAM_ID
  );
}

//////////////////// Helpers de Fetch ////////////////////

async function fetchTienda(pda: PublicKey) {
  return await pg.program.account.tiendaDb.fetch(pda);
}

async function fetchProducto(pda: PublicKey) {
  return await pg.program.account.producto.fetch(pda);
}

//////////////////// Instrucciones (CRUD) ////////////////////

// 1. CREATE: Inicializar la tienda maestra
async function inicializarTienda(nombre: string) {
  const [pda_tienda] = pdaTienda(admin);

  try {
    const txHash = await pg.program.methods
      .inicializarTienda(nombre)
      .accounts({
        tiendaDb: pda_tienda,
        admin: admin,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Transaccion Crear Tienda:", txHash);
  } catch (e) {
    console.log("Informacion: La tienda ya existe o hubo un error de red.");
  }

  const cuenta = await fetchTienda(pda_tienda);
  console.log("Tienda:", cuenta.nombre, "| Productos totales:", cuenta.totalProductos.toString());
}

// 2. CREATE: Agregar un producto al inventario
async function agregarProducto(codigo: string, nombre: string, precio: number, stock: number, categoria: string) {
  const [pda_tienda] = pdaTienda(admin);
  const [pda_prod] = pdaProducto(admin, codigo);

  const txHash = await pg.program.methods
    .agregarProducto(codigo, nombre, new BN(precio), new BN(stock), categoria)
    .accounts({
      tiendaDb: pda_tienda,
      producto: pda_prod,
      admin: admin,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Transaccion Agregar Producto:", txHash);
  
  const prodAccount = await fetchProducto(pda_prod);
  console.log("Producto guardado:", prodAccount.nombre, "- Stock:", prodAccount.stock.toString());
}

// 3. UPDATE: Actualizar el stock de un producto
async function actualizarStock(codigo: string, nuevoStock: number) {
  const [pda_prod] = pdaProducto(admin, codigo);

  const txHash = await pg.program.methods
    .actualizarStock(codigo, new BN(nuevoStock))
    .accounts({
      producto: pda_prod,
      admin: admin,
    })
    .rpc();

  console.log("Transaccion Actualizar Stock:", txHash);
  const prodAccount = await fetchProducto(pda_prod);
  console.log("Nuevo stock de", prodAccount.nombre, ":", prodAccount.stock.toString());
}

// 4. DELETE: Eliminar producto y cerrar cuenta (Recuperar renta)
async function eliminarProducto(codigo: string) {
  const [pda_prod] = pdaProducto(admin, codigo);

  const txHash = await pg.program.methods
    .eliminarProducto(codigo)
    .accounts({
      producto: pda_prod,
      admin: admin,
    })
    .rpc();

  console.log("Transaccion Eliminar Producto:", txHash);
  console.log("Cuenta cerrada y SOL devuelto al admin.");
}

//////////////////// Demo Runner ////////////////////

async function ejecutarPruebas() {
  try {
    console.log("--- Iniciando Pruebas del Sistema ---");

    // Inicializar tienda
    await inicializarTienda(NOMBRE_TIENDA);

    // Agregar producto
    await agregarProducto(CODIGO_PRODUCTO, "Laptop Gamer", 5000000, 10, "Electronica");

    // Actualizar producto
    await actualizarStock(CODIGO_PRODUCTO, 25);

    // Eliminar producto (Opcional, descomenta si quieres probarlo)
    // await eliminarProducto(CODIGO_PRODUCTO);

    console.log("--- Todas las pruebas CRUD finalizaron con exito ---");
  } catch (error) {
    console.error("Error en la ejecucion:", error);
  }
}

// Ejecutar el runner
ejecutarPruebas();
