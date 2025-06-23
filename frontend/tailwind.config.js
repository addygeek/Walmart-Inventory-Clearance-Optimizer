// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // You might need to add a 'pulse' keyframe here if it's not default in Tailwind
        // For 'pulse-slow' to work, 'pulse' keyframe should be defined if not already.
        // If not, Tailwind's default 'pulse' animation is usually available.
      },
      colors: {
        primary: { // These colors are good and will be used
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Adding a custom purple shade if it's slightly different from primary for the gradient in image
        customPurple: '#9333ea', // This looks like a good match for the image's purple
        customBlue: '#3b82f6', // Reusing primary-500, but making it explicit for the gradient
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card-glow': '0 10px 40px rgba(0,0,0,0.2)', // A softer, wider shadow for the card
        'button-glow': '0 4px 20px rgba(70, 10, 200, 0.4)', // Specific glow for the button
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-blue-100',
    'bg-red-100',
    'bg-green-100',
    'bg-orange-100',
    'bg-purple-100',
    'bg-yellow-100',
    'text-blue-600',
    'text-red-600',
    'text-green-600',
    'text-orange-600',
    'text-purple-600',
    'text-yellow-600',
  ]
}