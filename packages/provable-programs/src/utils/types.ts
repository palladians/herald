import { Field, PublicKey, Struct, MerkleMapWitness, Proof } from 'snarkyjs';
import { Rule, CredentialPresentation, SignedClaim } from '@herald-sdk/data-model';

/**
 * A set of public input arguments for 
 * AttestSingleCredentialProperty
 * 
 * @remark this does not prioritize privacy 
 * since the subject is defined in the Struct
 */
export class PublicInputArgs extends Struct({
    issuerPubKey: PublicKey,
    subjectPubKey: PublicKey,
    provingRule: Rule
}) {
    constructor(issuerPubKey: PublicKey, subjectPubKey: PublicKey, provingRule: Rule) {
        super({ issuerPubKey, subjectPubKey, provingRule });
    }
}

/**
 * A set of public input arguments for 
 * AttestSingleCredentialProperty
 * 
 * @remark this does not prioritize privacy 
 * since the subject is defined in the Struct
 */
export class PublicInputIssuerArgs extends Struct({
    issuerPubKey: PublicKey,
    provingRule: Rule
}) {
    constructor(issuerPubKey: PublicKey, provingRule: Rule) {
        super({ issuerPubKey, provingRule });
    }
}


export type proveReturnType = {
    attestationProof: Proof<PublicInputArgs, PublicKey>,
};

// Define types for specific function arguments and return values.
export type AttestMethodType = (
    publicInputs: PublicInputArgs,
    claim: MerkleMapWitness, 
    claimValue: Field,
    signedClaim: SignedClaim,
    credentialPresentation: CredentialPresentation
) => Promise<proveReturnType>;

// Define the ZkProgramDetails structure
// TODO: rename as we already have ZkProgramsDetails
export type ZkProgramDetails = {
    verificationKey: string;
    compile: () => Promise<{ verificationKey: string }>; 
    attest: AttestMethodType;
};

export type ZkPDetails = Record<string, ZkProgramDetails>;

