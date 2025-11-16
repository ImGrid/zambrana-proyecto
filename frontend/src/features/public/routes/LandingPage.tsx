import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ScrollProgressBar } from "@/components/ui/ScrollProgressBar";
import {
  heroTitle,
  heroSubtitle,
  heroCTA,
  scrollIndicator,
} from "@/lib/motion";

export function LandingPage() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -50]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0]);

  return (
    <div className="flex flex-col">
      {/* Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Hero Section */}
      <section className="relative w-full h-[calc(100vh+5rem)] overflow-hidden -mt-20">
        {/* Background con Parallax */}
        <motion.div
          className="absolute inset-0 -top-12 -bottom-12 z-0"
          style={{ y }}
        >
          <img
            src="/img1.webp"
            alt=""
            className="w-full h-[calc(100vh+11rem)] object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-cemento-900/95 via-cemento-900/80 to-tierra-800/70" />
        </motion.div>

        {/* Contenido del Hero */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pt-20"
          style={{ opacity }}
        >
          {/* Título */}
          <motion.h1
            {...heroTitle}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 max-w-5xl"
          >
            Materiales de Construcción
            <span className="block text-coral-500 mt-2">
              Con Tracking GPS en Tiempo Real
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            {...heroSubtitle}
            className="text-lg sm:text-xl md:text-2xl text-arena-100 mb-6 sm:mb-8 max-w-3xl leading-relaxed"
          >
            Arena, grava, piedra y más en Cochabamba. Seguimiento en vivo de
            todas tus entregas.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...heroCTA}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 bg-coral-600 hover:bg-coral-700"
              >
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link to="/cliente/catalogo" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 bg-white/10 hover:bg-white/20 backdrop-blur border-white/30 text-white hover:text-white"
              >
                Ver Catálogo
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Título de Services Section */}
      <section
        id="servicios"
        className="relative z-10 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 bg-arena-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fadeInUp" className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cemento-900 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-lg sm:text-xl text-cemento-600 max-w-2xl mx-auto">
              Tecnología y experiencia al servicio de tu construcción
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* SERVICE 1: Entrega Rápida (Imagen IZQ + Texto DER) */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 bg-arena-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Imagen */}
            <AnimatedSection
              animation="slideInLeft"
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                <img
                  src="/img4.webp"
                  alt="Camiones de entrega en ruta"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cemento-900/40 to-transparent" />
              </div>
            </AnimatedSection>

            {/* Texto */}
            <AnimatedSection
              animation="slideInRight"
              className="order-1 lg:order-2"
            >
              <div className="lg:pl-8">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cemento-900 mb-6">
                  Entrega Rápida y Confiable
                </h3>
                <p className="text-lg text-cemento-600 mb-6 leading-relaxed">
                  Entregas el mismo día dentro de la ciudad de Cochabamba.
                  Nuestra flota de camiones modernos garantiza que tus
                  materiales lleguen a tiempo, todos los días.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-coral-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Entregas en menos de 4 horas
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-coral-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Flota de +3 camiones disponibles
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-coral-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Cobertura en toda la ciudad
                    </span>
                  </li>
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* SERVICE 2: Tracking GPS (Texto IZQ + Imagen DER) */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 bg-arena-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Texto */}
            <AnimatedSection animation="slideInLeft">
              <div className="lg:pr-8">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cemento-900 mb-6">
                  Tracking GPS en Tiempo Real
                </h3>
                <p className="text-lg text-cemento-600 mb-6 leading-relaxed">
                  Rastrea tu pedido en tiempo real desde tu celular o
                  computadora. Siempre sabrás dónde está tu material y cuándo
                  llegará exactamente.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-info-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Ubicación en vivo del camión
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-info-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Notificaciones en cada etapa
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-info-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Historial completo de entregas
                    </span>
                  </li>
                </ul>
              </div>
            </AnimatedSection>

            {/* Imagen */}
            <AnimatedSection animation="slideInRight">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                <img
                  src="/img6.webp"
                  alt="Tracking GPS en celular"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <p className="text-sm font-semibold text-cemento-900">
                    GPS Tracking
                  </p>
                  <p className="text-xs text-success-600 flex items-center">
                    <span className="w-2 h-2 bg-success-600 rounded-full mr-1.5 animate-pulse"></span>
                    En vivo
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* SERVICE 3: Calidad Garantizada (Imagen IZQ + Texto DER) */}
      <section className="relative z-10 py-12 sm:py-16 lg:py-20 bg-arena-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Imagen */}
            <AnimatedSection
              animation="slideInLeft"
              className="order-2 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                <img
                  src="/img5.webp"
                  alt="Maquinaria pesada de calidad"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cemento-900/40 to-transparent" />
              </div>
            </AnimatedSection>

            {/* Texto */}
            <AnimatedSection
              animation="slideInRight"
              className="order-1 lg:order-2"
            >
              <div className="lg:pl-8">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cemento-900 mb-6">
                  Calidad Garantizada
                </h3>
                <p className="text-lg text-cemento-600 mb-6 leading-relaxed">
                  Materiales de primera calidad directamente de las mejores
                  canteras. Garantía de satisfacción en cada entrega
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Certificados de calidad
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      15+ años de experiencia
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-success-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      500+ clientes satisfechos
                    </span>
                  </li>
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section - Split Layout */}
      <section className="relative z-10 py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-coral-50 via-white to-arena-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
            {/* Texto Izquierda */}
            <AnimatedSection animation="slideInLeft">
              <div className="lg:pr-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-cemento-900 mb-4 sm:mb-6">
                  ¿Listo para tu próximo proyecto?
                </h2>
                <p className="text-lg sm:text-xl text-cemento-600 mb-6 sm:mb-8 leading-relaxed">
                  Únete las constructoras que confían en nosotros. Entregas
                  rápidas, tracking GPS y calidad garantizada.
                </p>

                {/* Lista de beneficios */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-coral-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Cuenta gratis sin pagar nada
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-coral-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Empieza a pedir en menos de 2 minutos
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-coral-600 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-cemento-600">
                      Tracking GPS incluido en todos los pedidos
                    </span>
                  </li>
                </ul>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg px-8 h-14 bg-coral-600 hover:bg-coral-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Crear mi cuenta gratis
                    </Button>
                  </Link>
                  <Link to="/cliente/catalogo" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto text-lg px-8 h-14 border-2 border-cemento-300 hover:border-coral-600 hover:bg-coral-50 transition-all duration-300"
                    >
                      Ver catálogo
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>

            {/* Imagen Derecha */}
            <AnimatedSection
              animation="slideInRight"
              className="order-first lg:order-last"
            >
              <div className="relative">
                <img
                  src="/img2.webp"
                  alt="Profesional satisfecha"
                  className="w-full h-[400px] sm:h-[500px] lg:h-[550px] object-cover"
                  style={{ objectPosition: "center 20%" }}
                />
                {/* Fade out gradient en la parte inferior */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
