import { Field, PublicKey, Struct, MerkleMapWitness, Proof } from 'snarkyjs';
import { Rule, CredentialPresentation, SignedClaim } from '@herald-sdk/data-model';

export class PublicInputArgs extends Struct({
    issuerPubKey: PublicKey,
    subjectPubKey: PublicKey,
    provingRule: Rule
}) {
    constructor(issuerPubKey: PublicKey, subjectPubKey: PublicKey, provingRule: Rule) {
        super({ issuerPubKey, subjectPubKey, provingRule });
    }
}

export type proveReturnType = {
    attestationProof: Proof<PublicInputArgs, void>,
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
export type ZkProgramDetails = {
    key: string;
    compile: () => Promise<{ verificationKey: string }>; 
    attest: AttestMethodType;
};

export type ZkPDetails = Record<string, ZkProgramDetails>;
