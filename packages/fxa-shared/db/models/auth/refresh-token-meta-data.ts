export class RefreshTokenMetadata {
  public lastUsedAt: Date;

  constructor(lastUsedAt?: Date | null) {
    this.lastUsedAt = lastUsedAt || new Date();
  }

  /**
   *
   * @returns {object}
   */
  toJSON() {
    return {
      lastUsedAt: this.lastUsedAt.getTime(),
    };
  }

  /**
   *
   * @param {string} string
   * @returns {RefreshTokenMetadata}
   */
  static parse(string: string) {
    const json = JSON.parse(string);
    return new RefreshTokenMetadata(new Date(json.lastUsedAt));
  }
}
