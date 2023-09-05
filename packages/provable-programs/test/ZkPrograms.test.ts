import { Field, MerkleMapWitness, PrivateKey, PublicKey } from "snarkyjs";
import { AttestSingleCredentialProperty } from "../src";
import { Claim, ClaimType, CredentialPresentation, Rule, SignedClaim, constructClaim, constructSignedClaim } from "@herald-sdk/data-model";

function create(claims: {[key: string]: ClaimType}, issuerPrvKey: PrivateKey | string): {claim: Claim, signedClaim: SignedClaim} {
    if (typeof issuerPrvKey === "string") {
        issuerPrvKey = PrivateKey.fromBase58(issuerPrvKey);
    }
    // constructs a Claim (MerkleMap) from a dictionary of claims
    const claim = constructClaim(claims);
    // construct a signed claim from a claim and a private key
    const signedClaim = constructSignedClaim(claim, issuerPrvKey);
    return {claim, signedClaim}
}

describe("AttestSingleCredentialProperty", () => {
    let subjectPrvKey: PrivateKey
    let issuerPrvKey: PrivateKey
    let wrongSubjectPrvKey: PrivateKey
    let claims: {[key: string]: ClaimType}
    let credential: {claim: Claim, signedClaim: SignedClaim}
    let rule: Rule
    let challenge: { issuerPubKey: PublicKey, subjectPubKey: PublicKey, provingRule: Rule }
    let property: string
    let operation: string
    let value: number
    let compiledArtifacts: { verificationKey: string }

    beforeAll(async () => {
        subjectPrvKey = PrivateKey.random();
        issuerPrvKey = PrivateKey.random();
        wrongSubjectPrvKey = PrivateKey.random();
        claims = {
            age: 21,
            subject: subjectPrvKey.toPublicKey()
        };

        credential = create(claims, issuerPrvKey);
        
        property = "age";
        operation = 'gte';
        value = 18;
        rule = new Rule(property, operation, value);

        const issuerPubKey = issuerPrvKey.toPublicKey();
        const subjectPubKey = subjectPrvKey.toPublicKey();
        challenge = { issuerPubKey, subjectPubKey, provingRule: rule };
        compiledArtifacts = await AttestSingleCredentialProperty.compile();
        console.log("compiledArtifacts", compiledArtifacts)
    });
/*
    it("should verify a valid credential", async () => {
        const { claim, signedClaim } = credential;
        const credentialPresentation = new CredentialPresentation(signedClaim, subjectPrvKey);
        const result = await AttestSingleCredentialProperty.attest(challenge, claim, claims.age, signedClaim, credentialPresentation);
        expect(result).toBeTruthy();
    });*/

    it("should fail to verify a signature from not the true subject", async () => {
        const { claim, signedClaim } = credential;
        const credentialPresentation = new CredentialPresentation(signedClaim, wrongSubjectPrvKey);
        const claimWitness = claim.getWitness(property) as MerkleMapWitness;
        const claimValue = claim.getField(property) as Field;
        console.log("verificationKey", compiledArtifacts.verificationKey)
        await expect(
            AttestSingleCredentialProperty.attest(challenge, claimWitness, claimValue, signedClaim, credentialPresentation)
        ).rejects.toThrowError("Failed to verify presentation signature by subject.");    
    });
/*
    it("should deterministically create the same verification key for the same ZkProgram", async () => {
        const program = await AttestSingleCredentialProperty.compile();
        const program2 = await AttestSingleCredentialProperty.compile();
        console.log("program.verificationKey", program.verificationKey)
        expect(program.verificationKey).toEqual(program2.verificationKey);
    });
*/

});