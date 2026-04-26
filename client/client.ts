import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

(async () => {
  try {
    console.log("INICIANDO SISTEMA DE INVENTARIO ");

    const admin = pg.wallet.publicKey;
    const NOMBRE_TIENDA = "Tiendita de la esquina";
    
    // Configuracion de Productos
    const CODIGO_P1 = "Leche102";
    const NOMBRE_P1 = "Leche Santa Clara";
    
    const CODIGO_P2 = "Pan005";
    const NOMBRE_P2 = "Pan Integral";

    console.log("Admin Public Key:", admin.toBase58());

    // --- 1. DEFINICION DE PDAs ---
    // Se calculan las direcciones de las cuentas basadas en las semillas definidas en el contrato
    const [pdaTienda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tienda"), admin.toBuffer()],
      pg.PROGRAM_ID
    );

    const [pdaProd1] = PublicKey.findProgramAddressSync(
      [Buffer.from("producto"), admin.toBuffer(), Buffer.from(CODIGO_P1)],
      pg.PROGRAM_ID
    );

    const [pdaProd2] = PublicKey.findProgramAddressSync(
      [Buffer.from("producto"), admin.toBuffer(), Buffer.from(CODIGO_P2)],
      pg.PROGRAM_ID
    );

    // --- 2. INICIALIZAR TIENDA (CREATE) ---
    // Crea la cuenta maestra que llevara el control global de la tienda
    try {
      await pg.program.methods
        .inicializarTienda(NOMBRE_TIENDA)
        .accounts({
          tiendaDb: pdaTienda,
          admin: admin,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      console.log("Tienda inicializada exitosamente.");
    } catch (e) {
      console.log("La tienda ya existe en la blockchain.");
    }

    // --- 3. AGREGAR PRODUCTOS (CREATE) ---
    // Producto 1
    await pg.program.methods
      .agregarProducto(CODIGO_P1, NOMBRE_P1, new BN(1500), new BN(10), "Lacteos")
      .accounts({
        tiendaDb: pdaTienda,
        producto: pdaProd1,
        admin: admin,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Producto agregado correctamente:", NOMBRE_P1);

    // Producto 2
    await pg.program.methods
      .agregarProducto(CODIGO_P2, NOMBRE_P2, new BN(800), new BN(20), "Panaderia")
      .accounts({
        tiendaDb: pdaTienda,
        producto: pdaProd2,
        admin: admin,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Producto agregado correctamente:", NOMBRE_P2);

    // --- 4. ACTUALIZAR STOCK (UPDATE) ---
    // Modifica el stock del Producto 1
    await pg.program.methods
      .actualizarStock(CODIGO_P1, new BN(50))
      .accounts({
        producto: pdaProd1,
        admin: admin,
      })
      .rpc();
    console.log("Stock de", NOMBRE_P1, "actualizado a 50 unidades.");

    // --- 5. LECTURA DE DATOS (READ) ---
    // Recupera la informacion de las cuentas para verificar el estado actual
    const dataP1 = await pg.program.account.producto.fetch(pdaProd1);
    const dataP2 = await pg.program.account.producto.fetch(pdaProd2);
    
    console.log("Estado actual del inventario:");
    console.log("-", dataP1.nombre, "| Stock:", dataP1.stock.toString());
    console.log("-", dataP2.nombre, "| Stock:", dataP2.stock.toString());

    // --- 6. ELIMINAR PRODUCTO (DELETE) ---
    // Cierra la cuenta del Producto 2 para liberar espacio y recuperar la renta en SOL
    await pg.program.methods
      .eliminarProducto(CODIGO_P2)
      .accounts({
        producto: pdaProd2,
        admin: admin,
      })
      .rpc();
    console.log("Producto", NOMBRE_P2, "eliminado. ");

    // --- 7. VERIFICACION FINAL ---
    // El Producto 1 debe seguir existiendo y el Producto 2 debe lanzar error al intentar leerlo
    try {
      await pg.program.account.producto.fetch(pdaProd2);
    } catch (e) {
      console.log("Confirmacion: El producto", NOMBRE_P2, "ya no reside en la blockchain.");
    }

    console.log("OPERACIONES COMPLETADAS EXITOSAMENTE");

  } catch (err) {
    console.error("Error detectado durante la ejecucion:");
    console.error(err.message);
  }
})();
