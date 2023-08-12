import { AttestSingleCredentialProperty } from "../src";


describe("ZkPrograms", () => {
    it("should deterministically create the same verification key for the same ZkProgram", async () => {
        const program = await AttestSingleCredentialProperty.compile();
        const program2 = await AttestSingleCredentialProperty.compile();
        console.log("program.verificationKey", program.verificationKey)
        expect(program.verificationKey).toEqual(program2.verificationKey);
    });
});