<div align="center">
  <h1>✨ Virsa.ai</h1>
  <p><b>Transforming Photos into Cultural Masterpieces with Art & AI</b></p>
</div>

## 📖 About The Project

**Virsa.ai** is an interactive web application designed to celebrate and preserve Pakistani cultural heritage through the lens of artificial intelligence. By leveraging Google's Gemini multimodal AI models, the app allows users to upload any photo and magically remix it into traditional aesthetic styles. It also acts as an AI-powered Cultural Historian, analyzing images to provide deep, factual narratives about traditional crafts and architecture.

### ✨ Key Features

- **🎨 Cultural Image Remixing:** Uses `gemini-2.5-flash-image` to style-transfer user photos into four iconic aesthetics:
  - 🛺 **Heritage Truck Art**: Vibrant neon colors, heavy outlines, and maximalist floral motifs.
  - 🕌 **Mughal Heritage**: Majestic symmetries, gold and ivory palettes, and grand architectural elements.
  - 💠 **Multani Blue**: Crisp cobalt and turquoise patterns mapping the glazed textures of Multani pottery.
  - 🧵 **Phulkari**: Dense, geometric floral embroidery in bringing Punjabi folk styles to life.
- **📜 Artifact Storytelling:** Powered by `gemini-3.1-flash-lite`, the app generates factual, historical, and data-driven narratives about the cultural elements in the uploaded photo (Origins, Symbolism, Technical Signatures).
- **🔎 Interactive Comparison:** Includes a dynamic before-and-after image slider to view the transformation seamlessly.
- **⚡ Modern UI/UX:** A highly responsive, neo-bento grid design built with Framer Motion, offering smooth animations and glowing neon aesthetics.

## 🛠️ Built With

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [Google Gen AI SDK](https://www.npmjs.com/package/@google/genai) (`@google/genai`) 

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or yarn
* A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/virsa-ai.git
   cd virsa-ai