export class SlnFormat {
    public static readonly sln = new SlnFormat("sln", ".sln");
    public static readonly slnx = new SlnFormat("slnx", ".slnx");

    public constructor(
        public readonly title: string,
        public readonly extension: string,
    ) {

    }
}