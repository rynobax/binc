module.exports = {
  apps: [
    {
      name: "client",
      cwd: "../client/",
      script: "yarn prod",
    },
    {
      name: "server",
      cwd: "../server/",
      script: "bun prod",
    },
  ],
};
