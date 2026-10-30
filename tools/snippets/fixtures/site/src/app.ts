export function listen(port: number) {
  // region setup
  const server = createServer();
  server.listen(port);
  console.log(`Listening on ${port}`);
  // endregion
  return server;
}
