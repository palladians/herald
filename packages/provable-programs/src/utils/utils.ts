import fs from 'fs';
import path from 'path';
import { AttestationProof } from '../AttestSingleCredentialProperty';

// TODO: create generic utils for loading a proof from a file and converting it to a proof object
export function loadProofJSON(): string {
    const proofJSON = JSON.parse(fs.readFileSync(path.join('test', 'test_proofs', 'attestationProof.json'), 'utf8'));
    return JSON.stringify(proofJSON);
}
export function convertProof(proofJSON: string): AttestationProof {
    const proof = AttestationProof.fromJSON(JSON.parse(proofJSON));
    return proof;
}