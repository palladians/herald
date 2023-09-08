import { PrivateKey, verify } from "snarkyjs";
import { Rule } from "@herald-sdk/data-model";
import { Credential } from "../src"; 
import { describe, it } from '@jest/globals';
import { PublicInputArgs, ZkProgramsDetails } from "@herald-sdk/provable-programs";

describe('Credential', () => {
    let claims: object;
    let issuerPrvKey: PrivateKey;
    let subjectPrvKey: PrivateKey;
    let claimsString: string;
        
    beforeAll(() => {
      issuerPrvKey = PrivateKey.fromBase58("EKDhdt1SX7i1cp7KZRzqVdJDYUf16HqM4bGpUzF98jSh3hzZTZLr");
      subjectPrvKey = PrivateKey.fromBase58("EKE1c5UXWmKpzSZxkh67MPUeujYtoVppkGKrv3zC9CFXnWAzkktu")
      claims = {
          "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://www.w3.org/2018/credentials/examples/v1"
          ],
          "id": "http://example.edu/credentials/3732",
          "type": ["VerifiableCredential", "UniversityDegreeCredential"],
          "issuer": "https://example.edu/issuers/565049",
          "issuanceDate": new Date().toISOString(),
          "credentialSubject": {
              "id": subjectPrvKey.toPublicKey().toBase58(),
              "degree": {
                  "type": "BachelorDegree",
                  "name": "Bachelor of Science and Arts"
              }
          }
      }
      claimsString = JSON.stringify(claims);
    });
    it('can prove a claim', async () => {
        const credential = await Credential.create(claimsString, issuerPrvKey, subjectPrvKey.toPublicKey());
        // create rule to prove
        const property = "credentialSubject.degree.type";
        const operation = "eq";
        const value = "BachelorDegree";
        const rule = new Rule(property, operation, value);

        // create challenge
        const issuerPubKey = issuerPrvKey.toPublicKey();
        const subjectPubKey = subjectPrvKey.toPublicKey();
        const challenge: PublicInputArgs = {issuerPubKey, subjectPubKey, provingRule: rule};

        const zkPrgDetails = ZkProgramsDetails["AttestSingleCredentialProperty"];
        if (!zkPrgDetails) {
            throw new Error("ZkProgram not found");
        }
        
        const proofResponse = await credential.prove("age", challenge, subjectPrvKey, "AttestSingleCredentialProperty");
        console.log("proofResponse", proofResponse)
        console.log("attestationProof Verification: ", await verify(proofResponse.proof.toJSON(), zkPrgDetails.verificationKey));
        //fs.writeFileSync(path.join('./test/test_proofs', 'attestationProof.json'), JSON.stringify(attestationProof, null, 2));
        expect(verify(proofResponse.proof.toJSON(), zkPrgDetails.verificationKey)).toBeTruthy();
    });
});
