import { Field, Experimental, PublicKey, Bool, Struct, MerkleMapWitness } from 'snarkyjs';
import { CredentialPresentation, Rule, SignedClaim, stringToField } from '@herald-sdk/data-model';

export class PublicInputArgs extends Struct({
  issuerPubKey: PublicKey,
  subjectPubKey: PublicKey,
  provingRule: Rule
}) {
  constructor(issuerPubKey: PublicKey, subjectPubKey: PublicKey, provingRule: Rule) {
    super({issuerPubKey, subjectPubKey, provingRule});
  }
}

// NOTE: This ZkProgram only works for one field on a claim
// TODO: make this work for multiple fields on a claim - use a merge function that takes 
// a proof as an input and proves something else about another field on the claim recursively -- rollup style
export const AttestCredentials = Experimental.ZkProgram({
  publicInput: PublicInputArgs,

  methods: {
    attest: {
      privateInputs: [MerkleMapWitness, Field, SignedClaim, CredentialPresentation],

      method(publicInputs: PublicInputArgs, claim: MerkleMapWitness, claimValue: Field, signedClaim: SignedClaim, credentialPresentation: CredentialPresentation) {
        // check the Claim root is signed by the expected issuer
        signedClaim.signatureIssuer.verify(
          publicInputs.issuerPubKey,
          signedClaim.claimRoot.toFields(),
        ).assertTrue();
        // check the presentation is signed by the expected subject
        credentialPresentation.signatureSubject.verify(
          publicInputs.subjectPubKey,
          signedClaim.signatureIssuer.toFields(),
        ).assertTrue();

        const [computedRoot, _] = claim.computeRootAndKey(claimValue);
        computedRoot?.equals(signedClaim.claimRoot).assertTrue();

        let inferredValue: Bool | undefined;
        // assumption is the claimValue is Field representation of a number (e.g. if the claim is "age" and age is 18 then the claimValue is Field(18))
        // this should allow to perform comparisons on the claimValue
        // this should also work for checking if a string is equivalent to another string
        switch (publicInputs.provingRule.operation) {
          case stringToField('lt'):
            inferredValue = claimValue.lessThan(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('lte'):
            inferredValue = claimValue.lessThanOrEqual(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('eq'):
            inferredValue = claimValue.equals(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('gte'):
            inferredValue = claimValue.greaterThanOrEqual(Field.from(publicInputs.provingRule.value));
            break;
          case stringToField('gt'):
            inferredValue = claimValue.greaterThan(Field.from(publicInputs.provingRule.value));
            break;
        }

        inferredValue?.assertTrue();
      },
    },
  },
});

export class AttestationProof extends Experimental.ZkProgram.Proof(AttestCredentials){};