export class ErrCollector {
  private errors: string[] = [];

  assert(isFail: boolean, message: string) {
    if (isFail) {
      this.errors.push(message);
    }
  }

  validate() {
    if (this.errors.length > 0) {
      throw new Error(this.errors.join("\n"));
    }
  }
}
