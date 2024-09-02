import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    siteUrl: `https://img-sm.isirmt.com`,
  },
  // More easily incorporate content into your pages through automatic TypeScript type generation and better GraphQL IntelliSense.
  // If you use VSCode you can also use the GraphQL plugin
  // Learn more at: https://gatsby.dev/graphql-typegen
  graphqlTypegen: true,
  plugins: [
    'gatsby-plugin-postcss',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: "画像の縮小化",
        short_name: "画像縮小",
        start_url: "/",
        background_color: "#f87171",
        theme_color: "#f87171",
        display: "standalone",
        icon: "src/images/back.png",
        crossOrigin: `use-credentials`,
      },
    }
  ],
}

export default config
