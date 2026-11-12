# Actualizar una base de datos antigua de SIGAD

Para quien todavía tiene la base de la versión anterior: tablas con mayúscula como `"Users"`,
`"Expedidos"`, `"Recibidos"`, `"Actas"`, `"Docentes"`, `"DocenteArchivos"` y `"Auxiliares"`
(las que aparecen "flotando" en el diagrama).

Tus datos viven en esas tablas. El script los copia a las tablas nuevas, verifica que no falte
nada y recién entonces permite borrar las antiguas.

## Pasos

Todo se hace desde la carpeta `backend`. **No arranques el backend antes del paso 3**: si la base
es antigua, el backend se niega a arrancar y te pide hacer esto.

1. Actualiza el código y las dependencias:

   ```bash
   git pull
   npm install
   ```

2. Revisa que `backend/.env` apunte a tu base (`DB_NAME`, `DB_USER`, `DB_PASS`).

3. Migra los datos:

   ```bash
   npm run db:actualizar
   ```

   - Primero crea un respaldo completo en `backend/respaldos/` (necesita `pg_dump`, que viene con PostgreSQL).
   - Si algo falla, la migración se revierte entera y la base queda como estaba.
   - Al final muestra el **correo con el que entra cada usuario**. La contraseña es la misma de antes.

4. Arranca el sistema y revisa que estén tus oficios, actas, docentes y auxiliares:

   ```bash
   npm run dev
   ```

5. Cuando todo esté bien, borra las tablas antiguas (dejan de aparecer en el diagrama):

   ```bash
   npm run db:actualizar -- --limpiar
   ```

   Solo borra si la verificación confirma que cada registro antiguo está en las tablas nuevas.

## Si algo sale mal

Restaura el respaldo del paso 3 (el nombre exacto lo muestra el script):

```bash
pg_restore -U postgres -d sistema_documentos --clean --if-exists "respaldos/<archivo>.dump"
```

Los PDF no se tocan: siguen en `backend/uploads` y los documentos migrados apuntan a ellos.
