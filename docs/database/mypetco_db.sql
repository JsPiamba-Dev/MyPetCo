-- =====================================================================
-- MyPetCo — Base de datos relacional (MySQL 8.0.16+ / InnoDB / utf8mb4)
-- Archivo: mypetco_db.sql
--
-- Fuentes: diagrama de clases UML, diagrama de casos de uso UML y ERS
-- IEEE 830 (RF01–RF20).
--
-- Convenciones:
--   * Tablas en plural y snake_case; claves primarias UUID (CHAR(36)).
--   * Herencia UML -> "tabla por subtipo" (la PK del subtipo es también FK
--     hacia el supertipo):
--       CuentaAcceso <- Usuario, Proveedor
--       Proveedor    <- Veterinaria, Empresa
--       Publicacion  <- Campana, Producto, Servicio
--   * [DIAGRAMA] = viene del diagrama de clases.
--   * [RF##]     = viene de un requerimiento confirmado en el ERS.
--   * [SUPUESTO] = decisión de diseño propuesta; requiere confirmación.
--   * No hay contraseñas reales: solo se guarda el HASH (bcrypt/argon2).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS mypetco_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mypetco_db;

SET NAMES utf8mb4;

-- =====================================================================
-- 1. CUENTAS Y PROPIETARIOS
-- =====================================================================

-- CuentaAcceso [DIAGRAMA]. Supertipo de Usuario y Proveedor.
-- [SUPUESTO] 'rol': el diagrama de clases no tiene la clase Administrador
-- ni distingue el tipo de cuenta, pero RF02/RF17 y el actor "Administrador"
-- del diagrama de casos de uso lo necesitan.
CREATE TABLE cuentas_acceso (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()),
  correo          VARCHAR(255) NOT NULL,
  hash_contrasena VARCHAR(255) NOT NULL,
  rol             ENUM('PROPIETARIO','VETERINARIA','EMPRESA','ADMINISTRADOR') NOT NULL,
  estado          ENUM('PENDIENTE_VERIFICACION','ACTIVA','SUSPENDIDA','DESACTIVADA')
                  NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
  fecha_registro  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ultimo_acceso   DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cuentas_acceso_correo (correo),            -- RF01: correo no repetido
  KEY idx_cuentas_acceso_rol_estado (rol, estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='CuentaAcceso: credenciales, rol y estado de toda cuenta';

-- Usuario (propietario) [DIAGRAMA] hereda de CuentaAcceso.
-- numero_documento viene de RF01 (no está en el diagrama de clases).
CREATE TABLE usuarios (
  cuenta_id        CHAR(36)     NOT NULL,
  nombre           VARCHAR(150) NOT NULL,
  numero_documento VARCHAR(30)  NULL,                      -- RF01
  telefono         VARCHAR(30)  NULL,
  ciudad           VARCHAR(100) NULL,
  direccion        VARCHAR(255) NULL,
  PRIMARY KEY (cuenta_id),
  UNIQUE KEY uq_usuarios_numero_documento (numero_documento),
  KEY idx_usuarios_ciudad (ciudad),
  CONSTRAINT fk_usuarios_cuenta FOREIGN KEY (cuenta_id)
    REFERENCES cuentas_acceso (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuario: datos personales del propietario';

-- PreferenciaUsuario [DIAGRAMA]. Usuario 1 — 0..1 PreferenciaUsuario.
CREATE TABLE preferencias_usuario (
  id                     CHAR(36)     NOT NULL DEFAULT (UUID()),
  usuario_id             CHAR(36)     NOT NULL,
  ciudad_preferida       VARCHAR(100) NULL,
  categorias_interes     VARCHAR(500) NULL,                -- [SUPUESTO] texto libre/CSV
  acepta_recomendaciones TINYINT(1)   NOT NULL DEFAULT 0,
  acepta_notificaciones  TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_preferencias_usuario_usuario (usuario_id), -- 0..1 por usuario
  CONSTRAINT fk_preferencias_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='PreferenciaUsuario: ciudad, intereses y opt-in de recomendaciones/notificaciones';

-- =====================================================================
-- 2. PROVEEDORES (Veterinaria y Empresa)
-- =====================================================================

-- Proveedor [DIAGRAMA] hereda de CuentaAcceso.
CREATE TABLE proveedores (
  cuenta_id        CHAR(36)     NOT NULL,
  nombre_comercial VARCHAR(150) NOT NULL,
  descripcion      TEXT         NULL,
  telefono_contacto VARCHAR(30) NULL,
  ciudad           VARCHAR(100) NULL,
  direccion        VARCHAR(255) NULL,
  sitio_web        VARCHAR(255) NULL,
  estado_proveedor ENUM('PENDIENTE_VERIFICACION','ACTIVO','SUSPENDIDO','INACTIVO')
                   NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',  -- RF17: verificación manual
  PRIMARY KEY (cuenta_id),
  KEY idx_proveedores_estado_ciudad (estado_proveedor, ciudad),
  CONSTRAINT fk_proveedores_cuenta FOREIGN KEY (cuenta_id)
    REFERENCES cuentas_acceso (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Proveedor: datos comunes de veterinarias y empresas';

-- Veterinaria [DIAGRAMA] hereda de Proveedor (actor "Veterinario autorizado").
CREATE TABLE veterinarias (
  proveedor_id         CHAR(36)     NOT NULL,
  nombre_responsable   VARCHAR(150) NOT NULL,
  registro_profesional VARCHAR(60)  NOT NULL,              -- RF17: cédula / registro profesional
  horario_atencion     VARCHAR(255) NULL,
  servicios_clinicos   TEXT         NULL,
  PRIMARY KEY (proveedor_id),
  UNIQUE KEY uq_veterinarias_registro_profesional (registro_profesional),
  CONSTRAINT fk_veterinarias_proveedor FOREIGN KEY (proveedor_id)
    REFERENCES proveedores (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Veterinaria: datos profesionales del veterinario autorizado';

-- Empresa [DIAGRAMA] hereda de Proveedor.
CREATE TABLE empresas (
  proveedor_id           CHAR(36)     NOT NULL,
  identificacion_tributaria VARCHAR(30) NOT NULL,
  categoria_comercial    VARCHAR(100) NULL,
  PRIMARY KEY (proveedor_id),
  UNIQUE KEY uq_empresas_identificacion_tributaria (identificacion_tributaria),
  CONSTRAINT fk_empresas_proveedor FOREIGN KEY (proveedor_id)
    REFERENCES proveedores (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Empresa: datos comerciales de proveedores no veterinarios';

-- =====================================================================
-- 3. AUTORIZACIÓN DE DATOS (RF11)
-- =====================================================================

-- AutorizacionDatos [DIAGRAMA]. Usuario 1 — 0..* ; Proveedor 1 — 0..* (destinatario).
-- [SUPUESTO] proveedor_id es opcional: RF11/RF12 hablan de "terceros" en general.
CREATE TABLE autorizaciones_datos (
  id                       CHAR(36)     NOT NULL DEFAULT (UUID()),
  usuario_id               CHAR(36)     NOT NULL,
  proveedor_id             CHAR(36)     NULL,
  finalidad                VARCHAR(255) NOT NULL,
  fecha_autorizacion       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_revocacion         DATETIME(3)  NULL,
  vigente                  TINYINT(1)   NOT NULL DEFAULT 1,
  version_aviso_privacidad VARCHAR(30)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_autorizaciones_usuario_vigente (usuario_id, vigente),
  KEY idx_autorizaciones_proveedor (proveedor_id),
  CONSTRAINT fk_autorizaciones_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_autorizaciones_proveedor FOREIGN KEY (proveedor_id)
    REFERENCES proveedores (cuenta_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_autorizaciones_vigencia
    CHECK ((vigente = 1 AND fecha_revocacion IS NULL) OR vigente = 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='AutorizacionDatos: consentimiento (RF11); se revoca, no se borra';

-- =====================================================================
-- 4. MASCOTAS
-- =====================================================================

-- Mascota [DIAGRAMA] + RF04. Usuario 1 — 0..* Mascota.
-- [SUPUESTO] fecha_retiro: UC16 "Eliminar o retirar mascota del perfil" se
-- implementa como baja lógica para conservar el historial de salud.
CREATE TABLE mascotas (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
  propietario_id        CHAR(36)     NOT NULL,
  nombre                VARCHAR(100) NOT NULL,
  especie               ENUM('PERRO','GATO') NOT NULL,
  raza                  VARCHAR(100) NULL,
  fecha_nacimiento      DATE         NULL,
  edad_aproximada_meses INT UNSIGNED NULL,
  sexo                  ENUM('MACHO','HEMBRA','DESCONOCIDO') NOT NULL DEFAULT 'DESCONOCIDO',
  peso_kg               DECIMAL(5,2) NULL,
  esterilizada          TINYINT(1)   NOT NULL DEFAULT 0,
  fecha_esterilizacion  DATE         NULL,
  foto                  VARCHAR(500) NULL,                 -- ruta/URL; el archivo NO va en la BD
  observaciones         TEXT         NULL,
  fecha_registro        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_retiro          DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY idx_mascotas_propietario_nombre (propietario_id, nombre),
  KEY idx_mascotas_especie_raza (especie, raza),
  CONSTRAINT fk_mascotas_propietario FOREIGN KEY (propietario_id)
    REFERENCES usuarios (cuenta_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_mascotas_edad CHECK (fecha_nacimiento IS NOT NULL OR edad_aproximada_meses IS NOT NULL), -- RF04
  CONSTRAINT ck_mascotas_peso CHECK (peso_kg IS NULL OR peso_kg > 0),
  CONSTRAINT ck_mascotas_esterilizacion CHECK (esterilizada = 1 OR fecha_esterilizacion IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mascota: perfil de perro o gato (RF04, RF05)';

-- RegistroPeso: NO está en el diagrama de clases, pero RF08 exige registrar el
-- peso en diferentes fechas. mascotas.peso_kg guarda el peso actual.
CREATE TABLE registros_peso (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  mascota_id     CHAR(36)     NOT NULL,
  peso_kg        DECIMAL(5,2) NOT NULL,
  fecha_medicion DATE         NOT NULL,
  fecha_creacion DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_registros_peso_mascota_fecha (mascota_id, fecha_medicion),
  CONSTRAINT fk_registros_peso_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_registros_peso_valor CHECK (peso_kg > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Evolución del peso de la mascota (RF08)';

-- =====================================================================
-- 5. SALUD Y VACUNACIÓN
-- =====================================================================

-- Vacuna [DIAGRAMA]: catálogo administrado por el administrador (UC73).
CREATE TABLE vacunas (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  nombre      VARCHAR(120) NOT NULL,
  descripcion TEXT         NULL,
  fabricante  VARCHAR(120) NULL,
  activa      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vacunas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vacuna: catálogo de vacunas';

-- ReglaVacunacion [DIAGRAMA]. Vacuna 1 — 0..* ReglaVacunacion.
CREATE TABLE reglas_vacunacion (
  id                         CHAR(36)     NOT NULL DEFAULT (UUID()),
  vacuna_id                  CHAR(36)     NOT NULL,
  especie                    ENUM('PERRO','GATO') NOT NULL,
  edad_minima_meses          INT UNSIGNED NOT NULL DEFAULT 0,
  edad_maxima_meses          INT UNSIGNED NULL,
  intervalo_refuerzo_dias    INT UNSIGNED NULL,
  numero_dosis               INT UNSIGNED NOT NULL DEFAULT 1,
  observaciones              TEXT         NULL,
  fuente_referencia          VARCHAR(255) NULL,
  fecha_revision             DATE         NULL,
  requiere_revision_veterinaria TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_reglas_vacunacion_vacuna (vacuna_id),
  KEY idx_reglas_vacunacion_especie_edad (especie, edad_minima_meses),
  CONSTRAINT fk_reglas_vacunacion_vacuna FOREIGN KEY (vacuna_id)
    REFERENCES vacunas (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT ck_reglas_vacunacion_edades
    CHECK (edad_maxima_meses IS NULL OR edad_maxima_meses >= edad_minima_meses),
  CONSTRAINT ck_reglas_vacunacion_dosis CHECK (numero_dosis >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ReglaVacunacion: reglas por especie y edad (UC31, UC74)';

-- RegistroVacunacion [DIAGRAMA] = carnet digital (RF06).
-- registrado_por_id referencia cuentas_acceso porque registra tanto un
-- propietario como una veterinaria (ambos heredan de CuentaAcceso).
-- veterinaria_id = "aplica / verifica" (0..1) del diagrama.
CREATE TABLE registros_vacunacion (
  id                      CHAR(36)     NOT NULL DEFAULT (UUID()),
  mascota_id              CHAR(36)     NOT NULL,
  vacuna_id               CHAR(36)     NOT NULL,
  regla_vacunacion_id     CHAR(36)     NULL,
  registrado_por_id       CHAR(36)     NOT NULL,
  veterinaria_id          CHAR(36)     NULL,
  fecha_aplicacion        DATE         NULL,
  dosis                   VARCHAR(60)  NULL,
  lote                    VARCHAR(60)  NULL,
  observaciones           TEXT         NULL,
  fecha_proxima_aplicacion DATE        NULL,
  origen                  ENUM('PROPIETARIO','VETERINARIA','IMPORTADO') NOT NULL,
  estado                  ENUM('APLICADA_DECLARADA','APLICADA_VERIFICADA','PENDIENTE','POR_VERIFICAR','ANULADA')
                          NOT NULL DEFAULT 'APLICADA_DECLARADA',
  comprobante             VARCHAR(500) NULL,
  fecha_creacion          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_registros_vacunacion_mascota_proxima (mascota_id, fecha_proxima_aplicacion),
  KEY idx_registros_vacunacion_estado (estado),
  KEY idx_registros_vacunacion_vacuna (vacuna_id),
  KEY idx_registros_vacunacion_regla (regla_vacunacion_id),
  KEY idx_registros_vacunacion_registrado_por (registrado_por_id),
  KEY idx_registros_vacunacion_veterinaria (veterinaria_id),
  CONSTRAINT fk_registros_vacunacion_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_registros_vacunacion_vacuna FOREIGN KEY (vacuna_id)
    REFERENCES vacunas (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_registros_vacunacion_regla FOREIGN KEY (regla_vacunacion_id)
    REFERENCES reglas_vacunacion (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_registros_vacunacion_registrado_por FOREIGN KEY (registrado_por_id)
    REFERENCES cuentas_acceso (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_registros_vacunacion_veterinaria FOREIGN KEY (veterinaria_id)
    REFERENCES veterinarias (proveedor_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT ck_registros_vacunacion_fechas
    CHECK (fecha_aplicacion IS NULL OR fecha_proxima_aplicacion IS NULL
           OR fecha_proxima_aplicacion >= fecha_aplicacion),
  -- [SUPUESTO] solo un registro PENDIENTE puede no tener fecha de aplicación
  CONSTRAINT ck_registros_vacunacion_aplicacion
    CHECK (estado IN ('PENDIENTE','POR_VERIFICAR','ANULADA') OR fecha_aplicacion IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RegistroVacunacion: carnet de vacunación digital (RF06)';

-- HistorialSalud [DIAGRAMA] (RF07). Mascota 1 — 0..* HistorialSalud.
CREATE TABLE historial_salud (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  mascota_id        CHAR(36)     NOT NULL,
  registrado_por_id CHAR(36)     NOT NULL,
  fecha_evento      DATE         NOT NULL,
  tipo_evento       ENUM('CONSULTA','ENFERMEDAD','TRATAMIENTO','CIRUGIA','DESPARASITACION','ESTERILIZACION','CONTROL','OTRO')
                    NOT NULL,
  descripcion       TEXT         NOT NULL,
  tratamiento       TEXT         NULL,
  observaciones     TEXT         NULL,
  comprobante       VARCHAR(500) NULL,
  fecha_creacion    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_actualizacion DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_historial_salud_mascota_fecha (mascota_id, fecha_evento),
  KEY idx_historial_salud_tipo (tipo_evento),
  KEY idx_historial_salud_registrado_por (registrado_por_id),
  CONSTRAINT fk_historial_salud_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_historial_salud_registrado_por FOREIGN KEY (registrado_por_id)
    REFERENCES cuentas_acceso (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='HistorialSalud: eventos clínicos de la mascota (RF07, RF16)';

-- =====================================================================
-- 6. RECORDATORIOS Y NOTIFICACIONES (RF14)
-- =====================================================================

-- Recordatorio [DIAGRAMA]. Usuario 1 — 0..* ; Mascota 1 — 0..*.
-- registro_vacunacion_id = dependencia "calcula fechas" (opcional).
CREATE TABLE recordatorios (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
  usuario_id            CHAR(36)     NOT NULL,
  mascota_id            CHAR(36)     NOT NULL,
  registro_vacunacion_id CHAR(36)    NULL,
  titulo                VARCHAR(150) NOT NULL,
  descripcion           TEXT         NULL,
  fecha_programada      DATETIME(3)  NOT NULL,
  tipo                  ENUM('VACUNACION','CONTROL_VETERINARIO','DESPARASITACION','ESTERILIZACION','MEDICACION','OTRO')
                        NOT NULL,
  estado                ENUM('PROGRAMADO','ENVIADO','COMPLETADO','POSPUESTO','CANCELADO')
                        NOT NULL DEFAULT 'PROGRAMADO',
  fecha_creacion        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_completado      DATETIME(3)  NULL,
  PRIMARY KEY (id),
  KEY idx_recordatorios_estado_fecha (estado, fecha_programada),  -- barrido del job de avisos
  KEY idx_recordatorios_usuario (usuario_id),
  KEY idx_recordatorios_mascota (mascota_id),
  KEY idx_recordatorios_registro_vacunacion (registro_vacunacion_id),
  CONSTRAINT fk_recordatorios_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recordatorios_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recordatorios_registro_vacunacion FOREIGN KEY (registro_vacunacion_id)
    REFERENCES registros_vacunacion (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Recordatorio: avisos programados (vacunas, controles, etc.)';

-- Notificacion [DIAGRAMA]. Recordatorio 1 — 0..* Notificacion.
CREATE TABLE notificaciones (
  id             CHAR(36)    NOT NULL DEFAULT (UUID()),
  recordatorio_id CHAR(36)   NOT NULL,
  mensaje        TEXT        NOT NULL,
  canal          ENUM('INTERNA','CORREO') NOT NULL,
  fecha_envio    DATETIME(3) NULL,
  estado         ENUM('PENDIENTE','ENVIADA','LEIDA','FALLIDA') NOT NULL DEFAULT 'PENDIENTE',
  fecha_lectura  DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_notificaciones_recordatorio (recordatorio_id),
  KEY idx_notificaciones_estado_canal (estado, canal),
  CONSTRAINT fk_notificaciones_recordatorio FOREIGN KEY (recordatorio_id)
    REFERENCES recordatorios (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notificacion: aviso interno o por correo generado por un recordatorio';

-- =====================================================================
-- 7. PUBLICACIONES (Campaña, Producto, Servicio)
-- =====================================================================

-- Publicacion [DIAGRAMA]. Proveedor 1 — 0..* Publicacion.
-- [SUPUESTO] 'tipo' = discriminador para que cada publicación tenga
-- exactamente un subtipo (campaña, producto o servicio).
CREATE TABLE publicaciones (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  proveedor_id        CHAR(36)     NOT NULL,
  tipo                ENUM('CAMPANA','PRODUCTO','SERVICIO') NOT NULL,
  titulo              VARCHAR(150) NOT NULL,
  descripcion         TEXT         NULL,
  ciudad              VARCHAR(100) NULL,
  imagen              VARCHAR(500) NULL,
  activa              TINYINT(1)   NOT NULL DEFAULT 1,
  fecha_publicacion   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  fecha_actualizacion DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_publicaciones_proveedor (proveedor_id),
  KEY idx_publicaciones_activa_tipo_ciudad (activa, tipo, ciudad),
  CONSTRAINT fk_publicaciones_proveedor FOREIGN KEY (proveedor_id)
    REFERENCES proveedores (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Publicacion: supertipo de campañas, productos y servicios';

-- Campana [DIAGRAMA] hereda de Publicacion.
CREATE TABLE campanas (
  publicacion_id    CHAR(36)     NOT NULL,
  tipo_campana      ENUM('VACUNACION','ESTERILIZACION','ADOPCION','BIENESTAR_ANIMAL','OTRO') NOT NULL,
  fecha_inicio      DATETIME(3)  NOT NULL,
  fecha_fin         DATETIME(3)  NOT NULL,
  lugar             VARCHAR(255) NULL,
  cupos_totales     INT UNSIGNED NULL,
  cupos_disponibles INT UNSIGNED NULL,
  requisitos        TEXT         NULL,
  PRIMARY KEY (publicacion_id),
  KEY idx_campanas_tipo_fechas (tipo_campana, fecha_inicio, fecha_fin),
  CONSTRAINT fk_campanas_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_campanas_fechas CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT ck_campanas_cupos CHECK (cupos_disponibles IS NULL OR cupos_totales IS NULL OR cupos_disponibles <= cupos_totales)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Campana: jornadas de vacunación, esterilización, adopción, etc.';

-- Producto [DIAGRAMA] hereda de Publicacion.
-- especie_objetivo NULL = no específica.
CREATE TABLE productos (
  publicacion_id   CHAR(36)      NOT NULL,
  categoria        VARCHAR(100)  NOT NULL,
  especie_objetivo ENUM('PERRO','GATO') NULL,
  etapa_vida       ENUM('CACHORRO_GATITO','JOVEN','ADULTO','SENIOR','NO_ESPECIFICADA')
                   NOT NULL DEFAULT 'NO_ESPECIFICADA',
  precio           DECIMAL(12,2) NULL,
  moneda           CHAR(3)       NOT NULL DEFAULT 'COP',
  enlace_compra    VARCHAR(500)  NULL,
  disponibilidad   VARCHAR(100)  NULL,
  PRIMARY KEY (publicacion_id),
  KEY idx_productos_categoria_especie (categoria, especie_objetivo),
  CONSTRAINT fk_productos_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_productos_precio CHECK (precio IS NULL OR precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Producto: producto publicado por una empresa';

-- Servicio [DIAGRAMA] hereda de Publicacion.
CREATE TABLE servicios (
  publicacion_id   CHAR(36)      NOT NULL,
  categoria        VARCHAR(100)  NOT NULL,
  especie_objetivo ENUM('PERRO','GATO') NULL,
  modalidad        VARCHAR(60)   NULL,
  precio_desde     DECIMAL(12,2) NULL,
  requisitos       TEXT          NULL,
  PRIMARY KEY (publicacion_id),
  KEY idx_servicios_categoria_especie (categoria, especie_objetivo),
  CONSTRAINT fk_servicios_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_servicios_precio CHECK (precio_desde IS NULL OR precio_desde >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Servicio: servicio publicado por veterinaria o empresa';

-- =====================================================================
-- 8. RECOMENDACIONES
-- =====================================================================

-- Recomendacion [DIAGRAMA]. Usuario 1 — 0..* ; Recomendacion recomienda 1 Publicacion.
-- preferencia_usuario_id y mascota_id = dependencias "consulta preferencias" y
-- "evalúa necesidades" (opcionales).
CREATE TABLE recomendaciones (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()),
  usuario_id            CHAR(36)     NOT NULL,
  publicacion_id        CHAR(36)     NOT NULL,
  mascota_id            CHAR(36)     NULL,
  preferencia_usuario_id CHAR(36)    NULL,
  motivo                VARCHAR(255) NULL,
  fecha_generacion      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  puntuacion            DECIMAL(5,2) NULL,
  estado                ENUM('NUEVA','VISTA','GUARDADA','DESCARTADA') NOT NULL DEFAULT 'NUEVA',
  PRIMARY KEY (id),
  KEY idx_recomendaciones_usuario_estado (usuario_id, estado),
  KEY idx_recomendaciones_publicacion (publicacion_id),
  KEY idx_recomendaciones_mascota (mascota_id),
  KEY idx_recomendaciones_preferencia (preferencia_usuario_id),
  CONSTRAINT fk_recomendaciones_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (cuenta_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recomendaciones_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recomendaciones_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_recomendaciones_preferencia FOREIGN KEY (preferencia_usuario_id)
    REFERENCES preferencias_usuario (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Recomendacion: publicación sugerida a un usuario';

-- =====================================================================
-- 9. DATOS DE PRUEBA (OPCIONAL) — descomentar solo si los necesitas.
--    Datos ficticios; el hash NO es una contraseña real.
-- =====================================================================
-- INSERT INTO vacunas (nombre, descripcion, activa)
-- VALUES ('Vacuna de ejemplo', 'Registro ficticio para pruebas', 1);
--
-- INSERT INTO cuentas_acceso (id, correo, hash_contrasena, rol, estado)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'propietario.prueba@example.com',
--         '$2b$10$HASH_DE_EJEMPLO_NO_REAL', 'PROPIETARIO', 'ACTIVA');
-- INSERT INTO usuarios (cuenta_id, nombre, ciudad)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Propietario de Prueba', 'Facatativá');
