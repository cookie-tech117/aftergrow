import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        ...(githubPagesBasePath
          ? {
              basePath: githubPagesBasePath,
              assetPrefix: `${githubPagesBasePath}/`,
            }
          : {}),
        trailingSlash: false,
      }
    : {}),
};

export default nextConfig;
