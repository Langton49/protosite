import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import * as openai from "openai";
import { z } from "zod";
import { Agent, run } from "@openai/agents";
import type { Request, Response } from "express";
import { createBaseServer } from "../utils/backend/base_backend/create";

dotenv.config(); // Configure environment variables
/*
This schema defines the expected structure for the generated app scripts. It's a way to tell the OpenAI model the
expected data format for the app to ensure consistency and organization. Each key in the schema corresponds to an object mapping
string keys to string values.
*/
const generatedAppSchema = z.object({
  components: z.object({}).catchall(z.string()),
  styles: z.object({}).catchall(z.string()),
  pages: z.object({}).catchall(z.string()),
});

class OpenAIService {
  private openAIClient: openai.OpenAI;
  private agent: Agent<unknown, typeof generatedAppSchema>;
  private agentInstructions = `You are an assistant that analyzes website descriptions and generates
     a full Vite + React project that replicates the design exactly as it appears — not a generalized layout or template.

Your task is to inspect the provided description and output a JSON object that represents the complete React +
 Vite project.

Only return the JSON object in the following format:
{
  "components": { "<filename>.jsx": "<file_contents>" },
  "pages": { "<filename>.jsx": "<file_contents>" },
  "styles": { "<filename>.css": "<file_contents>" }
}

<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

use this index.html to import fonts to use that seem similar to the ones in the design

Key rules:
- Use React and Vite best practices.
- Assume the project uses Vite v5+ and Node.js v18+.
- Place all files inside the 'src/' directory:
  - Pages go in 'src/'
  - Components go in 'src/components/'
  - Styles go in 'src/styles/'
- Reference styles in main.jsx with ./styles
- Reference components in main.jsx with ./components
- Reference styles in components with ..styles
- Create 'main.jsx' under pages and include the root ReactDOM render logic.
- Include a global stylesheet as 'styles/index.css'.
- The project must be fully responsive and match the described layout on all screen sizes.
- Do not output guides, markdown formatting, or explanations — only return the JSON object with the exact structure above.
- Prioritize modern UI/UX best practices and visual consistency.
- Use semantic HTML where appropriate (e.g., '<section>', '<nav>', '<header>').
- Use CSS modules for maintainability (optional).
- Ensure consistent font families and sizing.
- Add hover states and transitions for interactive elements.
- Include spacing (margin, padding) that ensures visual balance.
- Use CSS Flexbox or Grid for layout instead of absolute positioning unless necessary.
- Use heading hierarchy properly (e.g., <h1> for main titles).
- There is no assets folder for images or logos, import images from well known image libraries instead.
- Add comments to the code that a beginner would understand, including where and how they can replace images and logos

You must replicate the Canva design with high visual accuracy.`;
  private completionsPrompt = `This is a complete website design from Canva that needs to be converted to a Vite + React + CSS project.

Please provide a highly detailed description of this design, focusing on:

1. Overall layout structure and sections
2. Color scheme and visual hierarchy
3. Typography (font sizes, weights, styles)
4. Component placement and spacing
5. Interactive elements (buttons, links, forms)
6. Responsive design considerations
7. Any images or icons (describe what they represent)
8. Navigation structure
9. Content organization
10. Visual styling details (borders, shadows, gradients, etc.)
11. When referencing text, quote it word for word.
 

Be very specific about measurements, colors, and positioning as this description will be used to recreate the design exactly in code.`;

  constructor() {
    this.openAIClient = new openai.OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.agent = new Agent({
      name: "viteDev",
      model: "gpt-4.1",
      instructions: this.agentInstructions,
      outputType: generatedAppSchema,
    });
  }

  private getImageMimeType = (buffer: Buffer): string => {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }

    return "image/jpeg";
  };

  getImageDesc = async (buffer: Buffer) => {
    try {
      const mimeType = this.getImageMimeType(buffer);
      const response = await this.openAIClient.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: this.completionsPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${buffer.toString("base64")}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      return response.choices[0].message.content || "No description available";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error getting image description:", error);
      throw new Error("Failed to analyze image. Try again shortly.");
    }
  };

  generateAppContent = async (desc: string) => {
    try {
      const response = await run(
        this.agent,
        `Read this description and create the Vite + React website:
            ${desc}`,
      );

      return response.finalOutput;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating app content", error);
      throw new Error("App generation failed. Try again shortly.");
    }
  };
}

class AppSchema {
  static getAppSchema() {
    /*
This JSON object defines a starting file structure for a Canva design 
converted into a Vite + React application. It includes configuration 
files like package.json, Vite config, and an HTML entry point, along 
with an initial folder structure under src/. 

The structure of this JSON object is based on the Mental Model for loading files to a StackBlitz WebContainer 
(https://webcontainers.io/guides/working-with-the-file-system) 
*/
    return {
      "package.json": {
        file: {
          contents: `{
  "name": "canva-vite-react-app",
  "version": "1.0.0",
  "description": "Your Canva Design as a Vite + React Project",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "vite preview --port 4173"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.0",
    "clsx": "^2.1.0",
    "@heroicons/react": "^2.1.0",
    "react-icons": "^4.12.0",
    "@headlessui/react": "^1.7.0"
  },
  "keywords": [
    "vite",
    "react",
    "tailwind",
    "css",
    "frontend",
    "modern"
  ],
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
`,
        },
      },

      "vite.config.js": {
        file: {
          contents:
            "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  \n  // Basic server configuration\n  server: {\n    port: 3000,\n    host: true, // Listen on all addresses\n    open: true  // Open browser on server start\n  },\n  \n  // Build configuration\n  build: {\n    outDir: 'dist',\n    sourcemap: true,\n    minify: 'esbuild'\n  },\n  \n  // Public base path\n  base: './',\n  \n  // Define global constants\n  define: {\n    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)\n  }\n})",
        },
      },

      "index.html": {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        },
      },

      src: {
        directory: {
          components: {
            directory: {},
          },
          styles: {
            directory: {},
          },
        },
      },
    };
  }
}

class ProtositeBackend {
  private app: express.Application;
  private openaiService: OpenAIService;
  private router: express.Router;
  private appStructure: AppSchema;

  constructor() {
    this.app = express();
    this.openaiService = new OpenAIService();
    this.router = express.Router();
    this.middlewareSetup();
    this.routeSetup();
    this.appStructure = AppSchema.getAppSchema();
    this.app.use("/", this.router);
  }

  private middlewareSetup() {
    this.router.use(express.text({ type: "text/plain" }));
    this.router.use(express.json({ limit: "50mb" }));
    this.router.use(
      cors({
        origin: (origin, callback) => {
          const allowedOrigins = [
            "https://localhost:5173",
            "http://localhost:5173",
            "http://localhost:3000",
            "https://www.canva.com",
            "https://canva.com",
            "https://app-aagq8negeak.canva-apps.com",
          ];

          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      }),
    );
    this.router.use((req, res, next) => {
      req.setTimeout(600000);
      res.setTimeout(600000);
      next();
    });
  }

  private routeSetup() {
    this.router.get("/", (req: Request, res: Response) => {
      res.status(200).json({
        message: "Protosite up and running!!",
        timestamp: new Date().toISOString(),
      });
    });

    this.router.post(
      "/protosite/upload",
      async (req: Request, res: Response) => {
        try {
          const imageUrl = req.body.imageUrl;
          // eslint-disable-next-line no-console
          console.log(imageUrl);
          if (!imageUrl || typeof imageUrl !== "string") {
            return res.status(400).json({
              error: "Malformed or invalid URL.",
            });
          }

          const image = await fetch(imageUrl);
          if (!image.ok) {
            return res.status(500).json({
              error: "Failed to fetch image from URL.",
            });
          }

          const buffer = Buffer.from(await image.arrayBuffer());

          if (buffer.length > 10 * 1024 * 1024) {
            return res.status(400).json({
              error: "File too large. Max. size is 10MB",
            });
          }

          const description = await this.openaiService.getImageDesc(buffer);
          const appFiles =
            await this.openaiService.generateAppContent(description);
          const projectStructure = this.buildAppHierarchy(appFiles);
          this.appStructure = projectStructure;

          // await this.sendToProtositeHost(projectStructure);

          res.json({
            success: true,
            message: "File processed successfully",
            project: projectStructure,
          });

          // eslint-disable-next-line no-console
          console.log("Success");
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error uploading image", error);
          throw new Error("Image upload failed. Try again shortly.");
        }
      },
    );

    this.router.get("/protosite/project", (req: Request, res: Response) => {
      return res.json({ app: this.appStructure });
    });
  }

  private buildAppHierarchy(appFiles) {
    const appSchema = AppSchema.getAppSchema();

    if (appFiles?.components) {
      for (const [file, code] of Object.entries(appFiles.components)) {
        appSchema.src.directory.components.directory[file] = {
          file: {
            contents: code,
          },
        };
      }
    }

    if (appFiles?.styles) {
      for (const [file, code] of Object.entries(appFiles.styles)) {
        appSchema.src.directory.styles.directory[file] = {
          file: {
            contents: code,
          },
        };
      }
    }

    if (appFiles?.pages) {
      for (const [file, code] of Object.entries(appFiles.pages)) {
        appSchema.src.directory[file] = {
          file: {
            contents: code,
          },
        };
      }
    }

    return appSchema;
  }

  private sendToProtositeHost = async (projectFiles: AppSchema) => {
    try {
      await fetch("https://localhost:5173/preview/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: projectFiles,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to send to external host:", error);
      throw new Error("Preview setup failed. Try again shortly.");
    }
  };

  start(port = 3000) {
    const server = createBaseServer(this.router);
    server.start(port);
    // eslint-disable-next-line no-console
    console.log(`Canva export backend running on port ${port}`);
  }
}

const main = async () => {
  try {
    const backend = new ProtositeBackend();
    const PORT = parseInt(process.env.CANVA_BACKEND_PORT || "3000", 10);
    backend.start(PORT);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
};

main();
