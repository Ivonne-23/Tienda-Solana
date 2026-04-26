use anchor_lang::prelude::*;

// ID del programa (Playground lo genera automáticamente al hacer Build)
declare_id!("62xngzuYdaDGQ7o4SR8TfsA576wqJYVwGcQYMpfuSGqK");

#[program]
pub mod tienda_solana {
    use super::*;

    /// 1. CREATE: Inicializa la cuenta maestra de la tienda
    pub fn inicializar_tienda(ctx: Context<InicializarTienda>, nombre: String) -> Result<()> {
        let tienda_db = &mut ctx.accounts.tienda_db;
        tienda_db.nombre = nombre;
        tienda_db.admin = *ctx.accounts.admin.key;
        tienda_db.total_productos = 0;
        msg!("Tienda '{}' creada exitosamente", tienda_db.nombre);
        Ok(())
    }

    /// 2. CREATE: Agrega un nuevo producto al inventario usando una PDA única por código
    pub fn agregar_producto(
        ctx: Context<AgregarProducto>,
        codigo: String,
        nombre: String,
        precio: u64,
        stock: u64,
        categoria: String,
    ) -> Result<()> {
        let producto = &mut ctx.accounts.producto;
        let tienda_db = &mut ctx.accounts.tienda_db;

        producto.admin = *ctx.accounts.admin.key;
        producto.codigo = codigo;
        producto.nombre = nombre.clone(); // Evita error de movimiento de valor
        producto.precio = precio;
        producto.stock = stock;
        producto.categoria = categoria;

        // Incrementa el contador global de la tienda
        tienda_db.total_productos += 1;

        msg!("Producto '{}' agregado al inventario", nombre);
        Ok(())
    }

    /// 3. UPDATE: Actualiza el stock de un producto existente
    pub fn actualizar_stock(ctx: Context<ActualizarStock>, _codigo: String, nuevo_stock: u64) -> Result<()> {
        let producto = &mut ctx.accounts.producto;
        producto.stock = nuevo_stock;
        msg!("Stock de '{}' actualizado a {}", producto.nombre, nuevo_stock);
        Ok(())
    }

    /// 4. DELETE: Elimina un producto y devuelve la renta al administrador
    pub fn eliminar_producto(_ctx: Context<EliminarProducto>, codigo: String) -> Result<()> {
        msg!("Producto con codigo '{}' eliminado correctamente", codigo);
        Ok(())
    }
}

//////////////////// Estructuras de Cuentas (PDA y CRUD) ////////////////////

#[derive(Accounts)]
#[instruction(nombre: String)]
pub struct InicializarTienda<'info> {
    // PDA Semillas: ["tienda", admin_pubkey]
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + nombre.len() + 8,
        seeds = [b"tienda", admin.key().as_ref()],
        bump
    )]
    pub tienda_db: Account<'info, TiendaDb>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct AgregarProducto<'info> {
    #[account(mut)]
    pub tienda_db: Account<'info, TiendaDb>,
    // PDA Semillas: ["producto", admin_pubkey, codigo_producto]
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + codigo.len() + 4 + 50 + 8 + 8 + 4 + 30,
        seeds = [b"producto", admin.key().as_ref(), codigo.as_bytes()],
        bump
    )]
    pub producto: Account<'info, Producto>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct ActualizarStock<'info> {
    #[account(
        mut,
        seeds = [b"producto", admin.key().as_ref(), codigo.as_bytes()],
        bump
    )]
    pub producto: Account<'info, Producto>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(codigo: String)]
pub struct EliminarProducto<'info> {
    #[account(
        mut,
        close = admin, // Cierra la cuenta y devuelve el SOL al admin
        seeds = [b"producto", admin.key().as_ref(), codigo.as_bytes()],
        bump
    )]
    pub producto: Account<'info, Producto>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

//////////////////// Modelos de Datos ////////////////////

#[account]
pub struct TiendaDb {
    pub admin: Pubkey,
    pub nombre: String,
    pub total_productos: u64,
}

#[account]
pub struct Producto {
    pub admin: Pubkey,
    pub codigo: String,
    pub nombre: String,
    pub precio: u64,
    pub stock: u64,
    pub categoria: String,
}
