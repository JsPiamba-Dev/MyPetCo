import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8faf8] text-slate-900">
      {/* Navegación */}
      <header className="border-b border-slate-100 bg-white/90">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
              <PawPrint size={25} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              MyPetCo
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-[#173d32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 sm:px-5"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </header>

      {/* Presentación principal */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
              <Heart size={16} />
              Más amor, mejor cuidado
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Ellos hacen tu vida especial.
              <span className="mt-2 block text-emerald-800">
                Cuida cada momento de la suya.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Organiza la información de tus mascotas, lleva un
              seguimiento de sus cuidados y ten sus datos importantes
              siempre a mano con MyPetCo.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173d32] px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-900"
              >
                Comenzar gratis
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Ya tengo una cuenta
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-700" />
                Tu espacio personal
              </span>
              <span className="flex items-center gap-2">
                <Heart size={17} className="text-emerald-700" />
                Cuidado organizado
              </span>
            </div>
          </div>

          {/* Ilustración decorativa hecha con iconos */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-4 top-10 h-32 w-32 rounded-full bg-emerald-100/80 blur-2xl" />
            <div className="absolute -right-3 bottom-8 h-40 w-40 rounded-full bg-amber-100/80 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-emerald-950/10 sm:p-8">
              <div className="rounded-[1.5rem] bg-[#edf5ee] p-6 sm:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-800">
                      UN HOGAR MÁS FELIZ
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Su bienestar importa
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                    <PawPrint size={27} />
                  </div>
                </div>

                <div className="my-8 flex items-center justify-center gap-5">
                  <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-[#d7e9d9] text-emerald-900 sm:h-40 sm:w-40">
                    <PawPrint size={82} strokeWidth={1.4} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                      <Heart size={24} />
                    </span>
                    <span className="rounded-2xl bg-white p-3 text-emerald-800 shadow-sm">
                      <Sparkles size={24} />
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                    <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                      <CalendarDays size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        Cuidados organizados
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Ten a mano sus datos importantes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                    <span className="rounded-lg bg-rose-50 p-2 text-rose-700">
                      <Heart size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        Más tiempo para quererlos
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Dedícate a lo que más importa
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:-left-7">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <Heart size={21} />
              </div>
              <div>
                <p className="text-sm font-bold">Amor en cada detalle</p>
                <p className="mt-1 text-xs text-slate-500">
                  Todos los días cuentan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
              TODO EN UN SOLO LUGAR
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Cuidarlos puede ser más sencillo
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              Una forma práctica de mantener organizada la información
              de los integrantes más peludos de tu familia.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex rounded-xl bg-emerald-100 p-3 text-emerald-800">
                <PawPrint size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                Sus perfiles
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Registra sus nombres, especie y otros datos importantes
                para tenerlos siempre disponibles.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex rounded-xl bg-amber-100 p-3 text-amber-800">
                <CalendarDays size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                Organización diaria
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ten un espacio pensado para ayudarte a organizar sus
                rutinas y necesidades de cuidado.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex rounded-xl bg-rose-100 p-3 text-rose-800">
                <Heart size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                Bienestar con cariño
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Reúne su información para acompañarlos mejor en cada
                etapa de su vida.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Llamado a la acción */}
      <section className="bg-[#173d32] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <PawPrint size={36} className="text-emerald-300" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Su historia merece un espacio especial.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/75">
            Crea tu cuenta y empieza a organizar el cuidado de quienes
            llenan tus días de alegría.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 font-semibold text-[#173d32] transition hover:bg-emerald-50"
          >
            Crear mi cuenta
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Pie de página */}
      <footer className="bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-800">
            <PawPrint size={19} className="text-emerald-800" />
            MyPetCo
          </Link>
          <p>
            Cuidamos a quienes hacen especial tu vida.
          </p>
        </div>
      </footer>
    </main>
  );
}
