import fs from 'fs';
import path from 'path';
import { AttestationProof, KycProof } from '@herald-sdk/provable-programs';

// TODO: create generic utils for loading a proof from a file and converting it to a proof object
export function loadProofJSON(dir: string, file: string): string {
    const proofJSON = JSON.parse(fs.readFileSync(path.join('test', dir, file), 'utf8'));
    return JSON.stringify(proofJSON);
}
export function convertProof(proofJSON: string): AttestationProof {
    const proof = AttestationProof.fromJSON(JSON.parse(proofJSON));
    return proof;
}

export function convertProofToKycProof(proofJSON: string): KycProof {
    const proof = KycProof.fromJSON(JSON.parse(proofJSON));
    return proof;
}