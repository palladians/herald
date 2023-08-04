import { Poseidon, PrivateKey, Proof, PublicKey } from "snarkyjs";
import { Claim, ClaimType, CredentialPresentation, Rule, SignedClaim, constructClaim, constructSignedClaim } from "@herald/data-model";
import {AttestCredentials, PublicInputArgs} from "@herald/provable-programs";

export type proveReturnType = {
    attestationProof: Proof<PublicInputArgs, void>,
    verificationKey: string,
}

export class Credential {
    public claim: Claim; // A MerkleMap
    public signedClaim: SignedClaim; // Signed MerkleMap Root by issuer
    public credential: {[key: string]: ClaimType} // A dictionary of claims

    constructor(claim: Claim, signedClaim: SignedClaim, credential: {[key: string]: ClaimType}) {
        this.claim = claim;
        this.signedClaim = signedClaim;
        this.credential = credential;
    }
    // TODO: change `create` to `issue`
    public static create(claims: {[key: string]: ClaimType}, issuerPrvKey: PrivateKey): Credential {
        // constructs a Claim (MerkleMap) from a dictionary of claims
        const claim = constructClaim(claims);
        // construct a signed claim from a claim and a private key
        const signedClaim = constructSignedClaim(claim, issuerPrvKey);
        return new Credential(claim, signedClaim, claims);
    }

    public verify(issuerPubKey: PublicKey, subjectPubKey: PublicKey): boolean {
        // verify the Credential is about the expected subject and was signed by the expected issuer
        const isValid = this.signedClaim.signatureIssuer.verify(
            issuerPubKey,
            [this.signedClaim.claimRoot],
        ).toBoolean();
        if (!isValid) {
            return false;
        }
        const subject = this.claim.getField("subject")?.equals(Poseidon.hash(subjectPubKey.toFields())).toBoolean();
        if (!subject) {
            return false;
        }
        return true;
    }

    // TODO: make an arbitrary proof about the credentials (e.g. that the subject is over 18)
    // should take arguments that include those from a challenge object provided to the owner of the credentials
    // A challenge can include asserting e.g. the claim "age" is greater than 18, the claim is signed by an expected issuer, etc.
    // this should be a ZkProgram & must include the signature of the subject
    public async prove(claimKey: string, issuerPubKey: PublicKey, rule: Rule, subjectPrvKey: PrivateKey): Promise<proveReturnType> {
        const claimWitness = this.claim.getWitness(claimKey);
        const claimValue = this.claim.getField(claimKey);
        if (!claimValue) {
            throw new Error("Claim key not found");
        }
        const credentialPresentation = new CredentialPresentation(this.signedClaim, subjectPrvKey);
        
        const publicInputs = new PublicInputArgs(issuerPubKey, subjectPrvKey.toPublicKey(), rule);
        console.log("compiling...")
        const { verificationKey } = await AttestCredentials.compile();
        console.log("compiling complete")
        console.log("proving...")
        const proof = await AttestCredentials.attest(publicInputs, claimWitness, claimValue, this.signedClaim, credentialPresentation);
        console.log("proving complete")
        return { attestationProof: proof, verificationKey: verificationKey };
    }
}
