-- MyPetCo: esquema completo + datos demo derivados de prisma/schema.prisma y prisma/seed.ts
-- IMPORTANTE: ejecutar en una base de datos de desarrollo. Crea tablas y carga datos ficticios.
CREATE DATABASE IF NOT EXISTS `mypetco_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mypetco_db`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `autorizaciones_datos` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` CHAR(36) NULL,
  `proveedor_id` CHAR(36) NULL,
  `finalidad` VARCHAR(255) NOT NULL,
  `fecha_autorizacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_revocacion` DATETIME(3) NULL,
  `vigente` BOOLEAN NOT NULL DEFAULT 1,
  `version_aviso_privacidad` VARCHAR(30) NOT NULL,

  PRIMARY KEY (`id`),

  KEY `idx_autorizaciones_proveedor` (`proveedor_id`),
  KEY `idx_autorizaciones_usuario_vigente` (`usuario_id`, `vigente`),

  CONSTRAINT `chk_autorizaciones_un_sujeto`
    CHECK (
      (`usuario_id` IS NOT NULL AND `proveedor_id` IS NULL)
      OR
      (`usuario_id` IS NULL AND `proveedor_id` IS NOT NULL)
    )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campanas` (
  `publicacion_id` CHAR(36) NOT NULL,
  `tipo_campana` ENUM('VACUNACION', 'ESTERILIZACION', 'ADOPCION', 'BIENESTAR_ANIMAL', 'OTRO') NOT NULL,
  `fecha_inicio` DATETIME(3) NOT NULL,
  `fecha_fin` DATETIME(3) NOT NULL,
  `lugar` VARCHAR(255) NULL,
  `cupos_totales` INT UNSIGNED NULL,
  `cupos_disponibles` INT UNSIGNED NULL,
  `requisitos` TEXT NULL,
  PRIMARY KEY (`publicacion_id`),
  KEY `idx_campanas_tipo_fechas` (`tipo_campana`, `fecha_inicio`, `fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cuentas_acceso` (
  `id` CHAR(36) NOT NULL,
  `correo` VARCHAR(255) NOT NULL,
  UNIQUE KEY `uq_cuentas_acceso_correo` (`correo`),
  `hash_contrasena` VARCHAR(255) NOT NULL,
  `rol` ENUM('PROPIETARIO', 'VETERINARIA', 'EMPRESA', 'ADMINISTRADOR') NOT NULL,
  `estado` ENUM('PENDIENTE_VERIFICACION', 'ACTIVA', 'SUSPENDIDA', 'DESACTIVADA') NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
  `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ultimo_acceso` DATETIME(3) NULL,
  `token_recuperacion_hash` CHAR(64) NULL,
  UNIQUE KEY `uq_cuentas_acceso_token_recuperacion_hash` (`token_recuperacion_hash`),
  `token_recuperacion_expira` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cuentas_acceso_rol_estado` (`rol`, `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `empresas` (
  `proveedor_id` CHAR(36) NOT NULL,
  `identificacion_tributaria` VARCHAR(30) NOT NULL,
  UNIQUE KEY `uq_empresas_identificacion_tributaria` (`identificacion_tributaria`),
  `categoria_comercial` VARCHAR(100) NULL,
  PRIMARY KEY (`proveedor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `historial_salud` (
  `id` CHAR(36) NOT NULL,
  `mascota_id` CHAR(36) NOT NULL,
  `registrado_por_id` CHAR(36) NOT NULL,
  `fecha_evento` DATE NOT NULL,
  `tipo_evento` ENUM('CONSULTA', 'ENFERMEDAD', 'TRATAMIENTO', 'CIRUGIA', 'DESPARASITACION', 'ESTERILIZACION', 'CONTROL', 'OTRO') NOT NULL,
  `descripcion` TEXT NOT NULL,
  `tratamiento` TEXT NULL,
  `observaciones` TEXT NULL,
  `comprobante` VARCHAR(500) NULL,
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_historial_salud_mascota_fecha` (`mascota_id`, `fecha_evento`),
  KEY `idx_historial_salud_registrado_por` (`registrado_por_id`),
  KEY `idx_historial_salud_tipo` (`tipo_evento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mascotas` (
  `id` CHAR(36) NOT NULL,
  `propietario_id` CHAR(36) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `especie` ENUM('PERRO', 'GATO') NOT NULL,
  `raza` VARCHAR(100) NULL,
  `fecha_nacimiento` DATE NULL,
  `edad_aproximada_meses` INT UNSIGNED NULL,
  `sexo` ENUM('MACHO', 'HEMBRA', 'DESCONOCIDO') NOT NULL DEFAULT 'DESCONOCIDO',
  `peso_kg` DECIMAL(5,2) NULL,
  `esterilizada` BOOLEAN NOT NULL DEFAULT 0,
  `enfermedades_adquiridas` TEXT NULL,
  `fecha_esterilizacion` DATE NULL,
  `foto` VARCHAR(500) NULL,
  `observaciones` TEXT NULL,
  `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_retiro` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mascotas_especie_raza` (`especie`, `raza`),
  KEY `idx_mascotas_propietario_nombre` (`propietario_id`, `nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` CHAR(36) NOT NULL,
  `recordatorio_id` CHAR(36) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `canal` ENUM('INTERNA', 'CORREO') NOT NULL,
  `fecha_envio` DATETIME(3) NULL,
  `estado` ENUM('PENDIENTE', 'ENVIADA', 'LEIDA', 'FALLIDA') NOT NULL DEFAULT 'PENDIENTE',
  `fecha_lectura` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notificaciones_estado_canal` (`estado`, `canal`),
  KEY `idx_notificaciones_recordatorio` (`recordatorio_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `preferencias_usuario` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` CHAR(36) NOT NULL,
  UNIQUE KEY `uq_preferencias_usuario_usuario` (`usuario_id`),
  `ciudad_preferida` VARCHAR(100) NULL,
  `categorias_interes` VARCHAR(500) NULL,
  `acepta_recomendaciones` BOOLEAN NOT NULL DEFAULT 0,
  `acepta_notificaciones` BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `productos` (
  `publicacion_id` CHAR(36) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `especie_objetivo` ENUM('PERRO', 'GATO') NULL,
  `etapa_vida` ENUM('CACHORRO_GATITO', 'JOVEN', 'ADULTO', 'SENIOR', 'NO_ESPECIFICADA') NOT NULL DEFAULT 'NO_ESPECIFICADA',
  `precio` DECIMAL(12,2) NULL,
  `moneda` CHAR(3) NOT NULL DEFAULT 'COP',
  `enlace_compra` VARCHAR(500) NULL,
  `disponibilidad` VARCHAR(100) NULL,
  PRIMARY KEY (`publicacion_id`),
  KEY `idx_productos_categoria_especie` (`categoria`, `especie_objetivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proveedores` (
  `cuenta_id` CHAR(36) NOT NULL,
  `nombre_comercial` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `telefono_contacto` VARCHAR(30) NULL,
  `ciudad` VARCHAR(100) NULL,
  `direccion` VARCHAR(255) NULL,
  `sitio_web` VARCHAR(255) NULL,
  `estado_proveedor` ENUM('PENDIENTE_VERIFICACION', 'ACTIVO', 'SUSPENDIDO', 'INACTIVO') NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
  PRIMARY KEY (`cuenta_id`),
  KEY `idx_proveedores_estado_ciudad` (`estado_proveedor`, `ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `publicaciones` (
  `id` CHAR(36) NOT NULL,
  `proveedor_id` CHAR(36) NOT NULL,
  `tipo` ENUM('CAMPANA', 'PRODUCTO', 'SERVICIO') NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `ciudad` VARCHAR(100) NULL,
  `imagen` VARCHAR(500) NULL,
  `activa` BOOLEAN NOT NULL DEFAULT 1,
  `fecha_publicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_publicaciones_activa_tipo_ciudad` (`activa`, `tipo`, `ciudad`),
  KEY `idx_publicaciones_proveedor` (`proveedor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recomendaciones` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` CHAR(36) NOT NULL,
  `publicacion_id` CHAR(36) NOT NULL,
  `mascota_id` CHAR(36) NULL,
  `preferencia_usuario_id` CHAR(36) NULL,
  `motivo` VARCHAR(255) NULL,
  `fecha_generacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `puntuacion` DECIMAL(5,2) NULL,
  `estado` ENUM('NUEVA', 'VISTA', 'GUARDADA', 'DESCARTADA') NOT NULL DEFAULT 'NUEVA',
  PRIMARY KEY (`id`),
  KEY `idx_recomendaciones_mascota` (`mascota_id`),
  KEY `idx_recomendaciones_preferencia` (`preferencia_usuario_id`),
  KEY `idx_recomendaciones_publicacion` (`publicacion_id`),
  KEY `idx_recomendaciones_usuario_estado` (`usuario_id`, `estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recordatorios` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` CHAR(36) NOT NULL,
  `mascota_id` CHAR(36) NOT NULL,
  `registro_vacunacion_id` CHAR(36) NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `fecha_programada` DATETIME(3) NOT NULL,
  `tipo` ENUM('VACUNACION', 'CONTROL_VETERINARIO', 'DESPARASITACION', 'ESTERILIZACION', 'MEDICACION', 'OTRO') NOT NULL,
  `estado` ENUM('PROGRAMADO', 'ENVIADO', 'COMPLETADO', 'POSPUESTO', 'CANCELADO') NOT NULL DEFAULT 'PROGRAMADO',
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_completado` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_recordatorios_estado_fecha` (`estado`, `fecha_programada`),
  KEY `idx_recordatorios_mascota` (`mascota_id`),
  KEY `idx_recordatorios_registro_vacunacion` (`registro_vacunacion_id`),
  KEY `idx_recordatorios_usuario` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registros_peso` (
  `id` CHAR(36) NOT NULL,
  `mascota_id` CHAR(36) NOT NULL,
  `peso_kg` DECIMAL(5,2) NOT NULL,
  `fecha_medicion` DATE NOT NULL,
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_registros_peso_mascota_fecha` (`mascota_id`, `fecha_medicion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `registros_vacunacion` (
  `id` CHAR(36) NOT NULL,
  `mascota_id` CHAR(36) NOT NULL,
  `vacuna_id` CHAR(36) NOT NULL,
  `regla_vacunacion_id` CHAR(36) NULL,
  `registrado_por_id` CHAR(36) NOT NULL,
  `veterinaria_id` CHAR(36) NULL,
  `fecha_aplicacion` DATE NULL,
  `dosis` VARCHAR(60) NULL,
  `lote` VARCHAR(60) NULL,
  `observaciones` TEXT NULL,
  `fecha_proxima_aplicacion` DATE NULL,
  `origen` ENUM('PROPIETARIO', 'VETERINARIA', 'IMPORTADO') NOT NULL,
  `estado` ENUM('APLICADA_DECLARADA', 'APLICADA_VERIFICADA', 'PENDIENTE', 'POR_VERIFICAR', 'ANULADA') NOT NULL DEFAULT 'APLICADA_DECLARADA',
  `comprobante` VARCHAR(500) NULL,
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_registros_vacunacion_estado` (`estado`),
  KEY `idx_registros_vacunacion_mascota_proxima` (`mascota_id`, `fecha_proxima_aplicacion`),
  KEY `idx_registros_vacunacion_registrado_por` (`registrado_por_id`),
  KEY `idx_registros_vacunacion_regla` (`regla_vacunacion_id`),
  KEY `idx_registros_vacunacion_vacuna` (`vacuna_id`),
  KEY `idx_registros_vacunacion_veterinaria` (`veterinaria_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reglas_vacunacion` (
  `id` CHAR(36) NOT NULL,
  `vacuna_id` CHAR(36) NOT NULL,
  `especie` ENUM('PERRO', 'GATO') NOT NULL,
  `edad_minima_meses` INT UNSIGNED NOT NULL DEFAULT 0,
  `edad_maxima_meses` INT UNSIGNED NULL,
  `intervalo_refuerzo_dias` INT UNSIGNED NULL,
  `numero_dosis` INT UNSIGNED NOT NULL DEFAULT 1,
  `observaciones` TEXT NULL,
  `fuente_referencia` VARCHAR(255) NULL,
  `fecha_revision` DATE NULL,
  `requiere_revision_veterinaria` BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_reglas_vacunacion_especie_edad` (`especie`, `edad_minima_meses`),
  KEY `idx_reglas_vacunacion_vacuna` (`vacuna_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `servicios` (
  `publicacion_id` CHAR(36) NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `especie_objetivo` ENUM('PERRO', 'GATO') NULL,
  `modalidad` VARCHAR(60) NULL,
  `precio_desde` DECIMAL(12,2) NULL,
  `requisitos` TEXT NULL,
  PRIMARY KEY (`publicacion_id`),
  KEY `idx_servicios_categoria_especie` (`categoria`, `especie_objetivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuarios` (
  `cuenta_id` CHAR(36) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `numero_documento` VARCHAR(30) NULL,
  UNIQUE KEY `uq_usuarios_numero_documento` (`numero_documento`),
  `telefono` VARCHAR(30) NULL,
  `ciudad` VARCHAR(100) NULL,
  `direccion` VARCHAR(255) NULL,
  PRIMARY KEY (`cuenta_id`),
  KEY `idx_usuarios_ciudad` (`ciudad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vacunas` (
  `id` CHAR(36) NOT NULL,
  `nombre` VARCHAR(120) NOT NULL,
  UNIQUE KEY `uq_vacunas_nombre` (`nombre`),
  `descripcion` TEXT NULL,
  `fabricante` VARCHAR(120) NULL,
  `activa` BOOLEAN NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `veterinarias` (
  `proveedor_id` CHAR(36) NOT NULL,
  `nombre_responsable` VARCHAR(150) NOT NULL,
  `registro_profesional` VARCHAR(60) NOT NULL,
  UNIQUE KEY `uq_veterinarias_registro_profesional` (`registro_profesional`),
  `horario_atencion` VARCHAR(255) NULL,
  `servicios_clinicos` TEXT NULL,
  PRIMARY KEY (`proveedor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `citas` (
  `id` CHAR(36) NOT NULL,
  `mascota_id` CHAR(36) NOT NULL,
  `propietario_id` CHAR(36) NOT NULL,
  `proveedor_id` CHAR(36) NOT NULL,
  `servicio_id` CHAR(36) NULL,
  `fecha_solicitada` DATETIME(3) NOT NULL,
  `estado` ENUM('SOLICITADA', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA') NOT NULL DEFAULT 'SOLICITADA',
  `motivo` TEXT NULL,
  `notas_proveedor` TEXT NULL,
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_citas_propietario_fecha` (`propietario_id`, `fecha_solicitada`),
  KEY `idx_citas_proveedor_estado_fecha` (`proveedor_id`, `estado`, `fecha_solicitada`),
  KEY `idx_citas_mascota` (`mascota_id`),
  KEY `idx_citas_servicio` (`servicio_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `external_api_tokens` (
  `id` CHAR(36) NOT NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `contract_reference` VARCHAR(100) NOT NULL,
  `purpose` VARCHAR(255) NOT NULL,
  `scopes` JSON NOT NULL,
  `created_by_id` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expires_at` DATETIME(3) NOT NULL,
  `revoked_at` DATETIME(3) NULL,
  `last_used_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_external_tokens_active_expiry` (`expires_at`, `revoked_at`),
  KEY `idx_external_tokens_creator` (`created_by_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `autorizaciones_datos` ADD CONSTRAINT `fk_autorizaciones_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`cuenta_id`) ON UPDATE CASCADE;
ALTER TABLE `autorizaciones_datos` ADD CONSTRAINT `fk_autorizaciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `campanas` ADD CONSTRAINT `fk_campanas_publicacion` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `empresas` ADD CONSTRAINT `fk_empresas_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `historial_salud` ADD CONSTRAINT `fk_historial_salud_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `historial_salud` ADD CONSTRAINT `fk_historial_salud_registrado_por` FOREIGN KEY (`registrado_por_id`) REFERENCES `cuentas_acceso` (`id`) ON UPDATE CASCADE;
ALTER TABLE `mascotas` ADD CONSTRAINT `fk_mascotas_propietario` FOREIGN KEY (`propietario_id`) REFERENCES `usuarios` (`cuenta_id`) ON UPDATE CASCADE;
ALTER TABLE `notificaciones` ADD CONSTRAINT `fk_notificaciones_recordatorio` FOREIGN KEY (`recordatorio_id`) REFERENCES `recordatorios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `preferencias_usuario` ADD CONSTRAINT `fk_preferencias_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_publicacion` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `proveedores` ADD CONSTRAINT `fk_proveedores_cuenta` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_acceso` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `publicaciones` ADD CONSTRAINT `fk_publicaciones_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `recomendaciones` ADD CONSTRAINT `fk_recomendaciones_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON UPDATE CASCADE;
ALTER TABLE `recomendaciones` ADD CONSTRAINT `fk_recomendaciones_preferencia` FOREIGN KEY (`preferencia_usuario_id`) REFERENCES `preferencias_usuario` (`id`) ON UPDATE CASCADE;
ALTER TABLE `recomendaciones` ADD CONSTRAINT `fk_recomendaciones_publicacion` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `recomendaciones` ADD CONSTRAINT `fk_recomendaciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `recordatorios` ADD CONSTRAINT `fk_recordatorios_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `recordatorios` ADD CONSTRAINT `fk_recordatorios_registro_vacunacion` FOREIGN KEY (`registro_vacunacion_id`) REFERENCES `registros_vacunacion` (`id`) ON UPDATE CASCADE;
ALTER TABLE `recordatorios` ADD CONSTRAINT `fk_recordatorios_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `registros_peso` ADD CONSTRAINT `fk_registros_peso_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `fk_registros_vacunacion_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `fk_registros_vacunacion_registrado_por` FOREIGN KEY (`registrado_por_id`) REFERENCES `cuentas_acceso` (`id`) ON UPDATE CASCADE;
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `fk_registros_vacunacion_regla` FOREIGN KEY (`regla_vacunacion_id`) REFERENCES `reglas_vacunacion` (`id`) ON UPDATE CASCADE;
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `fk_registros_vacunacion_vacuna` FOREIGN KEY (`vacuna_id`) REFERENCES `vacunas` (`id`) ON UPDATE CASCADE;
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `fk_registros_vacunacion_veterinaria` FOREIGN KEY (`veterinaria_id`) REFERENCES `veterinarias` (`proveedor_id`) ON UPDATE CASCADE;
ALTER TABLE `reglas_vacunacion` ADD CONSTRAINT `fk_reglas_vacunacion_vacuna` FOREIGN KEY (`vacuna_id`) REFERENCES `vacunas` (`id`) ON UPDATE CASCADE;
ALTER TABLE `servicios` ADD CONSTRAINT `fk_servicios_publicacion` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `usuarios` ADD CONSTRAINT `fk_usuarios_cuenta` FOREIGN KEY (`cuenta_id`) REFERENCES `cuentas_acceso` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `veterinarias` ADD CONSTRAINT `fk_veterinarias_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_mascota` FOREIGN KEY (`mascota_id`) REFERENCES `mascotas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_propietario` FOREIGN KEY (`propietario_id`) REFERENCES `usuarios` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`cuenta_id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `citas` ADD CONSTRAINT `fk_citas_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `publicaciones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS = 1;
