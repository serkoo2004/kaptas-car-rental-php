declare module "iyzipay" {
  type IyzicoCallback = (error: unknown, result: Record<string, unknown>) => void;

  class Iyzipay {
    constructor(config?: { apiKey?: string; secretKey?: string; uri?: string });

    threedsInitialize: {
      create(request: Record<string, unknown>, callback: IyzicoCallback): void;
    };

    threedsPayment: {
      create(request: Record<string, unknown>, callback: IyzicoCallback): void;
    };

    static LOCALE: { TR: string };
    static CURRENCY: { TRY: string };
    static PAYMENT_GROUP: { PRODUCT: string };
    static PAYMENT_CHANNEL: { WEB: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
  }

  export = Iyzipay;
}
