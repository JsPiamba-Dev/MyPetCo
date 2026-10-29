-- MyPetCo: esquema completo + datos demo derivados de prisma/schema.prisma y prisma/seed.ts
-- IMPORTANTE: ejecutar en una base de datos de desarrollo. Crea tablas y carga datos ficticios.
CREATE DATABASE IF NOT EXISTS `mypetco_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mypetco_db`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `autorizaciones_datos` (
  `id` CHAR(36) NOT NULL,
  `usuario_id` CHAR(36) NOT NULL,
  `proveedor_id` CHAR(36) NULL,
  `finalidad` VARCHAR(255) NOT NULL,
  `fecha_autorizacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_revocacion` DATETIME(3) NULL,
  `vigente` BOOLEAN NOT NULL DEFAULT 1,
  `version_aviso_privacidad` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_autorizaciones_proveedor` (`proveedor_id`),
  KEY `idx_autorizaciones_usuario_vigente` (`usuario_id`, `vigente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
INSERT INTO `cuentas_acceso` (`id`, `correo`, `hash_contrasena`, `rol`, `estado`, `fecha_registro`) VALUES ('d90675a0-18d0-5dcb-abf7-d16100d25f4c', 'admin.demo@mypetco.local', '$2b$10$0YVEsOs05iGHbtEvNJCQbuRp969qBzNB.BEtY5vrAXV5EK/Bppv4i', 'ADMINISTRADOR', 'ACTIVA', '2026-10-28 12:00:00.000');
INSERT INTO `cuentas_acceso` (`id`, `correo`, `hash_contrasena`, `rol`, `estado`, `fecha_registro`) VALUES ('8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'propietario.demo@mypetco.local', '$2b$10$0YVEsOs05iGHbtEvNJCQbuRp969qBzNB.BEtY5vrAXV5EK/Bppv4i', 'PROPIETARIO', 'ACTIVA', '2026-10-28 12:00:00.000');
INSERT INTO `cuentas_acceso` (`id`, `correo`, `hash_contrasena`, `rol`, `estado`, `fecha_registro`) VALUES ('097d0fca-3810-5db8-a45e-cbf7b5773158', 'propietario2.demo@mypetco.local', '$2b$10$0YVEsOs05iGHbtEvNJCQbuRp969qBzNB.BEtY5vrAXV5EK/Bppv4i', 'PROPIETARIO', 'ACTIVA', '2026-10-28 12:00:00.000');
INSERT INTO `cuentas_acceso` (`id`, `correo`, `hash_contrasena`, `rol`, `estado`, `fecha_registro`) VALUES ('3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'veterinaria.demo@mypetco.local', '$2b$10$0YVEsOs05iGHbtEvNJCQbuRp969qBzNB.BEtY5vrAXV5EK/Bppv4i', 'VETERINARIA', 'ACTIVA', '2026-10-28 12:00:00.000');
INSERT INTO `cuentas_acceso` (`id`, `correo`, `hash_contrasena`, `rol`, `estado`, `fecha_registro`) VALUES ('eaa020be-b734-593b-a210-b96b7e614710', 'empresa.demo@mypetco.local', '$2b$10$0YVEsOs05iGHbtEvNJCQbuRp969qBzNB.BEtY5vrAXV5EK/Bppv4i', 'EMPRESA', 'ACTIVA', '2026-10-28 12:00:00.000');
INSERT INTO `cuentas_acceso` (`id`, `correo`, `hash_contrasena`, `rol`, `estado`, `fecha_registro`) VALUES ('7f070218-43b5-5533-ab5a-eed26aaed17c', 'tienda.demo@mypetco.local', '$2b$10$0YVEsOs05iGHbtEvNJCQbuRp969qBzNB.BEtY5vrAXV5EK/Bppv4i', 'EMPRESA', 'ACTIVA', '2026-10-28 12:00:00.000');
INSERT INTO `usuarios` (`cuenta_id`, `nombre`, `telefono`, `ciudad`) VALUES ('8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'Laura Martínez', '3000000001', 'Bogotá');
INSERT INTO `usuarios` (`cuenta_id`, `nombre`, `telefono`, `ciudad`) VALUES ('097d0fca-3810-5db8-a45e-cbf7b5773158', 'Andrés Rodríguez', '3000000002', 'Fusagasugá');
INSERT INTO `proveedores` (`cuenta_id`, `nombre_comercial`, `descripcion`, `ciudad`, `telefono_contacto`, `direccion`, `estado_proveedor`) VALUES ('3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'Clínica Veterinaria Huellas', 'Atención veterinaria general y preventiva.', 'Bogotá', '6010000001', 'Dirección de demostración, Bogotá', 'ACTIVO');
INSERT INTO `proveedores` (`cuenta_id`, `nombre_comercial`, `descripcion`, `ciudad`, `telefono_contacto`, `direccion`, `estado_proveedor`) VALUES ('eaa020be-b734-593b-a210-b96b7e614710', 'Pet Natural Demo', 'Productos de alimentación y bienestar animal.', 'Bogotá', '6010000002', 'Dirección de demostración, Bogotá', 'ACTIVO');
INSERT INTO `proveedores` (`cuenta_id`, `nombre_comercial`, `descripcion`, `ciudad`, `telefono_contacto`, `direccion`, `estado_proveedor`) VALUES ('7f070218-43b5-5533-ab5a-eed26aaed17c', 'Mundo Mascota Demo', 'Accesorios y productos para perros y gatos.', 'Fusagasugá', '6010000003', 'Dirección de demostración, Fusagasugá', 'ACTIVO');
INSERT INTO `veterinarias` (`proveedor_id`, `nombre_responsable`, `registro_profesional`, `horario_atencion`, `servicios_clinicos`) VALUES ('3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'Dra. Veterinaria Demo', 'DEMO-VET-0001', 'Lunes a viernes, horario de demostración', 'Consulta general, vacunación y medicina preventiva');
INSERT INTO `empresas` (`proveedor_id`, `identificacion_tributaria`, `categoria_comercial`) VALUES ('eaa020be-b734-593b-a210-b96b7e614710', 'DEMO-NIT-0001', 'Alimentos para mascotas');
INSERT INTO `empresas` (`proveedor_id`, `identificacion_tributaria`, `categoria_comercial`) VALUES ('7f070218-43b5-5533-ab5a-eed26aaed17c', 'DEMO-NIT-0002', 'Accesorios para mascotas');
INSERT INTO `mascotas` (`id`, `propietario_id`, `nombre`, `especie`, `raza`, `fecha_nacimiento`, `sexo`, `peso_kg`, `observaciones`, `fecha_registro`) VALUES ('1acb600b-7fec-5e89-af99-0c21c245c420', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'Luna', 'PERRO', 'Labrador', '2023-04-10', 'HEMBRA', '22.50', 'Mascota de demostración para pruebas de MyPetCo.', '2026-10-28 12:00:00.000');
INSERT INTO `mascotas` (`id`, `propietario_id`, `nombre`, `especie`, `raza`, `fecha_nacimiento`, `sexo`, `peso_kg`, `observaciones`, `fecha_registro`) VALUES ('1a2d3a72-6b02-5b18-a7bb-f970fd96b42b', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'Milo', 'GATO', 'Criollo', '2024-02-15', 'MACHO', '4.20', 'Mascota de demostración para pruebas de MyPetCo.', '2026-10-28 12:00:00.000');
INSERT INTO `mascotas` (`id`, `propietario_id`, `nombre`, `especie`, `raza`, `fecha_nacimiento`, `sexo`, `peso_kg`, `observaciones`, `fecha_registro`) VALUES ('1c577d58-57ba-52ee-a8ce-715b8caf117e', '097d0fca-3810-5db8-a45e-cbf7b5773158', 'Rocky', 'PERRO', 'Criollo', '2021-08-20', 'MACHO', '15.00', 'Mascota de demostración para pruebas de MyPetCo.', '2026-10-28 12:00:00.000');
INSERT INTO `vacunas` (`id`, `nombre`, `descripcion`, `fabricante`, `activa`) VALUES ('72b9b755-921d-5c6e-a463-59903857f644', 'Vacuna polivalente canina', 'Protección frente a enfermedades caninas incluidas en la formulación.', 'Por definir según producto veterinario', 1);
INSERT INTO `reglas_vacunacion` (`id`, `vacuna_id`, `especie`, `edad_minima_meses`, `numero_dosis`, `observaciones`, `fuente_referencia`, `requiere_revision_veterinaria`) VALUES ('546c4d01-ec2b-566f-a472-8ac5609f817c', '72b9b755-921d-5c6e-a463-59903857f644', 'PERRO', 0, 1, 'Regla inicial de catálogo. El calendario y los refuerzos deben validarse con un profesional veterinario.', 'Pendiente de validación veterinaria para Colombia', 1);
INSERT INTO `vacunas` (`id`, `nombre`, `descripcion`, `fabricante`, `activa`) VALUES ('375c63cb-8c34-572d-a555-34c29398087a', 'Vacuna contra la rabia para perros', 'Vacunación antirrábica; aplicar según normativa y criterio veterinario.', 'Por definir según producto veterinario', 1);
INSERT INTO `reglas_vacunacion` (`id`, `vacuna_id`, `especie`, `edad_minima_meses`, `numero_dosis`, `observaciones`, `fuente_referencia`, `requiere_revision_veterinaria`) VALUES ('bb85a855-0454-58ef-aa66-d158c2e0d1b7', '375c63cb-8c34-572d-a555-34c29398087a', 'PERRO', 0, 1, 'Regla inicial de catálogo. El calendario y los refuerzos deben validarse con un profesional veterinario.', 'Pendiente de validación veterinaria para Colombia', 1);
INSERT INTO `vacunas` (`id`, `nombre`, `descripcion`, `fabricante`, `activa`) VALUES ('fbf5ae8b-355c-5b7d-a78a-c5e7f004932c', 'Vacuna contra leptospirosis canina', 'La indicación depende de la exposición y evaluación veterinaria.', 'Por definir según producto veterinario', 1);
INSERT INTO `reglas_vacunacion` (`id`, `vacuna_id`, `especie`, `edad_minima_meses`, `numero_dosis`, `observaciones`, `fuente_referencia`, `requiere_revision_veterinaria`) VALUES ('1cb4ba84-598a-5e38-a204-d545b49b17d4', 'fbf5ae8b-355c-5b7d-a78a-c5e7f004932c', 'PERRO', 0, 1, 'Regla inicial de catálogo. El calendario y los refuerzos deben validarse con un profesional veterinario.', 'Pendiente de validación veterinaria para Colombia', 1);
INSERT INTO `vacunas` (`id`, `nombre`, `descripcion`, `fabricante`, `activa`) VALUES ('cec7eaac-7d40-5171-a152-6d82fa7616c9', 'Vacuna triple felina', 'Protección frente a panleucopenia, herpesvirus felino y calicivirus.', 'Por definir según producto veterinario', 1);
INSERT INTO `reglas_vacunacion` (`id`, `vacuna_id`, `especie`, `edad_minima_meses`, `numero_dosis`, `observaciones`, `fuente_referencia`, `requiere_revision_veterinaria`) VALUES ('a21987a2-0dad-5122-ae83-155a14fdd92e', 'cec7eaac-7d40-5171-a152-6d82fa7616c9', 'GATO', 0, 1, 'Regla inicial de catálogo. El calendario y los refuerzos deben validarse con un profesional veterinario.', 'Pendiente de validación veterinaria para Colombia', 1);
INSERT INTO `vacunas` (`id`, `nombre`, `descripcion`, `fabricante`, `activa`) VALUES ('82ffe779-ac4c-5e80-a61e-bd83481f4941', 'Vacuna contra la rabia para gatos', 'Vacunación antirrábica según normativa y evaluación veterinaria.', 'Por definir según producto veterinario', 1);
INSERT INTO `reglas_vacunacion` (`id`, `vacuna_id`, `especie`, `edad_minima_meses`, `numero_dosis`, `observaciones`, `fuente_referencia`, `requiere_revision_veterinaria`) VALUES ('2e5686dc-ce46-5d9f-aba7-ad4b73c9ea3c', '82ffe779-ac4c-5e80-a61e-bd83481f4941', 'GATO', 0, 1, 'Regla inicial de catálogo. El calendario y los refuerzos deben validarse con un profesional veterinario.', 'Pendiente de validación veterinaria para Colombia', 1);
INSERT INTO `publicaciones` (`id`, `proveedor_id`, `tipo`, `titulo`, `descripcion`, `ciudad`, `activa`, `fecha_publicacion`, `fecha_actualizacion`) VALUES ('04a5626f-6c1c-50c0-a374-d7ea79117ba6', 'eaa020be-b734-593b-a210-b96b7e614710', 'PRODUCTO', 'Alimento balanceado para perros', 'Producto de demostración. Verificar composición y etapa de vida.', 'Bogotá', 1, '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `publicaciones` (`id`, `proveedor_id`, `tipo`, `titulo`, `descripcion`, `ciudad`, `activa`, `fecha_publicacion`, `fecha_actualizacion`) VALUES ('e2ba39f3-042a-56f4-a754-fc64dda55b3d', '7f070218-43b5-5533-ab5a-eed26aaed17c', 'PRODUCTO', 'Arenero para gatos', 'Accesorio de demostración para gatos.', 'Fusagasugá', 1, '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `publicaciones` (`id`, `proveedor_id`, `tipo`, `titulo`, `descripcion`, `ciudad`, `activa`, `fecha_publicacion`, `fecha_actualizacion`) VALUES ('f313c414-bc61-5b9b-a8d4-4528e93837c7', '3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'SERVICIO', 'Consulta veterinaria general', 'Servicio de demostración sujeto a disponibilidad.', 'Bogotá', 1, '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `publicaciones` (`id`, `proveedor_id`, `tipo`, `titulo`, `descripcion`, `ciudad`, `activa`, `fecha_publicacion`, `fecha_actualizacion`) VALUES ('1bca6434-5697-5409-abef-81f03743d8da', '3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'CAMPANA', 'Jornada de vacunación preventiva', 'Campaña de demostración; no representa una jornada real confirmada.', 'Bogotá', 1, '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `productos` (`publicacion_id`, `categoria`, `especie_objetivo`, `etapa_vida`, `precio`, `moneda`, `disponibilidad`) VALUES ('04a5626f-6c1c-50c0-a374-d7ea79117ba6', 'Alimento', 'PERRO', 'ADULTO', '85000.00', 'COP', 'Dato de demostración');
INSERT INTO `productos` (`publicacion_id`, `categoria`, `especie_objetivo`, `etapa_vida`, `precio`, `moneda`, `disponibilidad`) VALUES ('e2ba39f3-042a-56f4-a754-fc64dda55b3d', 'Higiene', 'GATO', 'NO_ESPECIFICADA', '45000.00', 'COP', 'Dato de demostración');
INSERT INTO `servicios` (`publicacion_id`, `categoria`, `modalidad`, `precio_desde`, `requisitos`) VALUES ('f313c414-bc61-5b9b-a8d4-4528e93837c7', 'Consulta veterinaria', 'Presencial', '60000.00', 'Precio y disponibilidad de demostración; confirmar con el proveedor.');
INSERT INTO `campanas` (`publicacion_id`, `tipo_campana`, `fecha_inicio`, `fecha_fin`, `lugar`, `cupos_totales`, `cupos_disponibles`, `requisitos`) VALUES ('1bca6434-5697-5409-abef-81f03743d8da', 'VACUNACION', '2026-11-01 12:00:00.000', '2026-11-30 12:00:00.000', 'Bogotá — ubicación de demostración', 30, 30, 'Campaña de prueba. No publicar como evento real.');
INSERT INTO `registros_vacunacion` (`id`, `mascota_id`, `vacuna_id`, `regla_vacunacion_id`, `registrado_por_id`, `fecha_aplicacion`, `dosis`, `observaciones`, `origen`, `estado`, `fecha_creacion`) VALUES ('ff91950f-1209-51d5-a6b2-d23e1ae53ac4', '1acb600b-7fec-5e89-af99-0c21c245c420', '72b9b755-921d-5c6e-a463-59903857f644', '546c4d01-ec2b-566f-a472-8ac5609f817c', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', '2025-10-10', 'Dosis de demostración', 'Registro ficticio para probar la interfaz. No es un antecedente clínico real.', 'PROPIETARIO', 'APLICADA_DECLARADA', '2026-10-28 12:00:00.000');
INSERT INTO `registros_vacunacion` (`id`, `mascota_id`, `vacuna_id`, `regla_vacunacion_id`, `registrado_por_id`, `fecha_aplicacion`, `dosis`, `observaciones`, `origen`, `estado`, `fecha_creacion`) VALUES ('8888f5e0-28c4-54ca-a23f-54b7254ed995', '1a2d3a72-6b02-5b18-a7bb-f970fd96b42b', 'cec7eaac-7d40-5171-a152-6d82fa7616c9', 'a21987a2-0dad-5122-ae83-155a14fdd92e', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', '2025-09-15', 'Dosis de demostración', 'Registro ficticio para probar la interfaz. No es un antecedente clínico real.', 'PROPIETARIO', 'APLICADA_DECLARADA', '2026-10-28 12:00:00.000');
INSERT INTO `registros_peso` (`id`, `mascota_id`, `peso_kg`, `fecha_medicion`, `fecha_creacion`) VALUES ('73948ede-63a5-5817-ae11-1c5cfc908054', '1acb600b-7fec-5e89-af99-0c21c245c420', '22.50', '2026-01-10', '2026-10-28 12:00:00.000');
INSERT INTO `historial_salud` (`id`, `mascota_id`, `registrado_por_id`, `fecha_evento`, `tipo_evento`, `descripcion`, `observaciones`, `fecha_creacion`, `fecha_actualizacion`) VALUES ('3f894f30-8246-55c4-a8ca-359d2e27e75d', '1acb600b-7fec-5e89-af99-0c21c245c420', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', '2026-01-10', 'CONTROL', 'Evento ficticio para pruebas de historial de salud.', 'No corresponde a una consulta real.', '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `preferencias_usuario` (`id`, `usuario_id`, `ciudad_preferida`, `categorias_interes`, `acepta_recomendaciones`, `acepta_notificaciones`) VALUES ('0a96b364-fc8d-5700-aaca-f68d590a0d48', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'Bogotá', 'Veterinaria,Alimentos,Higiene', 1, 1);
INSERT INTO `autorizaciones_datos` (`id`, `usuario_id`, `finalidad`, `vigente`, `version_aviso_privacidad`, `fecha_autorizacion`) VALUES ('2f8bcec5-9653-52da-a5ef-523295afd9a8', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'Registro ficticio de autorización para pruebas de desarrollo', 1, 'DEMO-1', '2026-10-28 12:00:00.000');
INSERT INTO `recomendaciones` (`id`, `usuario_id`, `publicacion_id`, `mascota_id`, `preferencia_usuario_id`, `motivo`, `puntuacion`, `estado`, `fecha_generacion`) VALUES ('fdd0b2b6-3225-5231-a934-b1f2918f4c9e', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', 'f313c414-bc61-5b9b-a8d4-4528e93837c7', '1acb600b-7fec-5e89-af99-0c21c245c420', '0a96b364-fc8d-5700-aaca-f68d590a0d48', 'Recomendación de demostración para pruebas.', '90.00', 'NUEVA', '2026-10-28 12:00:00.000');
INSERT INTO `recordatorios` (`id`, `usuario_id`, `mascota_id`, `titulo`, `descripcion`, `fecha_programada`, `tipo`, `estado`, `fecha_creacion`) VALUES ('25f1afd8-8bc9-58b6-a200-8a05ab96b935', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', '1acb600b-7fec-5e89-af99-0c21c245c420', 'Revisar calendario de vacunación', 'Recordatorio de demostración; confirmar fechas con la veterinaria.', '2026-11-15 12:00:00.000', 'VACUNACION', 'PROGRAMADO', '2026-10-28 12:00:00.000');
INSERT INTO `notificaciones` (`id`, `recordatorio_id`, `mensaje`, `canal`, `estado`) VALUES ('c28b0c40-bcae-5ade-acb3-672267fc1e8a', '25f1afd8-8bc9-58b6-a200-8a05ab96b935', 'Recuerda revisar el calendario de vacunación de Luna.', 'INTERNA', 'PENDIENTE');
INSERT INTO `citas` (`id`, `mascota_id`, `propietario_id`, `proveedor_id`, `servicio_id`, `fecha_solicitada`, `estado`, `motivo`, `fecha_creacion`, `fecha_actualizacion`) VALUES ('74c041f7-e3f1-5c2e-a9de-90c0366a83c8', '1acb600b-7fec-5e89-af99-0c21c245c420', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', '3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'f313c414-bc61-5b9b-a8d4-4528e93837c7', '2026-11-04 12:00:00.000', 'SOLICITADA', 'Consulta general de control para Luna.', '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `citas` (`id`, `mascota_id`, `propietario_id`, `proveedor_id`, `servicio_id`, `fecha_solicitada`, `estado`, `motivo`, `fecha_creacion`, `fecha_actualizacion`) VALUES ('f5e18684-dfaa-5e21-ae59-bdbe64737392', '1c577d58-57ba-52ee-a8ce-715b8caf117e', '097d0fca-3810-5db8-a45e-cbf7b5773158', '3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'f313c414-bc61-5b9b-a8d4-4528e93837c7', '2026-11-07 12:00:00.000', 'CONFIRMADA', 'Revisión preventiva de Rocky.', '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `citas` (`id`, `mascota_id`, `propietario_id`, `proveedor_id`, `servicio_id`, `fecha_solicitada`, `estado`, `motivo`, `fecha_creacion`, `fecha_actualizacion`) VALUES ('63664ec0-3816-5483-a2cf-6cfa08c2e7bf', '1a2d3a72-6b02-5b18-a7bb-f970fd96b42b', '8fab1bf7-2f77-52c1-ad95-1126c07b8ec5', '3a887397-16b1-5df4-a08a-1e3fdcc46bde', 'f313c414-bc61-5b9b-a8d4-4528e93837c7', '2026-11-11 12:00:00.000', 'SOLICITADA', 'Consulta de revisión para Milo.', '2026-10-28 12:00:00.000', '2026-10-28 12:00:00.000');
INSERT INTO `external_api_tokens` (`id`, `client_name`, `contract_reference`, `purpose`, `scopes`, `created_by_id`, `created_at`, `expires_at`) VALUES ('7ce4215e-7453-51b3-ae06-b2f9d05d352c', 'Integración demo MyPetCo', 'DEMO-CONTRACT-001', 'Pruebas de analítica agregada de mascotas', '["analytics:read","pets:aggregate"]', 'd90675a0-18d0-5dcb-abf7-d16100d25f4c', '2026-10-28 12:00:00.000', '2027-04-26 12:00:00.000');

-- Cuentas de demostración: admin.demo@mypetco.local, propietario.demo@mypetco.local, propietario2@mypetco.local, veterinaria.demo@mypetco.local, empresa.demo@mypetco.local, tienda.demo@mypetco.local
-- Contraseña común: MyPetCo_Demo2026!
-- Datos ficticios para desarrollo; las fechas de citas se fijaron en noviembre de 2026.
