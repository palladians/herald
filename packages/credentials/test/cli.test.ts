import { execa } from 'execa';
import { PrivateKey } from 'snarkyjs';

describe('Credential CLI', () => {
    let issuerPrvKeyBase58: string;
    let claims: object;

    beforeAll(() => {
        const issuerPrvKey = PrivateKey.random();
        issuerPrvKeyBase58 = issuerPrvKey.toBase58();
        const subjectPublicKey = PrivateKey.random().toPublicKey();
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
                "id": "did:mina:" + subjectPublicKey.toBase58(),
                "degree": {
                    "type": "BachelorDegree",
                    "name": "Bachelor of Science and Arts"
                }
            }
        }
    });

    it('should create a new credential', async () => {
        // Execute the CLI command
        const result = await execa('pnpm', ['run', 'cli', 'create', '--claims', JSON.stringify(claims), '--issuerPrvKey', issuerPrvKeyBase58, '--save', './test/test_artifacts']);

        // Assert that the command executed successfully (non-zero exit code indicates failure)
        expect(result.exitCode).toBe(0);

        // Additional assertions, if needed...
    });

    // ... more tests for other commands/arguments
});
