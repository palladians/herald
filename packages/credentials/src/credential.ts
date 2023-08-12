import { Poseidon, PrivateKey, Proof, PublicKey } from "snarkyjs";
import { Claim, ClaimType, CredentialPresentation, SignedClaim, constructClaim, constructSignedClaim } from "@herald-sdk/data-model";
import { PublicInputArgs, ZkProgramsDetails } from "@herald-sdk/provable-programs";

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

    // should take arguments that include those from a challenge object provided to the owner of the credentials
    // A challenge can include asserting e.g. the claim "age" is greater than 18, the claim is signed by an expected issuer, etc.
    // this should be a ZkProgram & must include the signature of the subject
    // TODO: provide the verification key as an argument to the function, so that the prover knows which
    // ZkProgram the challenger/verifier expects. This is necessary to constrain the prover to a specific ZkProgram.
    public async prove(claimKey: string, challenge: PublicInputArgs, subjectPrvKey: PrivateKey, ZkProgram: string): Promise<Proof<PublicInputArgs, void>> {
        const claimWitness = this.claim.getWitness(claimKey);
        const claimValue = this.claim.getField(claimKey);
        
        if (!claimValue) {
            throw new Error("Claim key not found");
        }
        
        const programDetails = ZkProgramsDetails[ZkProgram];
        if (!programDetails) {
            throw new Error("ZkProgram not found");
        }

        const credentialPresentation = new CredentialPresentation(this.signedClaim, subjectPrvKey);
    
        console.log("proving...");
        const proof = await programDetails.attest(challenge, claimWitness, claimValue, this.signedClaim, credentialPresentation);
        console.log("proving complete");
        return proof.attestationProof;
    }
}
