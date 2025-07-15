/**
 * Handles the exit command, gracefully shutting down the app.
 */
export const cmdExit = () => {
  console.log('👋 Goodbye!');
  process.exit(0);
};
