
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * IDs estables: el mismo nombre siempre genera el mismo UUID.
 * Así el seed puede ejecutarse varias veces.
 */
function id(nombre: string): string {
  const hash = createHash("sha1").update(`mypetco-seed:${nombre}`).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const fecha = (valor: string) => new Date(`${valor}T12:00:00.000Z`);

async function main() {
  const hashContrasena = await bcrypt.hash("MyPetCo_Demo2026!", 10);

  // =========================================================
  // 1. CUENTAS DE ACCESO
  // =========================================================
  const cuentas = [
    { key: "admin", correo: "admin.demo@mypetco.local", rol: "ADMINISTRADOR" },
    { key: "dueno1", correo: "propietario.demo@mypetco.local", rol: "PROPIETARIO" },
    { key: "dueno2", correo: "propietario2.demo@mypetco.local", rol: "PROPIETARIO" },
    { key: "vet1", correo: "veterinaria.demo@mypetco.local", rol: "VETERINARIA" },
    { key: "empresa1", correo: "empresa.demo@mypetco.local", rol: "EMPRESA" },
    { key: "empresa2", correo: "tienda.demo@mypetco.local", rol: "EMPRESA" },
  ] as const;

  for (const cuenta of cuentas) {
    await prisma.cuentas_acceso.upsert({
      where: { id: id(cuenta.key) },
      update: {},
      create: {
        id: id(cuenta.key),
        correo: cuenta.correo,
        hash_contrasena: hashContrasena,
        rol: cuenta.rol,
        estado: "ACTIVA",
      },
    });
  }

  // =========================================================
  // 2. PERFILES DE USUARIO
  // =========================================================
  const usuarios = [
    { key: "dueno1", nombre: "Laura Martínez", telefono: "3000000001", ciudad: "Bogotá" },
    { key: "dueno2", nombre: "Andrés Rodríguez", telefono: "3000000002", ciudad: "Fusagasugá" },
  ];

  for (const u of usuarios) {
    await prisma.usuarios.upsert({
      where: { cuenta_id: id(u.key) },
      update: {},
      create: {
        cuenta_id: id(u.key),
        nombre: u.nombre,
        telefono: u.telefono,
        ciudad: u.ciudad,
      },
    });
  }

  // =========================================================
  // 3. PROVEEDORES: VETERINARIA Y EMPRESAS
  // =========================================================
  const proveedores = [
    {
      key: "vet1",
      nombre_comercial: "Clínica Veterinaria Huellas",
      descripcion: "Atención veterinaria general y preventiva.",
      ciudad: "Bogotá",
      telefono_contacto: "6010000001",
      direccion: "Dirección de demostración, Bogotá",
    },
    {
      key: "empresa1",
      nombre_comercial: "Pet Natural Demo",
      descripcion: "Productos de alimentación y bienestar animal.",
      ciudad: "Bogotá",
      telefono_contacto: "6010000002",
      direccion: "Dirección de demostración, Bogotá",
    },
    {
      key: "empresa2",
      nombre_comercial: "Mundo Mascota Demo",
      descripcion: "Accesorios y productos para perros y gatos.",
      ciudad: "Fusagasugá",
      telefono_contacto: "6010000003",
      direccion: "Dirección de demostración, Fusagasugá",
    },
  ];

  for (const p of proveedores) {
    await prisma.proveedores.upsert({
      where: { cuenta_id: id(p.key) },
      update: {},
      create: {
        cuenta_id: id(p.key),
        nombre_comercial: p.nombre_comercial,
        descripcion: p.descripcion,
        ciudad: p.ciudad,
        telefono_contacto: p.telefono_contacto,
        direccion: p.direccion,
        estado_proveedor: "ACTIVO",
      },
    });
  }

  await prisma.veterinarias.upsert({
    where: { proveedor_id: id("vet1") },
    update: {},
    create: {
      proveedor_id: id("vet1"),
      nombre_responsable: "Dra. Veterinaria Demo",
      registro_profesional: "DEMO-VET-0001",
      horario_atencion: "Lunes a viernes, horario de demostración",
      servicios_clinicos: "Consulta general, vacunación y medicina preventiva",
    },
  });

  await prisma.empresas.upsert({
    where: { proveedor_id: id("empresa1") },
    update: {},
    create: {
      proveedor_id: id("empresa1"),
      identificacion_tributaria: "DEMO-NIT-0001",
      categoria_comercial: "Alimentos para mascotas",
    },
  });

  await prisma.empresas.upsert({
    where: { proveedor_id: id("empresa2") },
    update: {},
    create: {
      proveedor_id: id("empresa2"),
      identificacion_tributaria: "DEMO-NIT-0002",
      categoria_comercial: "Accesorios para mascotas",
    },
  });

  // =========================================================
  // 4. MASCOTAS
  // =========================================================
  const mascotas = [
    {
      key: "luna",
      propietario: "dueno1",
      nombre: "Luna",
      especie: "PERRO" as const,
      raza: "Labrador",
      nacimiento: "2023-04-10",
      sexo: "HEMBRA" as const,
      peso: "22.50",
    },
    {
      key: "milo",
      propietario: "dueno1",
      nombre: "Milo",
      especie: "GATO" as const,
      raza: "Criollo",
      nacimiento: "2024-02-15",
      sexo: "MACHO" as const,
      peso: "4.20",
    },
    {
      key: "rocky",
      propietario: "dueno2",
      nombre: "Rocky",
      especie: "PERRO" as const,
      raza: "Criollo",
      nacimiento: "2021-08-20",
      sexo: "MACHO" as const,
      peso: "15.00",
    },
  ];

  for (const m of mascotas) {
    await prisma.mascotas.upsert({
      where: { id: id(m.key) },
      update: {},
      create: {
        id: id(m.key),
        propietario_id: id(m.propietario),
        nombre: m.nombre,
        especie: m.especie,
        raza: m.raza,
        fecha_nacimiento: fecha(m.nacimiento),
        sexo: m.sexo,
        peso_kg: m.peso,
        observaciones: "Mascota de demostración para pruebas de MyPetCo.",
      },
    });
  }

  // =========================================================
  // 5. CATÁLOGO DE VACUNAS Y REGLAS POR ESPECIE
  // =========================================================
  const vacunas = [
    {
      key: "vac-polivalente-perro",
      nombre: "Vacuna polivalente canina",
      descripcion: "Protección frente a enfermedades caninas incluidas en la formulación.",
      fabricante: "Por definir según producto veterinario",
      especies: ["PERRO"] as const,
    },
    {
      key: "vac-rabia-perro",
      nombre: "Vacuna contra la rabia para perros",
      descripcion: "Vacunación antirrábica; aplicar según normativa y criterio veterinario.",
      fabricante: "Por definir según producto veterinario",
      especies: ["PERRO"] as const,
    },
    {
      key: "vac-lepto-perro",
      nombre: "Vacuna contra leptospirosis canina",
      descripcion: "La indicación depende de la exposición y evaluación veterinaria.",
      fabricante: "Por definir según producto veterinario",
      especies: ["PERRO"] as const,
    },
    {
      key: "vac-triple-gato",
      nombre: "Vacuna triple felina",
      descripcion: "Protección frente a panleucopenia, herpesvirus felino y calicivirus.",
      fabricante: "Por definir según producto veterinario",
      especies: ["GATO"] as const,
    },
    {
      key: "vac-rabia-gato",
      nombre: "Vacuna contra la rabia para gatos",
      descripcion: "Vacunación antirrábica según normativa y evaluación veterinaria.",
      fabricante: "Por definir según producto veterinario",
      especies: ["GATO"] as const,
    },
  ];

  for (const v of vacunas) {
    await prisma.vacunas.upsert({
      where: { id: id(v.key) },
      update: {},
      create: {
        id: id(v.key),
        nombre: v.nombre,
        descripcion: v.descripcion,
        fabricante: v.fabricante,
        activa: true,
      },
    });

    for (const especie of v.especies) {
      await prisma.reglas_vacunacion.upsert({
        where: { id: id(`${v.key}-${especie}`) },
        update: {},
        create: {
          id: id(`${v.key}-${especie}`),
          vacuna_id: id(v.key),
          especie,
          edad_minima_meses: 0,
          edad_maxima_meses: null,
          intervalo_refuerzo_dias: null,
          numero_dosis: 1,
          observaciones:
            "Regla inicial de catálogo. El calendario y los refuerzos deben validarse con un profesional veterinario.",
          fuente_referencia: "Pendiente de validación veterinaria para Colombia",
          requiere_revision_veterinaria: true,
        },
      });
    }
  }

  // =========================================================
  // 6. PUBLICACIONES, PRODUCTOS, SERVICIOS Y CAMPAÑAS
  // =========================================================
  const publicaciones = [
    {
      key: "pub-alimento",
      proveedor: "empresa1",
      tipo: "PRODUCTO" as const,
      titulo: "Alimento balanceado para perros",
      descripcion: "Producto de demostración. Verificar composición y etapa de vida.",
      ciudad: "Bogotá",
    },
    {
      key: "pub-arenero",
      proveedor: "empresa2",
      tipo: "PRODUCTO" as const,
      titulo: "Arenero para gatos",
      descripcion: "Accesorio de demostración para gatos.",
      ciudad: "Fusagasugá",
    },
    {
      key: "pub-consulta",
      proveedor: "vet1",
      tipo: "SERVICIO" as const,
      titulo: "Consulta veterinaria general",
      descripcion: "Servicio de demostración sujeto a disponibilidad.",
      ciudad: "Bogotá",
    },
    {
      key: "pub-vacunacion",
      proveedor: "vet1",
      tipo: "CAMPANA" as const,
      titulo: "Jornada de vacunación preventiva",
      descripcion: "Campaña de demostración; no representa una jornada real confirmada.",
      ciudad: "Bogotá",
    },
  ];

  for (const p of publicaciones) {
    await prisma.publicaciones.upsert({
      where: { id: id(p.key) },
      update: {},
      create: {
        id: id(p.key),
        proveedor_id: id(p.proveedor),
        tipo: p.tipo,
        titulo: p.titulo,
        descripcion: p.descripcion,
        ciudad: p.ciudad,
        activa: true,
      },
    });
  }

  await prisma.productos.upsert({
    where: { publicacion_id: id("pub-alimento") },
    update: {},
    create: {
      publicacion_id: id("pub-alimento"),
      categoria: "Alimento",
      especie_objetivo: "PERRO",
      etapa_vida: "ADULTO",
      precio: "85000.00",
      moneda: "COP",
      disponibilidad: "Dato de demostración",
    },
  });

  await prisma.productos.upsert({
    where: { publicacion_id: id("pub-arenero") },
    update: {},
    create: {
      publicacion_id: id("pub-arenero"),
      categoria: "Higiene",
      especie_objetivo: "GATO",
      etapa_vida: "NO_ESPECIFICADA",
      precio: "45000.00",
      moneda: "COP",
      disponibilidad: "Dato de demostración",
    },
  });

  await prisma.servicios.upsert({
    where: { publicacion_id: id("pub-consulta") },
    update: {},
    create: {
      publicacion_id: id("pub-consulta"),
      categoria: "Consulta veterinaria",
      especie_objetivo: null,
      modalidad: "Presencial",
      precio_desde: "60000.00",
      requisitos: "Precio y disponibilidad de demostración; confirmar con el proveedor.",
    },
  });

  await prisma.campanas.upsert({
    where: { publicacion_id: id("pub-vacunacion") },
    update: {},
    create: {
      publicacion_id: id("pub-vacunacion"),
      tipo_campana: "VACUNACION",
      fecha_inicio: fecha("2026-11-01"),
      fecha_fin: fecha("2026-11-30"),
      lugar: "Bogotá — ubicación de demostración",
      cupos_totales: 30,
      cupos_disponibles: 30,
      requisitos: "Campaña de prueba. No publicar como evento real.",
    },
  });

  // =========================================================
  // 7. HISTORIAL DE VACUNACIÓN DE DEMOSTRACIÓN
  // =========================================================
  const registros = [
    {
      key: "registro-luna-polivalente",
      mascota: "luna",
      vacuna: "vac-polivalente-perro",
      regla: "vac-polivalente-perro-PERRO",
      fecha: "2025-10-10",
      dosis: "Dosis de demostración",
      origen: "PROPIETARIO" as const,
      estado: "APLICADA_DECLARADA" as const,
    },
    {
      key: "registro-milo-triple",
      mascota: "milo",
      vacuna: "vac-triple-gato",
      regla: "vac-triple-gato-GATO",
      fecha: "2025-09-15",
      dosis: "Dosis de demostración",
      origen: "PROPIETARIO" as const,
      estado: "APLICADA_DECLARADA" as const,
    },
  ];

  for (const r of registros) {
    const propietario = mascotas.find((m) => m.key === r.mascota)!.propietario;

    await prisma.registros_vacunacion.upsert({
      where: { id: id(r.key) },
      update: {},
      create: {
        id: id(r.key),
        mascota_id: id(r.mascota),
        vacuna_id: id(r.vacuna),
        regla_vacunacion_id: id(r.regla),
        registrado_por_id: id(propietario),
        fecha_aplicacion: fecha(r.fecha),
        dosis: r.dosis,
        observaciones: "Registro ficticio para probar la interfaz. No es un antecedente clínico real.",
        origen: r.origen,
        estado: r.estado,
      },
    });
  }

  // =========================================================
  // 8. MEDICIONES DE PESO E HISTORIAL DE SALUD
  // =========================================================
  await prisma.registros_peso.upsert({
    where: { id: id("peso-luna-2026-01") },
    update: {},
    create: {
      id: id("peso-luna-2026-01"),
      mascota_id: id("luna"),
      peso_kg: "22.50",
      fecha_medicion: fecha("2026-01-10"),
    },
  });

  await prisma.historial_salud.upsert({
    where: { id: id("salud-luna-consulta") },
    update: {},
    create: {
      id: id("salud-luna-consulta"),
      mascota_id: id("luna"),
      registrado_por_id: id("dueno1"),
      fecha_evento: fecha("2026-01-10"),
      tipo_evento: "CONTROL",
      descripcion: "Evento ficticio para pruebas de historial de salud.",
      observaciones: "No corresponde a una consulta real.",
    },
  });

  // =========================================================
  // 9. PREFERENCIAS Y AUTORIZACIÓN DE DATOS
  // =========================================================
  await prisma.preferencias_usuario.upsert({
    where: { usuario_id: id("dueno1") },
    update: {},
    create: {
      id: id("preferencias-dueno1"),
      usuario_id: id("dueno1"),
      ciudad_preferida: "Bogotá",
      categorias_interes: "Veterinaria,Alimentos,Higiene",
      acepta_recomendaciones: true,
      acepta_notificaciones: true,
    },
  });

  await prisma.autorizaciones_datos.upsert({
    where: { id: id("autorizacion-dueno1") },
    update: {},
    create: {
      id: id("autorizacion-dueno1"),
      usuario_id: id("dueno1"),
      finalidad: "Registro ficticio de autorización para pruebas de desarrollo",
      vigente: true,
      version_aviso_privacidad: "DEMO-1",
    },
  });

  // =========================================================
  // 10. RECOMENDACIONES
  // =========================================================
  await prisma.recomendaciones.upsert({
    where: { id: id("recomendacion-luna-consulta") },
    update: {},
    create: {
      id: id("recomendacion-luna-consulta"),
      usuario_id: id("dueno1"),
      publicacion_id: id("pub-consulta"),
      mascota_id: id("luna"),
      preferencia_usuario_id: id("preferencias-dueno1"),
      motivo: "Recomendación de demostración para pruebas.",
      puntuacion: "90.00",
      estado: "NUEVA",
    },
  });

  // =========================================================
  // 11. RECORDATORIO Y NOTIFICACIÓN
  // =========================================================
  await prisma.recordatorios.upsert({
    where: { id: id("recordatorio-luna-control") },
    update: {},
    create: {
      id: id("recordatorio-luna-control"),
      usuario_id: id("dueno1"),
      mascota_id: id("luna"),
      titulo: "Revisar calendario de vacunación",
      descripcion: "Recordatorio de demostración; confirmar fechas con la veterinaria.",
      fecha_programada: fecha("2026-11-15"),
      tipo: "VACUNACION",
      estado: "PROGRAMADO",
    },
  });

  await prisma.notificaciones.upsert({
    where: { id: id("notificacion-luna-control") },
    update: {},
    create: {
      id: id("notificacion-luna-control"),
      recordatorio_id: id("recordatorio-luna-control"),
      mensaje: "Recuerda revisar el calendario de vacunación de Luna.",
      canal: "INTERNA",
      estado: "PENDIENTE",
    },
  });

  console.log("✅ Seed de MyPetCo completado.");
  console.log("Cuentas de prueba: consulta las credenciales indicadas al final de las instrucciones.");
}

main()
  .catch((error) => {
    console.error("❌ Error ejecutando el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
