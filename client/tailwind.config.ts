// import type { Config } from "tailwindcss";
// import { fontFamily } from "tailwindcss/defaultTheme";

// const config = {
//   darkMode: ["class"],
//   content: [
//     "./pages/**/*.{ts,tsx}",
//     "./components/**/*.{ts,tsx}",
//     "./app/**/*.{ts,tsx}",
//     "./src/**/*.{ts,tsx}",
//   ],
//   prefix: "",
//   theme: {
//     container: {
//       center: true,
//       padding: "2rem",
//       screens: {
//         "2xl": "1400px",
//         smd: "1000px",
//         "2smd": "1600px",
//         "3xl": "2000px",
//         "4xl": "2560px",
//         "5xl": "3840px",
//       },
//     },
//     extend: {
//       colors: {
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: "0" },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: "0" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//       },
//       fontFamily: {
//         poppins: "var(--font-poppins)",
//         vivaldi: "var(--font-vivaldi)",
//         prata: "var(--font-prata)",
//         mysi: "var(--font-msyi)",
//         adornstoryserif: "var(--font-adornstoryserif)",
//       },
//       screens: {
//         smd: "1000px",
//         "2smd": "1600px",
//         "3xl": "2000px",
//         "4xl": "2800px",
//         "5xl": "3200px",
//       },
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// } satisfies Config;

// export default config;
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
        smd: "1000px",
        "2smd": "1600px",
        "3xl": "2000px",
        "4xl": "2560px",
        "5xl": "3840px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Luxury brand colors
        luxury: {
          primary: '#876355',
          secondary: '#1a0f0b',
          accent: '#C9A39A',
          gold: '#d4af37'
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Luxury animation keyframes
        "fade-in-up": {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        "fade-in-down": {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        "fade-in-left": {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        "fade-in-right": {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        "scale-in": {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        "slide-in-left": {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        "slide-in-right": {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        "text-reveal": {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        "float": {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        "scroll-line": {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0' },
          '50%': { transform: 'translateY(30px)', opacity: '1' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Luxury animations
        "fade-in-up": "fadeInUp 0.8s ease-out",
        "fade-in-down": "fadeInDown 0.8s ease-out",
        "fade-in-left": "fadeInLeft 0.8s ease-out",
        "fade-in-right": "fadeInRight 0.8s ease-out",
        "scale-in": "scaleIn 0.8s ease-out",
        "slide-in-left": "slideInLeft 1s ease-out",
        "slide-in-right": "slideInRight 1s ease-out",
        "text-reveal": "textReveal 1.5s ease-out forwards",
        "float-slow": "float 6s ease-in-out infinite",
        "float-medium": "float 4s ease-in-out infinite",
        "float-fast": "float 3s ease-in-out infinite",
        "scroll-line": "scrollLine 2s ease-in-out infinite",
      },
      fontFamily: {
        poppins: "var(--font-poppins)",
        vivaldi: "var(--font-vivaldi)",
        prata: "var(--font-prata)",
        mysi: "var(--font-msyi)",
        adornstoryserif: "var(--font-adornstoryserif)",
         brandon: ["Brandon Grotesque", "sans-serif"],
        // Luxury fonts
        adorned: ['Playfair Display', 'Georgia', 'serif'],
        elegant: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      screens: {
        smd: "1000px",
        "2smd": "1600px",
        "3xl": "2000px",
        "4xl": "2800px",
        "5xl": "3200px",
      },
      // Luxury background images
      backgroundImage: {
        'gradient-luxury': 'linear-gradient(135deg, #000000 0%, #1a0f0b 50%, #000000 100%)',
        'gradient-primary': 'linear-gradient(135deg, #876355, #a57f72)',
        'gradient-underline': 'linear-gradient(90deg, transparent, #876355, transparent)',
        'pattern-bg': 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(135, 99, 85, 0.03) 10px, rgba(135, 99, 85, 0.03) 20px)',
        'video-overlay': 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.2) 100%)',
        'image-overlay': 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
        'section-transition': 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.03), transparent)',
      },
      // Luxury backdrop blur
      backdropBlur: {
        'xs': '2px',
      },
      // Luxury spacing
      spacing: {
        '15': '3.75rem',
        '128': '32rem',
      },
      // Luxury max width
      maxWidth: {
        '8xl': '88rem',
      },
      // Luxury z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Luxury blur
      blur: {
        'xs': '2px',
      },
      // Luxury transition timing
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      // Luxury transition duration
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add any additional plugins for luxury animations if needed
  ],
} satisfies Config;

export default config;