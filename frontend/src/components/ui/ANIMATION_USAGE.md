# Guía de Uso - Componentes de Animación

## AnimatedSection

Componente wrapper reutilizable para agregar animaciones de scroll a cualquier sección.

### Props

- `children`: Contenido a animar
- `className`: Clases CSS adicionales (opcional)
- `animation`: Tipo de animación (opcional, default: 'fadeInUp')
  - `'fadeInUp'` - Aparece desde abajo con fade
  - `'fadeIn'` - Solo fade, sin movimiento
  - `'slideInLeft'` - Desliza desde la izquierda
  - `'slideInRight'` - Desliza desde la derecha
  - `'scaleIn'` - Escala desde 0.8 a 1
  - `'none'` - Sin animación
- `delay`: Retraso en segundos (opcional, default: 0)
- `duration`: Duración en segundos (opcional, default: 0.8)
- `viewport`: Configuración de viewport (opcional)
  - `once`: boolean - Animar solo una vez (default: true)
  - `amount`: number - Porcentaje visible para trigger (default: 0.3)
  - `margin`: string - Margen del viewport (default: undefined)

### Ejemplos de Uso

```tsx
import { AnimatedSection } from '@/components/ui/AnimatedSection';

// Básico - Fade in up cuando entra en viewport
<AnimatedSection>
  <h2>Este título aparece al hacer scroll</h2>
</AnimatedSection>

// Con animación específica
<AnimatedSection animation="slideInLeft">
  <div>Desliza desde la izquierda</div>
</AnimatedSection>

// Con delay para efecto secuencial
<AnimatedSection animation="fadeInUp" delay={0.2}>
  <p>Aparece 200ms después</p>
</AnimatedSection>

// Con duración personalizada
<AnimatedSection animation="scaleIn" duration={1.2}>
  <img src="logo.png" alt="Logo" />
</AnimatedSection>

// Con viewport personalizado (trigger cuando 50% visible)
<AnimatedSection
  animation="fadeIn"
  viewport={{ once: true, amount: 0.5 }}
>
  <div>Necesita 50% visible</div>
</AnimatedSection>

// Para stagger effect (múltiples cards)
<div className="grid grid-cols-3 gap-8">
  <AnimatedSection delay={0}>
    <Card>Card 1</Card>
  </AnimatedSection>
  <AnimatedSection delay={0.2}>
    <Card>Card 2</Card>
  </AnimatedSection>
  <AnimatedSection delay={0.4}>
    <Card>Card 3</Card>
  </AnimatedSection>
</div>
```

---

## ScrollProgressBar

Barra de progreso que se llena conforme haces scroll en la página.

### Props

- `className`: Clases CSS adicionales (opcional)
- `color`: Color de la barra (opcional, default: 'bg-coral-600')
- `height`: Altura de la barra (opcional, default: 'h-1')
- `position`: Posición de la barra (opcional, default: 'top')
  - `'top'` - Barra en la parte superior
  - `'bottom'` - Barra en la parte inferior

### Ejemplos de Uso

```tsx
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar';

// Básico - Barra coral en el top
<ScrollProgressBar />

// Con color personalizado
<ScrollProgressBar color="bg-tierra-600" />

// Con altura mayor
<ScrollProgressBar height="h-2" />

// En la parte inferior
<ScrollProgressBar position="bottom" />

// Personalizado completamente
<ScrollProgressBar
  color="bg-gradient-to-r from-coral-600 to-arena-600"
  height="h-1.5"
  position="top"
  className="shadow-lg"
/>
```

---

## lib/motion.ts - Variantes Preconfiguradas

Puedes usar directamente las variantes desde `lib/motion.ts` con componentes `motion.*`:

### Para Scroll Animations

```tsx
import { motion } from 'motion/react';
import { scrollFadeInUp, scrollStaggerContainer, scrollStaggerItem } from '@/lib/motion';

// Fade in up al hacer scroll
<motion.div {...scrollFadeInUp}>
  <h2>Título</h2>
</motion.div>

// Stagger effect (cards aparecen una por una)
<motion.div {...scrollStaggerContainer}>
  <motion.div {...scrollStaggerItem}>Card 1</motion.div>
  <motion.div {...scrollStaggerItem}>Card 2</motion.div>
  <motion.div {...scrollStaggerItem}>Card 3</motion.div>
</motion.div>
```

### Para Hero Section

```tsx
import { motion } from 'motion/react';
import { heroTitle, heroSubtitle, heroCTA, heroLogo } from '@/lib/motion';

<motion.img {...heroLogo} src="/logo.png" />
<motion.h1 {...heroTitle}>Título Principal</motion.h1>
<motion.p {...heroSubtitle}>Subtítulo</motion.p>
<motion.div {...heroCTA}>
  <Button>Call to Action</Button>
</motion.div>
```

### Hover Effects

```tsx
import { motion } from 'motion/react';
import { cardHoverLift } from '@/lib/motion';

<motion.div whileHover={cardHoverLift.hover}>
  <Card>Esta card se levanta al hacer hover</Card>
</motion.div>
```

---

## Mejores Prácticas

1. **Usar `AnimatedSection` para simplicidad**: Es más fácil y mantenible
2. **`viewport.once: true`**: Evita re-animaciones al hacer scroll arriba/abajo
3. **`amount: 0.3`**: 30% visible es un buen balance (no muy temprano, no muy tarde)
4. **Delays secuenciales**: Usa delays incrementales (0, 0.2, 0.4) para stagger manual
5. **Duraciones estándar**: 0.6-0.8s es suave y no muy lento
6. **No abusar**: Anima solo elementos importantes (títulos, cards, CTAs)

---

## Performance

Todos los componentes están optimizados:
- ✅ Usan `will-change` automáticamente
- ✅ `viewport.once: true` evita re-renders
- ✅ Animaciones GPU-accelerated (transform, opacity)
- ✅ No bloquean el thread principal
