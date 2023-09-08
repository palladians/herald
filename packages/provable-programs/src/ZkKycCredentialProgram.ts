import { Experimental, Bool, PublicKey, Struct, Signature, Scalar, Provable, Poseidon, Group, Encoding, PrivateKey } from 'snarkyjs';

export type KeyPair = { privateKey: PrivateKey, publicKey: PublicKey };

export type KeyPairs = {
  s: string,
  S: string,
  v: string,
  V: string
}

export function deriveKeyPairs(privateKey: string): KeyPairs {
  const privSpendKeyBase58 = privateKey;
  // Derive the private view key from the private spend key using Poseidon hash.
  const privViewKey = PrivateKey.fromBigInt(Poseidon.hash(PrivateKey.fromBase58(privSpendKeyBase58).toFields()).toBigInt());
  // Convert the private view key to its corresponding public view key.
  const pubViewKey = privViewKey.toPublicKey();
  // Derive the public spend key from the private spend key.
  const pubSpendKey = PrivateKey.fromBase58(privSpendKeyBase58).toPublicKey();
  return {
      s: privSpendKeyBase58,
      S: pubSpendKey.toBase58(),
      v: privViewKey.toBase58(),
      V: pubViewKey.toBase58()
  }
}

export class StealthAddress extends Struct({
  oneTimeAddress: PublicKey,
  txPublicKey: PublicKey
}) {
  constructor(publicSpendKey: PublicKey, publicViewKey: PublicKey) {
    // Generate a random private key for the transaction.
    const r = Provable.witness(Scalar, () => Scalar.random());

     // Compute the public key corresponding to r. This is R = r*G.
     const R = PublicKey.fromGroup(Group.generator.scale(r));

     // Compute the ephemeral key F. 
     // Sender computes using r and recipient's public view key.
     // Recipient computes using their private view key and R.
    const F = publicViewKey.toGroup().scale(r)

    // Calculate the shared secret ss = H(r*V) = H(v*R).
    // Both sender and recipient should arrive at the same ss.
    const ss = Poseidon.hash(F.toFields());

    // Derive the one-time destination address, K.
    // Sender derives using their public spend key and the shared secret.
    const K = Group.generator.scale(ss.toBigInt()).add(publicSpendKey.toGroup());


    super({ oneTimeAddress: PublicKey.fromGroup(K), txPublicKey: R });
  }
  static generateKeyPair(seed: string, type: 'spend' | 'view'): KeyPair {
    // Derive keys from the provided seed and type.
    const derivedSeed = Poseidon.hash(Encoding.stringToFields(seed + type));
    const privKey = PrivateKey.fromBigInt(derivedSeed.toBigInt());

    // Generate the corresponding public key: pubKey = privKey * G.
    const pubKey = Group.generator.scale(privKey.toBigInt());

    return { privateKey: privKey, publicKey: PublicKey.fromGroup(pubKey) };
  }
}

export class ZkKycClaimInputs extends Struct({
  issuerPubKey: PublicKey,
  subjectStealthAddress: StealthAddress,
  kycPassed: Bool,
  issuerSignature: Signature
}) {
  constructor(issuerPubKey: PublicKey, subjectStealthAddress: StealthAddress, kycPassed: Bool, issuerSignature: Signature) {
      super({ issuerPubKey, subjectStealthAddress, kycPassed, issuerSignature });
  }
}

/**
 *
 */
export const ZkKycClaimProgram = Experimental.ZkProgram({
  publicInput: ZkKycClaimInputs,
  publicOutput: PublicKey,

  methods: {
    createZkKycClaimProof: {
      privateInputs: [],
      method(publicInputs: ZkKycClaimInputs): PublicKey {
        // check the provided signature is by the publicKey defined in publicInputs issuer has signed 
        publicInputs.issuerSignature.verify(
          publicInputs.issuerPubKey, // can hardcode this value in too
          Bool(true).toFields(),
        ).assertTrue('Failed to verify issuer signature root signature by issuer.');

        return publicInputs.subjectStealthAddress.oneTimeAddress;
      },
    },
  },
});

/**
 * Class representation for the Attestation Proof derived from the ZkProgram `AttestSingleCredentialProperty`.
 * @public
 */
export class ZkKycProof extends Experimental.ZkProgram.Proof(ZkKycClaimProgram) {
  // we can add methods here
  static publicInput = this.prototype.publicInput
};