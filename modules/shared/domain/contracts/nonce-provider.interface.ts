export interface INonceProvider {
  getNonce(): Promise<string>;
}
