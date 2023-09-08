import { Experimental, Bool, PublicKey, Struct, Signature } from 'snarkyjs';

export class KycClaimInputs extends Struct({
  issuerPubKey: PublicKey,
  subjectPubKey: PublicKey,
  kycPassed: Bool,
  issuerSignature: Signature
}) {
  constructor(issuerPubKey: PublicKey, subjectPubKey: PublicKey, kycPassed: Bool, issuerSignature: Signature) {
      super({ issuerPubKey, subjectPubKey, kycPassed, issuerSignature });
  }
}

/**
 *
 */
export const KycClaimProgram = Experimental.ZkProgram({
  publicInput: KycClaimInputs,
  publicOutput: PublicKey,

  methods: {
    createKycClaimProof: {
      privateInputs: [],
      method(publicInputs: KycClaimInputs): PublicKey {
        // check the provided signature is by the publicKey defined in publicInputs issuer has signed 
        publicInputs.issuerSignature.verify(
          publicInputs.issuerPubKey, // can hardcode this value in too
          Bool(true).toFields(),
        ).assertTrue('Failed to verify issuer signature root signature by issuer.');

        return publicInputs.subjectPubKey;
      },
    },
  },
});

/**
 * Class representation for the Attestation Proof derived from the ZkProgram `AttestSingleCredentialProperty`.
 * @public
 */
export class KycProof extends Experimental.ZkProgram.Proof(KycClaimProgram) {
  // we can add methods here
  static publicInput = this.prototype.publicInput
};