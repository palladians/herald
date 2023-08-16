import { Field, PrivateKey, Signature, MerkleMap, Struct, MerkleMapWitness } from 'snarkyjs';
import { stringToField, claimToField, numberToField } from './utils'; 
import { ClaimType } from './types.js';

/**
 * A claim is a MerkleMap of key-value pairs
 * where the key is a string and the value is a ClaimType
 */
// TODO: make Claim<T> where T is a value
// technically the root of many claims can be stored on-chain by an issuer.
// making their merklemapp available off-chain via a DA layer would be an interesting solution
export class Claim {
  private map: MerkleMap;

  constructor() {
    this.map = new MerkleMap();
  }

  addField(key: string, value: ClaimType) {
    this.map.set(stringToField(key), claimToField(value));
  }

  getField(key: string): Field | undefined {
    return this.map.get(stringToField(key));
  }

  getRoot(): Field {
    return this.map.getRoot();
  }

  getWitness(key: string): MerkleMapWitness {
    return this.map.getWitness(stringToField(key));
  }
}

/**
 * A signed claim is a claim that has been signed by an issuer
 * the signature is a signature of the Claim root (where the Claim is a MerkleMap)
 */
export class SignedClaim extends Struct({
  claimRoot: Field,
  signatureIssuer: Signature
}) {
  constructor(claim?: Claim, issuerPrvKey?: PrivateKey, json?: any) {
    if (json) {
      const claimRoot = Field.fromJSON(json.claimRoot);
      const signatureIssuer = Signature.fromJSON(json.signatureIssuer);
      super({claimRoot, signatureIssuer});
    } else if (claim && issuerPrvKey) {
      const root = claim.getRoot();
      const signatureIssuer = Signature.create(issuerPrvKey, [root]);
      super({claimRoot: root, signatureIssuer});
    } else {
      throw new Error('Either provide json or both claim and issuerPrvKey to construct SignedClaim.');
    }
  }
  toJSON() {
    return {
      claimRoot: this.claimRoot.toJSON(),
      signatureIssuer: this.signatureIssuer.toJSON(),
    };
  }
}

/**
 * A credential presentation that can be used as a private/public input for a ZkProgram
 * or as a data structure attesting to being the owner of a credential
 */
export class CredentialPresentation extends Struct({
  signedClaim: SignedClaim,
  signatureSubject: Signature,
}) {
  constructor(signedClaim: SignedClaim, subjectPrvKey: PrivateKey) {
    const signatureIssuer = signedClaim.signatureIssuer;
    const signatureSubject = Signature.create(subjectPrvKey, signatureIssuer.toFields());
    super({signedClaim: signedClaim, signatureSubject: signatureSubject});
  }
}

/**
 * A proving rule is a rule that can be used to infer a claim from another claim
 * this can be provided by a challenger to a prover to a property on a claim
 */
export class Rule extends Struct({
  field: Field, // this is the field of the claim object NOT a Field snarkyjs type, it is converted to a field
  operation: Field, // lt, lte, eq, gte, gt
  value: Field, // the value to compare the field to
}) {
  constructor(field: string, operation: string, value: number | string | Field) {
    if (typeof value === "string") {
      value = stringToField(value);
    super({field: stringToField(field), operation: stringToField(operation), value: typeof value === "number" ? numberToField(value) : value});
    }
  }
}
