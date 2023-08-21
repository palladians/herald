import { Field, Experimental, Bool, MerkleMapWitness, PublicKey } from 'snarkyjs';
import { CredentialPresentation, SignedClaim, stringToField } from '@herald-sdk/data-model';
import { PublicInputIssuerArgs } from './utils/types';

/**
 * Handles comparison operations for a given claim value against a provided value.
 * 
 * @param claimValue - The claim value to be compared.
 * @param operation - The operation to perform (e.g., 'lt', 'lte', 'eq', 'gte', 'gt').
 * @param value - The value against which the claim value is compared.
 * 
 * @returns A Boolean indicating the result of the comparison.
 * @throws {Error} Throws an error if an invalid operation is provided.
 */
function handleOperation(claimValue: Field, operation: Field, value: Field): Bool | undefined {
  switch (operation) {
      case stringToField('lt'):
          return claimValue.lessThan(value);
      case stringToField('lte'):
          return claimValue.lessThanOrEqual(value);
      case stringToField('eq'):
          return claimValue.equals(value);
      case stringToField('gte'):
          return claimValue.greaterThanOrEqual(value);
      case stringToField('gt'):
          return claimValue.greaterThan(value);
      default:
        return undefined;
  }
}

/**
 * A ZkProgram for attesting a single property of a credential.
 * @remarks
 * Currently, this ZkProgram only supports one field of a claim. Future iterations should provide support for multiple fields.
 * Use-case includes combining multiple proofs to attest various fields in a rollup style.
 * 
 * @public
 */
export const AttestSingleCredentialPropertyPrivateSubject = Experimental.ZkProgram({
  publicInput: PublicInputIssuerArgs,

  methods: {
    attest: {
      privateInputs: [PublicKey, MerkleMapWitness, Field, SignedClaim, CredentialPresentation],

      /**
       * Attestation method to validate and prove claims.
       * @param publicInputs - The public inputs for the zk proof.
       * @param claim - A witness for the MerkleMap.
       * @param claimValue - The actual value of the claim.
       * @param signedClaim - A claim signed by the issuer.
       * @param credentialPresentation - A presentation of the credential, signed by the subject.
       * @remarks
       * The method checks the validity of the signatures and verifies the match of computed roots. It also infers value based on given operation rules.
       */

      method(publicInputs: PublicInputIssuerArgs, subjectPubKey: PublicKey, claim: MerkleMapWitness, claimValue: Field, signedClaim: SignedClaim, credentialPresentation: CredentialPresentation) {
        // check the Claim root is signed by the expected issuer
        signedClaim.signatureIssuer.verify(
          publicInputs.issuerPubKey,
          signedClaim.claimRoot.toFields(),
        ).assertTrue('Failed to verify claim root signature by issuer.');
        // check the presentation is signed by the expected subject
        credentialPresentation.signatureSubject.verify(
          subjectPubKey,
          signedClaim.signatureIssuer.toFields(),
        ).assertTrue('Failed to verify presentation signature by subject.');

        const [computedRoot, _] = claim.computeRootAndKey(claimValue);
        computedRoot?.equals(signedClaim.claimRoot).assertTrue('Computed root does not match signed claim root.');

        let inferredValue = handleOperation(claimValue, publicInputs.provingRule.operation, Field.from(publicInputs.provingRule.value));
        inferredValue?.assertTrue('No valid operation matched for the given input.');
      },
    },
  },
});

/**
 * Class representation for the Attestation Proof derived from the ZkProgram `AttestSingleCredentialProperty`.
 * @public
 */
export class AttestationProof extends Experimental.ZkProgram.Proof(AttestSingleCredentialProperty){};