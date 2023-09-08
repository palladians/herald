import { Bool, PrivateKey, Proof, PublicKey, Signature } from "snarkyjs";
import { Claim, ClaimType, CredentialPresentation, SignedClaim, constructClaim, constructSignedClaim, flattenObject, stringToField } from "@herald-sdk/data-model";
import { PublicInputArgs, ZkProgramsDetails, KycClaimProgram, KycClaimInputs } from "@herald-sdk/provable-programs";
import { handleOperation, isClaimsObject } from "./utils";


/**
 * This `Credential` class is focused on issuing a verifiable
 * credential to a holder/subject. The holder/subject can then 
 * use that credential, specifically its `proof` field, as arguments
 * to ZkPrograms or Smart Contracts.
 * 
 * However, this `Credential` class can also be used to attest to
 * various properties about a credential per some constraint (e.g. a `Rule`)
 */
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
    // TODO:
    // Create should also abstract over proving, because constructing a `proof` is necessary
    public static async create(stringClaims: string, issuerPrvKey: PrivateKey | string, subjectPubKey: PublicKey | string): Promise<Credential>  {
        if (typeof issuerPrvKey === "string") {
            issuerPrvKey = PrivateKey.fromBase58(issuerPrvKey);
        }
        if (typeof subjectPubKey === "string") {
            subjectPubKey = PublicKey.fromBase58(subjectPubKey)
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
        // hardcoded to kyc program but should make configurable
        // TODO: Make this an argument of `create()`
        await KycClaimProgram.compile();
        const signatureIssuer = Signature.create(issuerPrvKey, Bool(true).toFields())
        const zkProgramInputs = new KycClaimInputs(issuerPrvKey.toPublicKey(), subjectPubKey, Bool(true), signatureIssuer)
        const proof = await KycClaimProgram.createKycClaimProof(zkProgramInputs)
        const verifiableCredentialProofFields = {
            proof: proof.toJSON()
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

    // TODO: Improve this to prove arbitary claims only and not generate verifiable credentials
    // Change name from prove to attest
    /**
     * 
     * @param claimKey 
     * @param challenge 
     * @param subjectPrvKey 
     * @param ZkProgram 
     * @returns 
     * THIS IS AN EXPERIMENTAL METHOD
     */
    public async prove(claimKey: string, challenge: PublicInputArgs, subjectPrvKey: PrivateKey, ZkProgram: string): Promise<{proof: Proof<PublicInputArgs, PublicKey>, verifiableCredential: any}> {
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

        // this is actually a verifiable credential
        // TODO: move this to create
        const verifiableCredential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://www.w3.org/2018/credentials/examples/v1"
            ],
            "type": "verifiableCredential",
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
        return { proof: proof.attestationProof, verifiableCredential: verifiableCredential };
    }
}