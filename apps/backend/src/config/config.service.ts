import { Injectable, Logger } from "@nestjs/common";
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
    domain: "localhost:3002",
    admin: { username: "admin", password: "changeme123" },
    accounts: [],
  };
  private logger = new Logger(ConfigService.name);

  constructor() {
    // Debug: log env vars
    console.log("[CONFIG] process.env.FEDIVERSE_DOMAIN =", process.env.FEDIVERSE_DOMAIN);
    this.loadConfig();
  }

  private loadConfig(): void {
    const configPath = path.join(process.cwd(), "config.json");

    try {
      if (!fs.existsSync(configPath)) {
        this.logger.warn(`Config file not found at ${configPath}`);
        this.config = {
          domain: "localhost:3002",
          admin: { username: "admin", password: "changeme123" },
          accounts: [],
        };
      } else {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        this.config = JSON.parse(fileContent);
        this.logger.log(`✅ Config loaded from ${configPath}`);
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

    // Allow override via environment variable
    if (process.env.FEDIVERSE_DOMAIN) {
      this.config.domain = process.env.FEDIVERSE_DOMAIN;
      this.logger.log(
        `✅ Domain overridden from FEDIVERSE_DOMAIN env var: ${this.config.domain}`,
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
}
