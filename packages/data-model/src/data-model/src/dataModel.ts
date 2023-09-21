import { Poseidon, Struct, PublicKey, Group, Scalar, Provable, Field} from 'o1js';

interface EncryptedValueType {
  publicKey: Group;
  cipherText: Field[]
}

export class EncryptedValue extends Struct({
    publicKey: Group,
    cipherText: Provable.Array(Field, 255) // 255 is hardcoded for now, but we should change this to be dynamic... somehow...
  }) implements EncryptedValueType {
    constructor(publicKey: Group, cipherText: Field[]) {
  
      super({ publicKey: publicKey, cipherText: cipherText });
    }
    toJSON(encryptedValue: EncryptedValueType) {
        return {
            publicKey: Group.toJSON(encryptedValue.publicKey),
            cipherText: encryptedValue.cipherText.map((field) => field.toBigInt().toString()),
        }
    }
  fromJSON(encryptedValue: any) {
    const encryptedValueObject = JSON.parse(encryptedValue);
    const publicKey = PublicKey.fromBase58(encryptedValueObject.publicKey).toGroup();
    const cipherText = encryptedValueObject.cipherText.map((field: string) => Field.from(field));
        return { publicKey, cipherText } as EncryptedValueType;
    }
  }

/**
 * Represents an unspent transaction output (UTXO) type.
 */
export interface UTXOType {
  /** 
   * The one-time destination address, derived from the transaction secret and recipient view key. 
   */
  oneTimeAddress: PublicKey;

  /** 
   * Ephemeral public key used in the transaction. Typically denoted as R = r*G. 
   */
  ephemeralPublicKey: PublicKey;

  /** 
   * The amount of tokens in this UTXO. 
   */
  amount: Field;

  /** 
   * Token type or identifier. 
   */
  Token: Field;
}

/**
 * Represents an unspent transaction output (UTXO) in a blockchain-based system.
 * Contains cryptographic details and amount associated with the UTXO.
 */
export class UTXO extends Struct({
    oneTimeAddress: PublicKey,
    ephemeralPublicKey: PublicKey,
    amount: Field,
    Token: Field, 
  }) implements UTXOType {

    /**
     * Constructs a UTXO object.
     * @param publicSpendKey - The public spend key of the recipient.
     * @param publicViewKey - The public view key of the recipient.
     * @param amount - Amount of tokens in the UTXO.
     * @param Token - Token type or identifier.
     */
    constructor(publicSpendKey: PublicKey, publicViewKey: PublicKey, amount: Field, Token: Field) {

      // Generate a random private key for the transaction.
      const r = Provable.witness(Scalar, () => Scalar.random());
  
      // Compute the public key corresponding to r. This is R = r*G.
      const R = PublicKey.fromGroup(Group.generator.scale(r));
  
      // Compute the ephemeral key F. 
      const F = publicViewKey.toGroup().scale(r);
  
      // Calculate the shared secret ss = H(r*V) = H(v*R).
      const ss = Scalar.from(Poseidon.hash(F.toFields()).toBigInt());
  
      // Derive the one-time destination address, K.
      const K = Group.generator.scale(ss.toBigInt()).add(publicSpendKey.toGroup());
  
      super({
        oneTimeAddress: PublicKey.fromGroup(K),
        ephemeralPublicKey: R,
        amount: amount,
        Token: Token,
      });
    }

    /**
     * Convert the UTXO object into its JSON representation.
     * @param utxo - The UTXO object.
     * @returns The JSON string representation of the UTXO.
     */
    toJSON(utxo: UTXOType) {
        return {
            oneTimeAddress: PublicKey.toBase58(utxo.oneTimeAddress),
            ephemeralPublicKey: PublicKey.toBase58(utxo.ephemeralPublicKey),
            amount: utxo.amount.toBigInt().toString(),
        }
    }

    /**
     * Convert a JSON string into a UTXO object.
     * @param utxo - The JSON string representation of the UTXO.
     * @returns The UTXO object.
     */
    fromJSON(utxo: string) {
      const utxoObject = JSON.parse(utxo);
      const oneTimeAddress = PublicKey.fromBase58(utxoObject.oneTimeAddress); 
      const ephemeralPublicKey = PublicKey.fromBase58(utxoObject.ephemeralPublicKey);
      const amount = Field.from(utxoObject.amount);
      return { oneTimeAddress, ephemeralPublicKey, amount} as UTXOType;
    }
  }

/**
 * Represents the data structure of a limit order type which extends UTXO.
 */
export interface LimitOrderType extends UTXOType {
  /**
   * The quantity of tokens involved in the limit order.
   */
  quantity: Field;

  /**
   * The type or identifier of token the user wishes to swap for.
   */
  tokenSwapFor: Field;

  /**
   * The direction of the trade, either 'buy' or 'sell'.
   */
  direction: Field;
}

/**
 * Represents a limit order in a decentralized exchange.
 * Contains details about the trade and its associated UTXO.
 */
export class LimitOrder extends UTXO implements LimitOrderType {
  quantity: Field;
  tokenSwapFor: Field;
  direction: Field;

  /**
   * Constructs a LimitOrder object.
   * @param utxoData - The UTXO associated with the limit order.
   * @param quantity - Quantity of tokens involved in the order.
   * @param tokenSwapFor - Type of token to be swapped.
   * @param direction - Direction of the trade, 'buy' or 'sell'.
   */
  constructor(
      utxoData: UTXOType, 
      quantity: Field, 
      tokenSwapFor: Field, 
      direction: Field
  ) {
      super(
          utxoData.oneTimeAddress,  
          utxoData.ephemeralPublicKey,
          utxoData.amount,
          utxoData.Token
      );

      this.quantity = quantity;
      this.tokenSwapFor = tokenSwapFor;
      this.direction = direction;
  }

  /**
   * Convert the LimitOrder object into its JSON representation.
   * @returns The JSON string representation of the LimitOrder.
   */
  override toJSON(): { oneTimeAddress: string; ephemeralPublicKey: string; amount: string; quantity: string; tokenSwapFor: string; direction: Field } {
      const baseJSON = super.toJSON(this);
      return {
          ...baseJSON,
          quantity: this.quantity.toBigInt().toString(),
          tokenSwapFor: this.tokenSwapFor.toBigInt().toString(),
          direction: this.direction
      };
  }

  /**
   * Convert a JSON string into a LimitOrder object.
   * @param orderData - The JSON string representation of the LimitOrder.
   * @returns The LimitOrder object.
   */
  override fromJSON(orderData: string): LimitOrderType {
      const orderObject = JSON.parse(orderData);
      const baseUTXO = super.fromJSON(orderData);

      return {
          ...baseUTXO,
          quantity: Field.from(orderObject.quantity),
          tokenSwapFor: Field.from(orderObject.tokenSwapFor),
          direction: orderObject.direction
      };
  }
}