import { PrivateKey, Proof, PublicKey } from "snarkyjs";
import { Claim, ClaimType, CredentialPresentation, SignedClaim, constructClaim, constructSignedClaim, flattenObject, stringToField } from "@herald-sdk/data-model";
import { PublicInputArgs, ZkProgramsDetails } from "@herald-sdk/provable-programs";
import { handleOperation, isClaimsObject } from "./utils";

export class Credential {
    public claim: Claim; // A MerkleMap
    public signedClaim: SignedClaim; // Signed MerkleMap Root by issuer
    public credential: {[key: string]: ClaimType} // A dictionary of claims
    public verifiableCredential: string // A verifiable credenital

    constructor(claim: Claim, signedClaim: SignedClaim, credential: {[key: string]: ClaimType}, verifiableCredential: string) {
        this.claim = claim;
        this.signedClaim = signedClaim;
        this.credential = credential;
        this.verifiableCredential = verifiableCredential;
    }
    
    public static create(stringClaims: string, issuerPrvKey: PrivateKey | string): Credential  {
        if (typeof issuerPrvKey === "string") {
            issuerPrvKey = PrivateKey.fromBase58(issuerPrvKey);
        }
        const parsedClaims = JSON.parse(stringClaims)
        let claims;
        if (!isClaimsObject(parsedClaims)) {
            claims = flattenObject(parsedClaims)
        } else {
            claims = parsedClaims;
        }
        // constructs a Claim (MerkleMap) from a dictionary of claims
        const claim = constructClaim(claims);
        // construct a signed claim from a claim and a private key
        const signedClaim = constructSignedClaim(claim, issuerPrvKey);
        // create verifiable credential - can be used to make proofs
        // this could also be the proof from a zkProgram
        const verifiableCredentialProofFields = {
            proof: signedClaim.toJSON()
        }
        // Add verifiableCredentialProofFields to parsedClaims
        const verifiableCredential = {
            ...parsedClaims,
            ...verifiableCredentialProofFields
        };
        return new Credential(claim, signedClaim, claims, verifiableCredential);
    }

    /**
     * 
     * @param parsedVerifiableCredential a JSON object of a verifiable credential
     * @returns a new Credential object
     * 
     */
    public static recreate(verifiableCredential: string): Credential {
        const parsedVerifiableCredential = JSON.parse(verifiableCredential)
        const {proof, ...claims} = parsedVerifiableCredential;
        const claim = constructClaim(flattenObject(claims)) // do not include `proof` field
        const signedClaim = new SignedClaim(undefined, undefined, proof)
        
        return new Credential(claim, signedClaim, flattenObject(claims), parsedVerifiableCredential);
    }

    public verify(issuerPubKey: PublicKey, subjectPubKey: PublicKey, subjectField: string): boolean {
        // verify the Credential is about the expected subject and was signed by the expected issuer
        const isValid = this.signedClaim.signatureIssuer.verify(
            issuerPubKey,
            [this.signedClaim.claimRoot],
        ).toBoolean();

        if (!isValid) {
            return false;
        }
        const subject = this.claim.getField(subjectField)?.equals(stringToField(subjectPubKey.toBase58())).toBoolean();
        if (!subject) {
            return false;
        }
        return true;
    }

    public async prove(claimKey: string, challenge: PublicInputArgs, subjectPrvKey: PrivateKey, ZkProgram: string): Promise<{proof: Proof<PublicInputArgs, void>, verifiablePresentation: any}> {
        const claimWitness = this.claim.getWitness(claimKey);
        const claimValue = this.claim.getField(claimKey);
        
        if (!claimValue) {
            throw new Error("Claim key not found");
        }
        
        const programDetails = ZkProgramsDetails[ZkProgram];
        if (!programDetails) {
            throw new Error("ZkProgram not found");
        }
        // TODO: change name of credentialPresentation
        const credentialPresentation = new CredentialPresentation(this.signedClaim, subjectPrvKey);
        
        console.log("compiling...");
        await programDetails.compile();
        console.log("compiling complete");

        console.log("proving...");
        const proof = await programDetails.attest(challenge, claimWitness, claimValue, this.signedClaim, credentialPresentation);
        console.log("proving complete");
        /*
         we need to return a verifiable presentation 
         - Presentation metadata
         - verifiable credentials
         - proof(s)
        
        criteria:
        - Each derived verifiable credential within a verifiable presentation MUST contain all information 
        necessary to verify the verifiable credential, either by including it directly within the credential, 
        or by referencing the necessary information.
        - A verifiable presentation MUST NOT leak information that would enable the verifier to correlate the
         holder across multiple verifiable presentations.
        - The verifiable presentation SHOULD contain a proof property to enable the verifier to check that all 
        derived verifiable credentials in the verifiable presentation were issued to the same holder without 
        leaking personally identifiable information that the holder did not intend to share.

         */

        const verifiablePresentation = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "type": "VerifiablePresentation",
            "verifiableCredential": [
                {
                "@context": [
                "https://www.w3.org/2018/credentials/v1",
              "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "type": ["VerifiableCredential", "UniversityDegreeCredential"],
            "credentialSchema": {
                // TODO: replace
                "id": "did:example:cdf:35LB7w9ueWbagPL94T9bMLtyXDj9pX5o",
                "type": "did:example:schema:22KpkXgecryx9k7N6XN1QoN3gXwBkSU8SfyyYQG"
            },
            "issuer": "did:example:Wz4eUg7SetGfaUVCn8U9d62oDYrUJLuUtcy619",
            "credentialSubject": {
                // describes the public inputs
                "field": claimKey,
                "operation:" : handleOperation(challenge.provingRule.operation),
                "value": challenge.provingRule.value
            },
        }],
        "proof" : proof.attestationProof.toJSON()
        }
        return { proof: proof.attestationProof, verifiablePresentation: verifiablePresentation };
    }
}