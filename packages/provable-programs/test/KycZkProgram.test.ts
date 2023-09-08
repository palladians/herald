import { PrivateKey, PublicKey, Bool, Signature, verify } from "snarkyjs";
import { KycClaimProgram, KycClaimInputs, KycProof } from "../src";


describe("AttestSingleCredentialProperty", () => {
    let subjectPrvKey: PrivateKey
    let issuerPrvKey: PrivateKey
    let issuerPubKey: PublicKey
    let subjectPubKey: PublicKey
    let compiledArtifacts: { verificationKey: string }

    beforeAll(async () => {
        subjectPrvKey = PrivateKey.fromBase58("EKE1c5UXWmKpzSZxkh67MPUeujYtoVppkGKrv3zC9CFXnWAzkktu");
        issuerPrvKey = PrivateKey.fromBase58("EKDhdt1SX7i1cp7KZRzqVdJDYUf16HqM4bGpUzF98jSh3hzZTZLr");
        issuerPubKey = issuerPrvKey.toPublicKey();
        subjectPubKey = subjectPrvKey.toPublicKey();
        compiledArtifacts = await KycClaimProgram.compile();
        console.log("compiledArtifacts", compiledArtifacts)
    });

    it("should fail to verify a signature from not the true subject", async () => {
        const issuerSignature = Signature.create(issuerPrvKey, Bool(true).toFields())
        const publicInputs = new KycClaimInputs(issuerPubKey, subjectPubKey, Bool(true), issuerSignature)
        const proof = await KycClaimProgram.createKycClaimProof(publicInputs)
        expect(verify(proof, compiledArtifacts.verificationKey))
        const proofType = KycProof.fromJSON(proof.toJSON())
        console.log("proof.publicInput", proofType.publicInput)
    })
});