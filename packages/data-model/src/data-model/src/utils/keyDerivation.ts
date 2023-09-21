import { PrivateKey, Poseidon } from "o1js";

export type KeyPairs = {
    s: string,
    S: string,
    v: string,
    V: string
}

export function deriveKeyPairs(privateKey: string): KeyPairs {
    const privSpendKeyBase58 = privateKey;
    // Derive the private view key from the private spend key using Poseidon hash.
    const privViewKey = PrivateKey.fromBigInt(Poseidon.hash(PrivateKey.fromBase58(privSpendKeyBase58).toFields()).toBigInt());
    // Convert the private view key to its corresponding public view key.
    const pubViewKey = privViewKey.toPublicKey();
    // Derive the public spend key from the private spend key.
    const pubSpendKey = PrivateKey.fromBase58(privSpendKeyBase58).toPublicKey();
    return {
        s: privSpendKeyBase58,
        S: pubSpendKey.toBase58(),
        v: privViewKey.toBase58(),
        V: pubViewKey.toBase58()
    }
}