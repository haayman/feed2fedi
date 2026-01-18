import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";

interface AdminConfig {
  username: string;
  password: string;
}

interface AccountConfig {
  name: string;
  displayName: string;
  summary?: string;
  feedUrl: string;
}

interface AppConfig {
  domain: string;
  admin: AdminConfig;
  accounts: AccountConfig[];
}

@Injectable()
export class ConfigService {
  private config: AppConfig = {
    domain: process.env.FEDIVERSE_DOMAIN || "localhost:3002",
    admin: { username: "admin", password: "changeme123" },
    accounts: [],
  };
  private logger = new Logger(ConfigService.name);
  private configPath: string;
  private eventEmitter = new EventEmitter();

  constructor() {
    // Debug: log env vars
    console.log(
      "[CONFIG] process.env.FEDIVERSE_DOMAIN =",
      process.env.FEDIVERSE_DOMAIN,
    );
    this.configPath = path.join(process.cwd(), "config.json");
    this.loadConfig();
    this.setupFileWatcher();
  }

  private loadConfig(): void {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.logger.warn(`Config file not found at ${this.configPath}`);
        this.config = {
          domain: process.env.FEDIVERSE_DOMAIN || "localhost:3002",
          admin: { username: "admin", password: "changeme123" },
          accounts: [],
        };
      } else {
        const fileContent = fs.readFileSync(this.configPath, "utf-8");
        const loadedConfig = JSON.parse(fileContent);
        // Keep domain from env, ignore any domain in config file
        this.config = {
          domain:
            process.env.FEDIVERSE_DOMAIN ||
            loadedConfig.domain ||
            "localhost:3002",
          admin: loadedConfig.admin || {
            username: "admin",
            password: "changeme123",
          },
          accounts: loadedConfig.accounts || [],
        };
        this.logger.log(`✅ Config loaded from ${this.configPath}`);
        this.logger.log(
          `📊 Found ${this.config.accounts.length} accounts to configure`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to load config: ${errorMessage}`);
      throw error;
    }

    // Log the final domain being used
    this.logger.log(`🌐 Using domain: ${this.config.domain}`);
  }

  private setupFileWatcher(): void {
    try {
      fs.watchFile(this.configPath, { interval: 1000 }, () => {
        this.logger.debug(`[WATCH] config.json changed, reloading...`);
        try {
          const fileContent = fs.readFileSync(this.configPath, "utf-8");
          const newConfig = JSON.parse(fileContent);

          // Check for new accounts before updating config
          const oldAccountNames = new Set(
            this.config.accounts.map((a: AccountConfig) => a.name),
          );
          const newAccountNames = new Set(
            newConfig.accounts.map((a: AccountConfig) => a.name),
          );
          const newAccounts = newConfig.accounts.filter(
            (a: AccountConfig) => !oldAccountNames.has(a.name),
          );

          this.config = newConfig;
          this.logger.log(`✅ Config reloaded from ${this.configPath}`);
          this.logger.log(
            `📊 Found ${this.config.accounts.length} accounts to configure`,
          );

          // Emit event if new accounts were added
          if (newAccounts.length > 0) {
            this.logger.log(`🆕 Detected ${newAccounts.length} new account(s)`);
            this.eventEmitter.emit("config.accounts-added", newAccounts);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `⚠️  Failed to reload config (keeping previous): ${errorMessage}`,
          );
          // Keep previous config, don't throw
        }
      });
      this.logger.debug(`[WATCH] Watching for changes in ${this.configPath}`);
    } catch (error) {
      this.logger.warn(
        `Failed to setup file watcher: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getDomain(): string {
    return this.config.domain;
  }

  getAdminUsername(): string {
    return this.config.admin.username;
  }

  getAdminPassword(): string {
    return this.config.admin.password;
  }

  getAccounts(): AccountConfig[] {
    return this.config.accounts;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getEventEmitter(): any {
    return this.eventEmitter;
  }
}
