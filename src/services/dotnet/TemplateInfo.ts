export class TemplateInfo {
    public constructor(
        public readonly fullName: string,
        public readonly shortName: string,
        public readonly language: string,
    ) {
    }

    public isSame(other: TemplateInfo | undefined): boolean {
        return other !== undefined
            && this.fullName === other.fullName
            && this.shortName === other.shortName
            && this.language === other.language;
    }
}