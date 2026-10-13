import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isGithubPages ? "/maqe" : "/maqe");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  }
};

export default nextConfig;
