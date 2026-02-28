import { Logger } from "@src/tools/Logger";

export class CacheService {
    private readonly items = new Map<string, any>();
    private readonly logger: Logger;

    public constructor(
        logger: Logger
    ) {
        this.logger = logger.create(logger);
    }

    public clear(): void {
        this.logger.trace("Clearing...");
        this.items.clear();
    }

    public set<T>(key: string, value: T): void {
        this.logger.trace(`Set cache item for ${key}`);
        this.items.set(key, value);
    }

    public async get<T>(key: string, factory: () => Promise<T>): Promise<T> {
        if (!this.items.has(key)) {
            this.logger.trace(`Cache miss for ${key}. Loading...`);

            this.items.set(key, await factory());
        }

        return this.items.get(key);
    }

    public invalidate(key: string): void {
        this.logger.trace(`Invalidate item for ${key}`);
        this.items.delete(key);
    }
}