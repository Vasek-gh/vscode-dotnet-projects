export class PackageInfo {
    public constructor(
        public readonly name: string,
        public readonly currentVersion: string,
        public readonly newVersion: string,
    ) {
    }
}