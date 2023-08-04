import { PublicKey } from "snarkyjs";
import { ClaimType } from "../src/types"
import { flattenObject } from "../src/utils";

export function createMockCredential(subjectPublicKey: PublicKey): {[key: string]: ClaimType} {
    const credential = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://www.w3.org/2018/credentials/examples/v1"
        ],
        "id": "http://example.edu/credentials/3732",
        "type": ["VerifiableCredential", "UniversityDegreeCredential"],
        "issuer": "https://example.edu/issuers/565049",
        "issuanceDate": new Date().toISOString(),
        "credentialSubject": {
            "id": "did:mina:" + subjectPublicKey.toBase58(),
            "degree": {
                "type": "BachelorDegree",
                "name": "Bachelor of Science and Arts"
            }
        }
    }
    return flattenObject(credential);
}