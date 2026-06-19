import { migrator } from './umzug';

// CLI: tsx db/migrate.ts up | down | pending | executed
migrator.runAsCLI();
